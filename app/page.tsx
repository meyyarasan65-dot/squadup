import { AlertTriangle, ArrowRight, BellRing, GitBranch, Lock, Scale, Timer, Users } from "lucide-react";
import Link from "next/link";
import { MatchDemo } from "@/components/landing/MatchDemo";
import { GithubIcon, PulseDot } from "@/components/shared/badges";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const FEATURES = [
  {
    icon: GitBranch,
    title: "Proof of skill, not claims",
    body: "We read language bytes from your most recently pushed public repos. TypeScript 48% means 48% of the code you actually ship.",
  },
  {
    icon: Scale,
    title: "Role-balanced matching",
    body: "Teams list open slots; candidates are ranked by role fit, verified language overlap, and whether they're registered for the event.",
  },
  {
    icon: Timer,
    title: "Invites that expire",
    body: "Every invite lives for 24 hours. No more waiting a week on someone who never answers.",
  },
  {
    icon: Lock,
    title: "No double-booked final slot",
    body: "Acceptance runs in a single Postgres transaction with row locks. Two people can't both take the last seat.",
  },
  {
    icon: BellRing,
    title: "Real-time",
    body: "Invites, requests and acceptances show up instantly. No refresh needed.",
  },
  {
    icon: Users,
    title: "Built for campus hackathons",
    body: "Event directory with deadlines and team-size limits, so your squad is always valid for submission.",
  },
] as const;

export default async function LandingPage() {
  const isConfigured = hasSupabaseConfig();
  let user = null;

  if (isConfigured) {
    try {
      const supabase = await createClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      user = currentUser;
    } catch {
      user = null;
    }
  }

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[120px]" />

      <header className="container relative flex h-16 items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/events">Events</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={user ? "/matchmaker" : "/login"}>
              {user ? "Open app" : "Sign in"}
              <ArrowRight />
            </Link>
          </Button>
        </nav>
      </header>

      <main className="container relative">
        {!isConfigured && (
          <div className="relative z-10 mx-auto my-6 max-w-4xl rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 shadow-lg backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-500/20 p-2 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-white">
                  Step Required: Connect your Supabase Backend
                </h2>
                <p className="mt-1 text-xs text-zinc-300">
                  The frontend is running smoothly! To activate GitHub OAuth, the matchmaking algorithm, and invites:
                </p>
                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                  <div className="rounded-lg border border-amber-500/20 bg-zinc-950/60 p-2.5">
                    <span className="font-semibold text-amber-300">1. Supabase API</span>
                    <p className="mt-0.5 text-zinc-400">Copy URL & keys from Dashboard → Project Settings → API.</p>
                  </div>
                  <div className="rounded-lg border border-amber-500/20 bg-zinc-950/60 p-2.5">
                    <span className="font-semibold text-amber-300">2. Set .env.local</span>
                    <p className="mt-0.5 text-zinc-400">Paste your credentials into the created <code className="text-amber-200">.env.local</code> file.</p>
                  </div>
                  <div className="rounded-lg border border-amber-500/20 bg-zinc-950/60 p-2.5">
                    <span className="font-semibold text-amber-300">3. Run SQL Migration</span>
                    <p className="mt-0.5 text-zinc-400">Execute <code className="text-amber-200">001_init.sql</code> and <code className="text-amber-200">seed.sql</code> in SQL Editor.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <section className="grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-400">
              <PulseDot />
              Teams are recruiting right now
            </span>
            <h1 className="text-gradient text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Find teammates who can actually ship.
            </h1>
            <p className="max-w-xl text-base text-zinc-400 sm:text-lg">
              Squadup matches hackathon teams and solo builders using skills verified from GitHub, not
              self-reported checkboxes. Fill your open roles in minutes.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={user ? "/matchmaker" : "/login"}>
                  <GithubIcon />
                  {user ? "Go to matchmaker" : "Continue with GitHub"}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/events">Browse hackathons</Link>
              </Button>
            </div>
            <p className="font-mono text-xs text-zinc-500">
              score = 0.45·role + 0.35·languages + 0.20·registered
            </p>
          </div>
          <MatchDemo />
        </section>

        <section className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition-colors hover:border-zinc-700"
            >
              <Icon className="mb-3 h-5 w-5 text-indigo-400" aria-hidden />
              <h2 className="mb-1 font-medium text-white">{title}</h2>
              <p className="text-sm text-zinc-400">{body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="container relative flex flex-col items-center justify-between gap-2 border-t border-zinc-900 py-8 text-xs text-zinc-500 sm:flex-row">
        <span>Built for student hackers.</span>
        <span>Only public repository metadata is read. Nothing is written to GitHub.</span>
      </footer>
    </div>
  );
}
