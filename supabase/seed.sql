-- =============================================================================
-- Seed data: 3 events, 6 student profiles with verified language stats,
-- 4 teams with open vacancies. Safe to re-run (`supabase db reset`).
--
-- Seed students are real auth.users rows (profiles FK to auth.users) but have
-- no password and no GitHub identity, so nobody can sign in as them. Their
-- github_stats.source is 'seed': the UI labels them as demo profiles and does
-- not link out to GitHub (the usernames may belong to real people).
-- Sign in with your own GitHub account to interact with them.
-- =============================================================================

-- ---------------------------------------------------------------- events ----
insert into public.events (id, title, slug, organizer, description, themes, registration_deadline, event_start, team_min_size, team_max_size)
values
  ('e1000000-0000-4000-8000-000000000001', 'KIT Hack Fest 2026', 'kit-hack-fest-2026', 'Knowledge Institute of Technology',
   'A 36-hour campus hackathon for students building practical tools for their community.',
   array['Open Innovation', 'EdTech', 'Sustainability'],
   now() + interval '14 days', now() + interval '21 days', 2, 4),
  ('e1000000-0000-4000-8000-000000000002', 'Smart India Hackathon — Internal Round', 'sih-internal-2026', 'Innovation Cell, KIT',
   'Internal screening round. Shortlisted teams represent the college at the national finals.',
   array['Smart Automation', 'HealthTech', 'Agriculture'],
   now() + interval '7 days', now() + interval '12 days', 6, 6),
  ('e1000000-0000-4000-8000-000000000003', 'GenAI Build Weekend', 'genai-build-weekend', 'Developer Student Club',
   'Ship an AI-native product in a weekend. Mentors from industry on both days.',
   array['LLM Apps', 'Agents', 'Computer Vision'],
   now() + interval '20 days', now() + interval '27 days', 2, 3)
on conflict (id) do nothing;

-- ------------------------------------------------------- seed auth users ----
-- handle_new_user() creates a skeleton profile for each; we enrich it below.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email, '', now(),
  '{"provider":"seed","providers":["seed"]}'::jsonb,
  jsonb_build_object('user_name', u.username, 'full_name', u.full_name),
  now(), now(), '', '', '', ''
from (values
  ('a1000000-0000-4000-8000-000000000001'::uuid, 'aarav.seed@example.com',   'aarav-codes',   'Aarav Raman'),
  ('a1000000-0000-4000-8000-000000000002'::uuid, 'diya.seed@example.com',    'diya-ml',       'Diya Krishnan'),
  ('a1000000-0000-4000-8000-000000000003'::uuid, 'karthik.seed@example.com', 'karthik-ops',   'Karthik Selvam'),
  ('a1000000-0000-4000-8000-000000000004'::uuid, 'meera.seed@example.com',   'meera-designs', 'Meera Nair'),
  ('a1000000-0000-4000-8000-000000000005'::uuid, 'rohan.seed@example.com',   'rohan-mobile',  'Rohan Iyer'),
  ('a1000000-0000-4000-8000-000000000006'::uuid, 'sneha.seed@example.com',   'sneha-backend', 'Sneha Prakash')
) as u(id, email, username, full_name)
on conflict (id) do nothing;

-- -------------------------------------------------------------- profiles ----
update public.profiles p set
  bio = s.bio,
  primary_role = s.role,
  verified_skills = s.skills,
  github_stats = s.stats,
  is_looking_for_team = s.looking,
  onboarded = true
from (values
  ('a1000000-0000-4000-8000-000000000001'::uuid, 'frontend',
   'React + motion design nerd. I make dashboards feel fast.',
   '{"TypeScript": 48.2, "JavaScript": 21.4, "CSS": 16.9, "HTML": 8.3, "Python": 5.2}'::jsonb,
   '{"public_repos": 31, "followers": 58, "total_stars": 142, "total_commits": 1204, "repos_analyzed": 8, "source": "seed", "synced_at": "2026-10-01T00:00:00Z", "top_repos": [{"name": "motion-dash", "url": "https://github.com/aarav-codes/motion-dash", "stars": 87, "language": "TypeScript"}, {"name": "tiny-charts", "url": "https://github.com/aarav-codes/tiny-charts", "stars": 41, "language": "TypeScript"}]}'::jsonb,
   true),
  ('a1000000-0000-4000-8000-000000000002'::uuid, 'ai_ml',
   'Fine-tuning small models and building RAG pipelines. Kaggle expert.',
   '{"Python": 71.5, "Jupyter Notebook": 14.8, "TypeScript": 7.1, "C++": 4.3, "Shell": 2.3}'::jsonb,
   '{"public_repos": 24, "followers": 112, "total_stars": 356, "total_commits": 980, "repos_analyzed": 8, "source": "seed", "synced_at": "2026-10-01T00:00:00Z", "top_repos": [{"name": "rag-kit", "url": "https://github.com/diya-ml/rag-kit", "stars": 212, "language": "Python"}, {"name": "tamil-asr", "url": "https://github.com/diya-ml/tamil-asr", "stars": 96, "language": "Python"}]}'::jsonb,
   true),
  ('a1000000-0000-4000-8000-000000000003'::uuid, 'devops',
   'Kubernetes, Terraform, and CI pipelines that never flake.',
   '{"Go": 44.0, "HCL": 22.6, "Shell": 16.1, "Python": 10.2, "Dockerfile": 7.1}'::jsonb,
   '{"public_repos": 19, "followers": 33, "total_stars": 64, "total_commits": 742, "repos_analyzed": 8, "source": "seed", "synced_at": "2026-10-01T00:00:00Z", "top_repos": [{"name": "k8s-starter", "url": "https://github.com/karthik-ops/k8s-starter", "stars": 38, "language": "Go"}]}'::jsonb,
   false),
  ('a1000000-0000-4000-8000-000000000004'::uuid, 'ui_ux',
   'Product designer who ships. Figma to Tailwind in an afternoon.',
   '{"CSS": 38.5, "TypeScript": 29.9, "HTML": 19.2, "JavaScript": 12.4}'::jsonb,
   '{"public_repos": 14, "followers": 76, "total_stars": 51, "total_commits": 433, "repos_analyzed": 8, "source": "seed", "synced_at": "2026-10-01T00:00:00Z", "top_repos": [{"name": "design-tokens", "url": "https://github.com/meera-designs/design-tokens", "stars": 29, "language": "CSS"}]}'::jsonb,
   true),
  ('a1000000-0000-4000-8000-000000000005'::uuid, 'mobile',
   'Flutter and Kotlin. Two apps on the Play Store.',
   '{"Dart": 52.3, "Kotlin": 27.0, "Swift": 9.4, "Java": 7.6, "C++": 3.7}'::jsonb,
   '{"public_repos": 22, "followers": 40, "total_stars": 93, "total_commits": 865, "repos_analyzed": 8, "source": "seed", "synced_at": "2026-10-01T00:00:00Z", "top_repos": [{"name": "campus-bus", "url": "https://github.com/rohan-mobile/campus-bus", "stars": 61, "language": "Dart"}]}'::jsonb,
   true),
  ('a1000000-0000-4000-8000-000000000006'::uuid, 'backend',
   'APIs, Postgres, and queues. Happiest with a good EXPLAIN ANALYZE.',
   '{"Java": 36.8, "TypeScript": 25.1, "Go": 18.3, "PLpgSQL": 12.0, "Python": 7.8}'::jsonb,
   '{"public_repos": 27, "followers": 49, "total_stars": 118, "total_commits": 1311, "repos_analyzed": 8, "source": "seed", "synced_at": "2026-10-01T00:00:00Z", "top_repos": [{"name": "pg-queue", "url": "https://github.com/sneha-backend/pg-queue", "stars": 74, "language": "Go"}]}'::jsonb,
   true)
) as s(id, role, bio, skills, stats, looking)
where p.id = s.id;

-- ----------------------------------------------------------------- teams ----
insert into public.teams (id, event_id, leader_id, team_name, pitch, target_roles, tech_stack)
values
  ('b1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000003',
   'Null Pointers', 'Carbon-footprint tracker for college canteens, with a live leaderboard per hostel.',
   array['frontend', 'ui_ux'], array['TypeScript', 'Go']),
  ('b1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002',
   'Prompt Injectors', 'An agent that turns lecture recordings into searchable, cited study notes.',
   array['frontend', 'backend'], array['Python', 'TypeScript']),
  ('b1000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000006',
   'Stack Overflowers', 'Crop-disease early warning system using farmer-submitted photos over WhatsApp.',
   array['ai_ml', 'mobile', 'ui_ux', 'devops'], array['Python', 'Kotlin', 'Java']),
  ('b1000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000005',
   'Pixel Pushers', 'Offline-first campus navigation app with accessibility routing.',
   array['backend', 'ui_ux'], array['Dart', 'TypeScript'])
on conflict (id) do nothing;

-- Leaders are seated on their own teams (create_team() does this in the app).
insert into public.team_members (team_id, user_id, role_assigned)
values
  ('b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000003', 'devops'),
  ('b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002', 'ai_ml'),
  ('b1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000006', 'backend'),
  ('b1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000005', 'mobile')
on conflict (team_id, user_id) do nothing;

-- ---------------------------------------------------------- registrations ----
insert into public.event_registrations (event_id, user_id)
values
  ('e1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001'),
  ('e1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000003'),
  ('e1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000004'),
  ('e1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000005'),
  ('e1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000006'),
  ('e1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002'),
  ('e1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002'),
  ('e1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001'),
  ('e1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000006')
on conflict do nothing;

-- ---------------------------------------------------------------- invites ----
-- One live invite so the countdown UI has something to show.
insert into public.invites (team_id, user_id, direction, status, expires_at)
values
  ('b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'team_to_user', 'pending', now() + interval '18 hours')
on conflict do nothing;
