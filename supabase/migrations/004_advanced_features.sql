-- =============================================================================
-- Migration 004: SquadUp Advanced Capabilities
-- 1. Autonomous Hacker DNA Profiling & Dependency Auditor
-- 2. Algorithmic Constraint Satisfaction & Radar
-- 3. Workspace Provisioner & Real-Time Sprint Canvas
-- 4. Sponsor Track & Rubric Strategy Co-Pilot
-- =============================================================================

-- 1. Profiles additions for Hacker DNA
alter table public.profiles
  add column if not exists raw_dependencies jsonb default '[]'::jsonb,
  add column if not exists verified_tech_stack jsonb default '[]'::jsonb,
  add column if not exists commit_authenticity_score numeric(4,1) default 100.0,
  add column if not exists leetcode_stats jsonb default '{}'::jsonb,
  add column if not exists hacker_pace text default 'all_nighter' check (hacker_pace in ('all_nighter', 'structured_day'));

create index if not exists idx_profiles_tech_stack on public.profiles using gin (verified_tech_stack);
create index if not exists idx_profiles_pace on public.profiles(hacker_pace);

-- 2. Teams additions for Workspace Provisioning & Sprint Canvas & Sponsor Tracks
alter table public.teams
  add column if not exists github_repo_url text,
  add column if not exists discord_webhook_url text,
  add column if not exists sprint_notes text default '# Sprint Plan

## Architecture

## MVP Milestones
',
  add column if not exists hacker_pace text default 'all_nighter' check (hacker_pace in ('all_nighter', 'structured_day')),
  add column if not exists selected_tracks jsonb default '[]'::jsonb;

-- 3. Events additions for Sponsor Tracks
alter table public.events
  add column if not exists sponsor_tracks jsonb default '[]'::jsonb;

-- 4. RLS Grants
grant update (hacker_pace) on public.profiles to authenticated;
grant update (team_name, pitch, target_roles, tech_stack, is_locked, discord_webhook_url, sprint_notes, selected_tracks, hacker_pace, github_repo_url)
  on public.teams to authenticated;

