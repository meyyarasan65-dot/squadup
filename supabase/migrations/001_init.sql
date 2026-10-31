-- =============================================================================
-- Hackathon Matchmaker — initial schema
--
-- Follows the base spec, with these hardening changes (each marked HARDENING):
--   * invites: `unique(team_id, user_id, status)` replaced by a partial unique
--     index on pending invites, so a pair can have any number of past
--     declined/expired invites but only one live one.
--   * invites insert policy: the sender must be the party the direction claims
--     (leader for team_to_user, the user themself for user_to_team).
--   * teams insert policy: leader_id must be the caller.
--   * accept_team_invite: authorizes the caller, locks the TEAM row (not just
--     the invite) so two different invites cannot both take the last slot,
--     and only marks genuinely pending invites as expired.
--   * profiles: column-level grants so users cannot self-write verified_skills
--     or github_stats (those come only from the server-side GitHub sync).
--   * All SECURITY DEFINER functions pin search_path.
-- Additions needed by the spec's scoring formula:
--   * teams.tech_stack     — the team's desired languages (LanguageOverlap)
--   * event_registrations  — who registered for which event (EventRegistered)
--   * profiles.onboarded   — first-login role selection
-- =============================================================================

create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  college text not null default 'Knowledge Institute of Technology',
  github_username text unique not null,
  avatar_url text,
  bio text,
  primary_role text not null check (primary_role in ('frontend', 'backend', 'fullstack', 'ai_ml', 'ui_ux', 'devops', 'mobile')),
  verified_skills jsonb default '{}'::jsonb,
  github_stats jsonb default '{}'::jsonb,
  is_looking_for_team boolean default true,
  onboarded boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  organizer text not null,
  description text,
  themes text[] not null default '{}',
  registration_deadline timestamptz not null,
  event_start timestamptz not null,
  team_min_size int default 2,
  team_max_size int default 4,
  created_at timestamptz default now(),
  check (team_min_size >= 1 and team_max_size >= team_min_size)
);

create table public.teams (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  leader_id uuid references public.profiles(id) on delete cascade not null,
  team_name text not null,
  pitch text,
  target_roles text[] not null default '{}',
  tech_stack text[] not null default '{}',
  is_locked boolean default false,
  created_at timestamptz default now()
);

create table public.team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role_assigned text not null,
  joined_at timestamptz default now(),
  unique(team_id, user_id)
);

create table public.event_registrations (
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (event_id, user_id)
);

create type invite_status as enum ('pending', 'accepted', 'declined', 'expired');
create type invite_direction as enum ('team_to_user', 'user_to_team');

create table public.invites (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  direction invite_direction not null,
  status invite_status default 'pending',
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz default now()
);

-- HARDENING: at most one live invite per (team, user).
create unique index invites_one_pending_per_pair
  on public.invites(team_id, user_id) where status = 'pending';

-- -----------------------------------------------------------------------------
-- Indices
-- -----------------------------------------------------------------------------

create index idx_profiles_role on public.profiles(primary_role);
create index idx_profiles_looking on public.profiles(is_looking_for_team);
create index idx_teams_event on public.teams(event_id);
create index idx_teams_leader on public.teams(leader_id);
create index idx_team_members_user on public.team_members(user_id);
create index idx_invites_lookup on public.invites(team_id, user_id, status);
create index idx_invites_user on public.invites(user_id, status);
create index idx_event_registrations_user on public.event_registrations(user_id);

-- -----------------------------------------------------------------------------
-- updated_at maintenance
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Profile bootstrap: every GitHub sign-up gets a profile row immediately.
-- primary_role starts as 'fullstack' and onboarded=false; the app routes the
-- user to the profile editor to pick their real role.
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_username text := coalesce(
    nullif(v_meta->>'user_name', ''),
    nullif(v_meta->>'preferred_username', ''),
    'user-' || substr(new.id::text, 1, 8)
  );
begin
  -- A renamed/recreated GitHub account can collide with an existing username;
  -- never let that fail the sign-up itself.
  if exists (select 1 from public.profiles where github_username = v_username) then
    v_username := v_username || '-' || substr(new.id::text, 1, 6);
  end if;

  insert into public.profiles (id, full_name, github_username, avatar_url, primary_role)
  values (
    new.id,
    coalesce(nullif(v_meta->>'full_name', ''), nullif(v_meta->>'name', ''), v_username),
    v_username,
    v_meta->>'avatar_url',
    'fullstack'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.invites enable row level security;
alter table public.event_registrations enable row level security;

create policy "Public profiles are readable by everyone" on public.profiles
  for select using (true);
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- HARDENING: verified_skills / github_stats are written only by the server sync.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, college, bio, primary_role, is_looking_for_team, onboarded)
  on public.profiles to authenticated;

create policy "Events are viewable by everyone" on public.events
  for select using (true);

create policy "Teams are viewable by everyone" on public.teams
  for select using (true);
create policy "Authenticated users can create teams" on public.teams
  for insert with check (auth.uid() = leader_id);
create policy "Team leaders can update their teams" on public.teams
  for update using (auth.uid() = leader_id) with check (auth.uid() = leader_id);

revoke update on public.teams from anon, authenticated;
grant update (team_name, pitch, target_roles, tech_stack, is_locked)
  on public.teams to authenticated;

create policy "Team members are viewable by everyone" on public.team_members
  for select using (true);

create policy "Registrations are viewable by everyone" on public.event_registrations
  for select using (true);
create policy "Users register themselves" on public.event_registrations
  for insert with check (auth.uid() = user_id);
create policy "Users unregister themselves" on public.event_registrations
  for delete using (auth.uid() = user_id);

create policy "Invites viewable by participating user or team leader" on public.invites
  for select using (
    auth.uid() = user_id
    or auth.uid() in (select leader_id from public.teams where id = team_id)
  );
-- HARDENING: the sender must actually be the party the direction claims.
create policy "Authenticated users can send invites/requests" on public.invites
  for insert with check (
    status = 'pending'
    and (
      (direction = 'user_to_team' and auth.uid() = user_id)
      or (direction = 'team_to_user'
          and auth.uid() in (select leader_id from public.teams where id = team_id))
    )
  );
-- Status transitions go exclusively through the RPCs below.

-- -----------------------------------------------------------------------------
-- RPC: create a team and seat its leader atomically
-- -----------------------------------------------------------------------------

create or replace function public.create_team(
  p_event_id uuid,
  p_team_name text,
  p_pitch text,
  p_target_roles text[],
  p_tech_stack text[]
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_deadline timestamptz;
  v_role text;
  v_team_id uuid;
begin
  if v_uid is null then
    return json_build_object('success', false, 'error', 'Not authenticated');
  end if;

  select registration_deadline into v_deadline from public.events where id = p_event_id;
  if not found then
    return json_build_object('success', false, 'error', 'Event does not exist');
  end if;
  if v_deadline < now() then
    return json_build_object('success', false, 'error', 'Registration for this event has closed');
  end if;

  -- Serialize per-user team creation so a double-submit cannot create two teams.
  perform 1 from public.profiles where id = v_uid for update;

  if exists (
    select 1 from public.team_members tm
    join public.teams t on t.id = tm.team_id
    where tm.user_id = v_uid and t.event_id = p_event_id
  ) then
    return json_build_object('success', false, 'error', 'You are already on a team for this event');
  end if;

  select primary_role into v_role from public.profiles where id = v_uid;

  insert into public.teams (event_id, leader_id, team_name, pitch, target_roles, tech_stack)
  values (p_event_id, v_uid, p_team_name, p_pitch, coalesce(p_target_roles, '{}'), coalesce(p_tech_stack, '{}'))
  returning id into v_team_id;

  insert into public.team_members (team_id, user_id, role_assigned)
  values (v_team_id, v_uid, coalesce(v_role, 'Member'));

  insert into public.event_registrations (event_id, user_id)
  values (p_event_id, v_uid)
  on conflict do nothing;

  return json_build_object('success', true, 'team_id', v_team_id);
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: send an invite (team_to_user) or join request (user_to_team)
-- Expiry is enforced lazily here as well as by the daily cron: a pair's stale
-- pending invite is expired first so it never blocks a fresh one.
-- -----------------------------------------------------------------------------

create or replace function public.send_team_invite(
  p_team_id uuid,
  p_user_id uuid,
  p_direction public.invite_direction
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_leader_id uuid;
  v_event_id uuid;
  v_is_locked boolean;
  v_max_count int;
  v_deadline timestamptz;
  v_count int;
  v_invite_id uuid;
begin
  if v_uid is null then
    return json_build_object('success', false, 'error', 'Not authenticated');
  end if;

  select t.leader_id, t.event_id, coalesce(t.is_locked, false), e.team_max_size, e.registration_deadline
    into v_leader_id, v_event_id, v_is_locked, v_max_count, v_deadline
  from public.teams t
  join public.events e on e.id = t.event_id
  where t.id = p_team_id;

  if not found then
    return json_build_object('success', false, 'error', 'Team does not exist');
  end if;
  if p_direction = 'team_to_user' and v_uid <> v_leader_id then
    return json_build_object('success', false, 'error', 'Only the team leader can send invites');
  end if;
  if p_direction = 'user_to_team' and v_uid <> p_user_id then
    return json_build_object('success', false, 'error', 'You can only request to join for yourself');
  end if;
  if v_deadline < now() then
    return json_build_object('success', false, 'error', 'Registration for this event has closed');
  end if;
  if v_is_locked then
    return json_build_object('success', false, 'error', 'Team is locked by its leader');
  end if;

  select count(*) into v_count from public.team_members where team_id = p_team_id;
  if v_count >= v_max_count then
    return json_build_object('success', false, 'error', 'Team is already full');
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    return json_build_object('success', false, 'error', 'User does not exist');
  end if;

  if exists (
    select 1 from public.team_members tm
    join public.teams t on t.id = tm.team_id
    where tm.user_id = p_user_id and t.event_id = v_event_id
  ) then
    return json_build_object('success', false, 'error',
      case when p_user_id = v_uid then 'You are already on a team for this event'
           else 'That person is already on a team for this event' end);
  end if;

  update public.invites set status = 'expired'
  where team_id = p_team_id and user_id = p_user_id
    and status = 'pending' and expires_at < now();

  insert into public.invites (team_id, user_id, direction)
  values (p_team_id, p_user_id, p_direction)
  returning id into v_invite_id;

  return json_build_object('success', true, 'invite_id', v_invite_id);
exception
  when unique_violation then
    return json_build_object('success', false, 'error',
      'There is already a pending invite between this team and this person');
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: atomic invite acceptance
-- -----------------------------------------------------------------------------

create or replace function public.accept_team_invite(p_invite_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_team_id uuid;
  v_user_id uuid;
  v_direction public.invite_direction;
  v_status public.invite_status;
  v_expires_at timestamptz;
  v_leader_id uuid;
  v_event_id uuid;
  v_is_locked boolean;
  v_current_count int;
  v_max_count int;
  v_deadline timestamptz;
  v_role text;
begin
  select team_id, user_id, direction, status, expires_at
    into v_team_id, v_user_id, v_direction, v_status, v_expires_at
  from public.invites
  where id = p_invite_id
  for update;

  if not found then
    return json_build_object('success', false, 'error', 'Invite does not exist');
  end if;

  -- HARDENING: lock the team row. Every acceptance into this team now queues
  -- here, so the capacity check below cannot race with another invite.
  select leader_id, event_id, coalesce(is_locked, false)
    into v_leader_id, v_event_id, v_is_locked
  from public.teams
  where id = v_team_id
  for update;

  -- HARDENING: only the receiving party may accept.
  if v_uid is null
     or (v_direction = 'team_to_user' and v_uid <> v_user_id)
     or (v_direction = 'user_to_team' and v_uid <> v_leader_id) then
    return json_build_object('success', false, 'error', 'You are not allowed to accept this invite');
  end if;

  if v_status <> 'pending' then
    return json_build_object('success', false, 'error', 'Invite is expired or already resolved');
  end if;

  if v_expires_at < now() then
    update public.invites set status = 'expired' where id = p_invite_id;
    return json_build_object('success', false, 'error', 'Invite is expired or already resolved');
  end if;

  if v_is_locked then
    return json_build_object('success', false, 'error', 'Team is locked by its leader');
  end if;

  select e.team_max_size, e.registration_deadline into v_max_count, v_deadline
  from public.events e where e.id = v_event_id;

  if v_deadline < now() then
    return json_build_object('success', false, 'error', 'Registration for this event has closed');
  end if;

  select count(*) into v_current_count from public.team_members where team_id = v_team_id;

  if v_current_count >= v_max_count then
    return json_build_object('success', false, 'error', 'Team is already full');
  end if;

  if exists (
    select 1 from public.team_members tm
    join public.teams t on t.id = tm.team_id
    where tm.user_id = v_user_id and t.event_id = v_event_id
  ) then
    return json_build_object('success', false, 'error', 'Already on a team for this event');
  end if;

  select primary_role into v_role from public.profiles where id = v_user_id;

  insert into public.team_members (team_id, user_id, role_assigned)
  values (v_team_id, v_user_id, coalesce(v_role, 'Member'));

  update public.profiles set is_looking_for_team = false where id = v_user_id;
  update public.invites set status = 'accepted' where id = p_invite_id;

  insert into public.event_registrations (event_id, user_id)
  values (v_event_id, v_user_id)
  on conflict do nothing;

  -- Anti-ghosting cleanup: the user is off the market for this event...
  update public.invites i set status = 'expired'
  from public.teams t
  where i.team_id = t.id
    and t.event_id = v_event_id
    and i.user_id = v_user_id
    and i.status = 'pending'
    and i.id <> p_invite_id;

  -- ...and if that was the final slot, nobody else is left waiting on this team.
  if v_current_count + 1 >= v_max_count then
    update public.invites set status = 'expired'
    where team_id = v_team_id and status = 'pending';
  end if;

  return json_build_object('success', true, 'team_id', v_team_id);
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: decline (receiver) or cancel (sender) a pending invite
-- -----------------------------------------------------------------------------

create or replace function public.decline_team_invite(p_invite_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_user_id uuid;
  v_leader_id uuid;
  v_status public.invite_status;
begin
  select i.user_id, t.leader_id, i.status into v_user_id, v_leader_id, v_status
  from public.invites i
  join public.teams t on t.id = i.team_id
  where i.id = p_invite_id
  for update of i;

  if not found then
    return json_build_object('success', false, 'error', 'Invite does not exist');
  end if;
  if v_uid is null or (v_uid <> v_user_id and v_uid <> v_leader_id) then
    return json_build_object('success', false, 'error', 'You are not part of this invite');
  end if;
  if v_status <> 'pending' then
    return json_build_object('success', false, 'error', 'Invite is already resolved');
  end if;

  update public.invites set status = 'declined' where id = p_invite_id;
  return json_build_object('success', true);
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: leave a team (leadership passes to the longest-serving member; an empty
-- team is dissolved)
-- -----------------------------------------------------------------------------

create or replace function public.leave_team(p_team_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_leader_id uuid;
  v_successor uuid;
begin
  select leader_id into v_leader_id from public.teams where id = p_team_id for update;
  if not found then
    return json_build_object('success', false, 'error', 'Team does not exist');
  end if;

  delete from public.team_members where team_id = p_team_id and user_id = v_uid;
  if not found then
    return json_build_object('success', false, 'error', 'You are not on this team');
  end if;

  update public.profiles set is_looking_for_team = true where id = v_uid;

  if v_leader_id = v_uid then
    select user_id into v_successor from public.team_members
    where team_id = p_team_id order by joined_at asc limit 1;

    if v_successor is null then
      delete from public.teams where id = p_team_id;
      return json_build_object('success', true, 'dissolved', true);
    end if;
    update public.teams set leader_id = v_successor where id = p_team_id;
  end if;

  return json_build_object('success', true, 'dissolved', false);
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: leader removes a member
-- -----------------------------------------------------------------------------

create or replace function public.remove_team_member(p_team_id uuid, p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_leader_id uuid;
begin
  select leader_id into v_leader_id from public.teams where id = p_team_id for update;
  if not found then
    return json_build_object('success', false, 'error', 'Team does not exist');
  end if;
  if v_uid is null or v_uid <> v_leader_id then
    return json_build_object('success', false, 'error', 'Only the team leader can remove members');
  end if;
  if p_user_id = v_leader_id then
    return json_build_object('success', false, 'error', 'Leaders leave instead of removing themselves');
  end if;

  delete from public.team_members where team_id = p_team_id and user_id = p_user_id;
  if not found then
    return json_build_object('success', false, 'error', 'That user is not on this team');
  end if;

  update public.profiles set is_looking_for_team = true where id = p_user_id;
  return json_build_object('success', true);
end;
$$;

-- -----------------------------------------------------------------------------
-- RPC: prune stale invites (called by the daily cron with the service role)
-- -----------------------------------------------------------------------------

create or replace function public.expire_stale_invites()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  update public.invites set status = 'expired'
  where status = 'pending' and expires_at < now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.create_team(uuid, text, text, text[], text[]) from public, anon;
revoke all on function public.send_team_invite(uuid, uuid, public.invite_direction) from public, anon;
revoke all on function public.accept_team_invite(uuid) from public, anon;
revoke all on function public.decline_team_invite(uuid) from public, anon;
revoke all on function public.leave_team(uuid) from public, anon;
revoke all on function public.remove_team_member(uuid, uuid) from public, anon;
revoke all on function public.expire_stale_invites() from public, anon, authenticated;

grant execute on function public.create_team(uuid, text, text, text[], text[]) to authenticated;
grant execute on function public.send_team_invite(uuid, uuid, public.invite_direction) to authenticated;
grant execute on function public.accept_team_invite(uuid) to authenticated;
grant execute on function public.decline_team_invite(uuid) to authenticated;
grant execute on function public.leave_team(uuid) to authenticated;
grant execute on function public.remove_team_member(uuid, uuid) to authenticated;
grant execute on function public.expire_stale_invites() to service_role;

-- -----------------------------------------------------------------------------
-- Realtime: stream invite changes (RLS still filters what each client sees)
-- -----------------------------------------------------------------------------

alter publication supabase_realtime add table public.invites;
