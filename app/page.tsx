import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  GitBranch,
  Lock,
  Scale,
  Send,
  Timer,
  Users,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { MatchDemo } from "@/components/landing/MatchDemo";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { GithubIcon, PulseDot } from "@/components/shared/badges";
import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import { hasSupabaseConfig } from "@/lib/env";
import { getStats } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

const STEPS = [
  {
    icon: GithubIcon,
    title: "Connect GitHub",
    body: "One click. We read language bytes from your public repos, so your skills are proven, not claimed.",
  },
  {
    icon: Sparkles,
    title: "Get ranked matches",
    body: "Teams and candidates are scored on role fit, verified languages, and event registration.",
  },
  {
    icon: Send,
    title: "Invite and ship",
    body: "Send an invite, get an answer within 24 hours, and lock in your squad before the deadline.",
  },
] as const;

const SMALL_FEATURES = [
  {
    icon: Scale,
    title: "Role-balanced matching",
    body: "Teams list open slots; candidates are ranked by role fit, language overlap, and registration.",
  },
  {
    icon: Lock,
    title: "No double-booked final slot",
    body: "Acceptance runs in one Postgres transaction with row locks. Two people can't take the last seat.",
  },
  {
    icon: BellRing,
    title: "Real-time",
    body: "Invites, requests and acceptances show up instantly. No refresh needed.",
  },
  {
    icon: Users,
    title: "Built for campus hackathons",
    body: "An event directory with deadlines and team-size limits keeps every squad valid for submission.",
  },
] as const;

const SAMPLE_SKILLS = [
  { name: "TypeScript", pct: 48, color: "#3178c6" },
  { name: "Python", pct: 27, color: "#3572a5" },
  { name: "Go", pct: 15, color: "#00add8" },
  { name: "CSS", pct: 10, color: "#a78bfa" },
] as const;

export default async function LandingPage() {
  const isConfigured = hasSupabaseConfig();
  const isDev = process.env.NODE_ENV === "development";
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

  const stats = isConfigured ? await getStats() : null;
  const ctaHref = user ? "/matchmaker" : "/login";

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-40 h-[320px] w-[420px] rounded-full bg-cyan-500/10 blur-[120px]" />

      <header className="container relative flex h-16 items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/events">Events</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={ctaHref}>
              {user ? "Open app" : "Sign in"}
              <ArrowRight />
            </Link>
          </Button>
        </nav>
      </header>

      <main className="container relative">
        {isDev && !isConfigured && (
          <div className="relative z-10 mx-auto my-6 max-w-4xl rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 shadow-lg backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-500/20 p-2 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-white">
                  Dev setup: connect your Supabase backend
                </h2>
                <p className="mt-1 text-xs text-zinc-300">
                  Only shown in development. To activate GitHub OAuth, matchmaking and invites:
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

        {/* Hero */}
        <section className="grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="flex flex-col gap-6">
            <span className="animate-fade-up inline-flex w-fit items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300">
              <PulseDot />
              Teams are recruiting right now
            </span>
            <h1
              className="animate-fade-up text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-7xl"
              style={{ animationDelay: "80ms" }}
            >
              Find teammates who can actually <span className="text-gradient-brand">ship.</span>
            </h1>
            <p
              className="animate-fade-up text-pretty max-w-xl text-base text-zinc-300 sm:text-lg"
              style={{ animationDelay: "160ms" }}
            >
              Squadup matches hackathon teams and solo builders using skills verified from GitHub, not
              self-reported checkboxes. Fill your open roles in minutes.
            </p>
            <div
              className="animate-fade-up flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: "240ms" }}
            >
              <Button asChild size="lg">
                <Link href={ctaHref}>
                  <GithubIcon />
                  {user ? "Go to matchmaker" : "Continue with GitHub"}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/events">Browse hackathons</Link>
              </Button>
            </div>
            <p className="font-mono text-xs text-zinc-400">
              score = 0.45·role + 0.35·languages + 0.20·registered
            </p>
          </div>

          <div className="animate-fade-up relative" style={{ animationDelay: "200ms" }}>
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-indigo-600/25 via-violet-500/10 to-cyan-400/20 blur-3xl" />
            <MatchDemo />
            <div className="animate-float glass absolute -bottom-4 -left-3 hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs text-zinc-200 shadow-xl sm:flex">
              <span className="font-mono font-semibold text-emerald-400">92%</span>
              match found
            </div>
          </div>
        </section>

        {/* Stats */}
        {stats && (
          <section aria-label="Platform stats" className="pb-16">
            <dl className="mx-auto grid max-w-2xl grid-cols-3 gap-3 text-center">
              {[
                { label: "Builders", value: stats.builders },
                { label: "Teams", value: stats.teams },
                { label: "Open events", value: stats.events },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-2 py-4">
                  <dd className="font-mono text-2xl font-semibold text-white sm:text-3xl">
                    <AnimatedCounter value={s.value} />
                  </dd>
                  <dt className="mt-1 text-[11px] uppercase tracking-wider text-zinc-400">{s.label}</dt>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* How it works */}
        <section className="pb-20" aria-labelledby="how-it-works">
          <div className="mb-8 flex flex-col items-center gap-2 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-300">How it works</p>
            <h2 id="how-it-works" className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              From sign-in to squad in three steps
            </h2>
          </div>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li
                key={title}
                className="relative rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition-colors hover:border-zinc-700"
              >
                <span className="absolute right-4 top-3 font-mono text-4xl font-semibold text-zinc-800" aria-hidden>
                  {i + 1}
                </span>
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <h3 className="mb-1 font-medium text-white">{title}</h3>
                <p className="text-sm text-zinc-400">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Features (bento) */}
        <section className="grid gap-4 pb-20 md:grid-cols-2 lg:grid-cols-4" aria-label="Features">
          <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 transition-colors hover:border-zinc-700 md:col-span-2">
            <GitBranch className="mb-3 h-5 w-5 text-indigo-400" aria-hidden />
            <h3 className="mb-1 text-lg font-medium text-white">Proof of skill, not claims</h3>
            <p className="mb-5 max-w-md text-sm text-zinc-400">
              We read language bytes from your most recently pushed public repos. TypeScript 48% means 48% of the
              code you actually ship.
            </p>
            <div className="flex flex-col gap-2.5" aria-label="Example skill breakdown">
              {SAMPLE_SKILLS.map((s) => (
                <div key={s.name} className="flex items-center gap-3 text-xs">
                  <span className="w-20 shrink-0 font-mono text-zinc-300">{s.name}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                  </div>
                  <span className="w-9 shrink-0 text-right font-mono text-zinc-400">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 transition-colors hover:border-zinc-700 md:col-span-2">
            <Timer className="mb-3 h-5 w-5 text-amber-400" aria-hidden />
            <h3 className="mb-1 text-lg font-medium text-white">Invites that expire</h3>
            <p className="mb-5 max-w-md text-sm text-zinc-400">
              Every invite lives for 24 hours. No more waiting a week on someone who never answers.
            </p>
            <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              <PulseDot tone="indigo" />
              <span className="text-sm text-zinc-200">Invite to Team Nova</span>
              <span className="ml-auto rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-xs text-amber-300">
                23h 41m left
              </span>
            </div>
          </div>

          {SMALL_FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition-colors hover:border-zinc-700"
            >
              <Icon className="mb-3 h-5 w-5 text-indigo-400" aria-hidden />
              <h3 className="mb-1 font-medium text-white">{title}</h3>
              <p className="text-sm text-zinc-400">{body}</p>
            </div>
          ))}
        </section>

        {/* Closing CTA */}
        <section className="pb-24">
          <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600/20 via-zinc-900/60 to-cyan-500/10 px-6 py-12 text-center sm:px-12">
            <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-96 -translate-x-1/2 rounded-full bg-indigo-500/25 blur-3xl" />
            <div className="relative flex flex-col items-center gap-4">
              <h2 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-4xl">
                Your next hackathon team is one click away.
              </h2>
              <p className="max-w-lg text-pretty text-sm text-zinc-300 sm:text-base">
                Sign in with GitHub, let your code speak, and fill your squad before registration closes.
              </p>
              <Button asChild size="lg">
                <Link href={ctaHref}>
                  <GithubIcon />
                  {user ? "Go to matchmaker" : "Get started with GitHub"}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="container relative border-t border-zinc-900 py-10 text-xs text-zinc-400">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2">
            <Logo size="sm" />
            <span>Built for student hackers.</span>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/events" className="hover:text-white">Events</Link>
            <Link href={ctaHref} className="hover:text-white">{user ? "Matchmaker" : "Sign in"}</Link>
            <a
              href="https://github.com/meyyarasan65-dot/squadup"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-white"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              Source on GitHub
            </a>
          </nav>
        </div>
        <p className="mt-6 border-t border-zinc-900 pt-4 text-zinc-500">
          Only public repository metadata is read. Nothing is written to GitHub.
        </p>
      </footer>
    </div>
  );
}
