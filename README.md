# Squadup — Peer-to-Peer Hackathon & Project Matchmaker

> Production-grade, zero-cost, role-balanced hackathon teammate matchmaker built with Next.js 15, Supabase, Tailwind CSS, and GitHub Ingestion.

Squadup solves teammate discovery and ghosting in hackathons through:
1. **GitHub Ingestion & Proof of Skill**: Verifies candidate skills directly from actual repository codebase language bytes rather than self-reported tags.
2. **Role-Balanced Matchmaking Algorithm**: Ranks candidates and squads using weighted scoring across role fit, language overlap, and event registration.
3. **Anti-Ghosting Invitation Engine**: 24-hour radial countdown timers, atomic database row locking (`FOR UPDATE`) to prevent race conditions when filling open squad slots, and real-time toast notifications.

---

## Tech Stack & Architecture

- **Framework**: Next.js 15 (App Router, Server Components, Server Actions)
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security, GitHub OAuth, Realtime subscriptions)
- **Styling & UI**: Tailwind CSS, Radix UI primitives, Lucide Icons, Framer Motion
- **Form & Validation**: React Hook Form, Zod
- **Type Safety**: TypeScript 5 with strict database and domain models

---

## Matchmaking Algorithm

Each candidate-to-team pair is calculated using:

$$\text{MatchScore} = (0.45 \times \text{RoleMatch}) + (0.35 \times \text{LanguageOverlap}) + (0.20 \times \text{EventRegistered})$$

- **Role Match ($0.45$)**: Exact role match receives $1.0$. Partial credit is awarded for adjacent skill overlaps (e.g., Full-Stack covering Frontend/Backend).
- **Language Overlap ($0.35$)**: Codebase language percentage share ($\ge 10\%$) overlapping with the team's desired tech stack.
- **Event Registration ($0.20$)**: Verified registration for the target hackathon event.

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.18 or higher (v20+ recommended)
- **npm** or **pnpm**
- A **Supabase** account (Free tier)
- A **GitHub** account

---

### 2. GitHub OAuth App Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers) → **OAuth Apps** → **New OAuth App**.
2. Set the following fields:
   - **Application name**: `Squadup Matchmaker`
   - **Homepage URL**: `http://localhost:3000` (or your production domain)
   - **Authorization callback URL**: `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
3. Generate a **Client Secret** and copy both the **Client ID** and **Client Secret**.

---

### 3. Supabase Setup

1. Create a new project in [Supabase](https://supabase.com).
2. Go to **Authentication** → **Providers** → **GitHub**:
   - Enable the provider.
   - Enter your GitHub **Client ID** and **Client Secret**.
   - Ensure the callback URL matches the one configured on GitHub.
3. Go to the **SQL Editor** in your Supabase dashboard:
   - Open and execute `supabase/migrations/001_init.sql`. This applies the complete schema, RLS policies, atomic RPC functions (`create_team`, `send_team_invite`, `accept_team_invite`, `decline_team_invite`, `leave_team`, `remove_team_member`, `expire_stale_invites`), and enables Supabase Realtime for the `invites` table.
   - Open and execute `supabase/seed.sql`. This seeds:
     - 3 active hackathon events with deadlines and team size constraints
     - 6 pre-populated student profiles with verified GitHub language bytes
     - 4 active teams with unfilled vacancies
     - 1 live invite with active countdown

---

### 4. Environment Variables

Create a `.env.local` file in the project root based on `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Fill in your configuration:

```env
# Supabase project credentials (Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Service Role Key (server-only, bypasses RLS for verified skill sync and cron)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Site URL for OAuth callbacks
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Secret for daily invite expiry cron endpoint (/api/cron/expire-invites)
CRON_SECRET=generate_a_secure_random_string

# Optional: GitHub personal access token with no scopes to raise rate limits for public sync
GITHUB_TOKEN=
```

---

### 5. Install & Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 6. Build & Typecheck Verification

```bash
# Typecheck TypeScript definitions
npm run typecheck

# Lint the codebase
npm run lint

# Build for production
npm run build
```

---

## Deployment to Vercel

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set the environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`) in the Vercel project settings.
4. Update the GitHub OAuth App callback URL and Supabase Auth redirect URLs to your production domain.
5. Vercel Cron is automatically configured via `vercel.json` to trigger `/api/cron/expire-invites` daily at midnight UTC.

