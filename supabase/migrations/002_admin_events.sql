-- =============================================================================
-- Migration 002: Admin Privileges for Events Management
-- Authorized Admin GitHub Username: meyyarasan65-dot
-- =============================================================================

-- Allow the authorized administrator to insert new hackathon events
create policy "Admin can insert events" on public.events
  for insert with check (
    auth.uid() in (
      select id from public.profiles
      where lower(github_username) in ('meyyarasan65-dot')
    )
  );

-- Allow the authorized administrator to update hackathon events
create policy "Admin can update events" on public.events
  for update using (
    auth.uid() in (
      select id from public.profiles
      where lower(github_username) in ('meyyarasan65-dot')
    )
  );

-- Allow the authorized administrator to delete hackathon events
create policy "Admin can delete events" on public.events
  for delete using (
    auth.uid() in (
      select id from public.profiles
      where lower(github_username) in ('meyyarasan65-dot')
    )
  );

