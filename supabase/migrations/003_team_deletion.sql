-- =============================================================================
-- Migration 003: Team Leader Deletion Functionality
-- Allows team leaders to completely disband and delete their team.
-- =============================================================================

-- Allow team leaders to delete their own teams
create policy "Team leaders can delete their teams" on public.teams
  for delete using (auth.uid() = leader_id);

-- Atomic RPC function to delete a team and reset member availability
create or replace function public.delete_team(p_team_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_leader_id uuid;
  v_member_ids uuid[];
begin
  -- Lock team row and check leader authorization
  select leader_id into v_leader_id from public.teams where id = p_team_id for update;
  if not found then
    return json_build_object('success', false, 'error', 'Team does not exist');
  end if;

  if v_leader_id <> v_uid then
    return json_build_object('success', false, 'error', 'Only the team leader can delete this team');
  end if;

  -- Collect all member user IDs to reset their is_looking_for_team flag
  select array_agg(user_id) into v_member_ids
  from public.team_members
  where team_id = p_team_id;

  -- Delete team (cascades to team_members and invites)
  delete from public.teams where id = p_team_id;

  -- Reset availability for all team members
  if v_member_ids is not null and array_length(v_member_ids, 1) > 0 then
    update public.profiles
    set is_looking_for_team = true
    where id = any(v_member_ids);
  end if;

  return json_build_object('success', true);
end;
$$;

revoke all on function public.delete_team(uuid) from public, anon;
grant execute on function public.delete_team(uuid) to authenticated;

