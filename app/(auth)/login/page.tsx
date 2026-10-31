import { AlertTriangle, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { MatchDemo } from "@/components/landing/MatchDemo";
import { LoginButton } from "@/components/shared/LoginButton";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { PulseDot } from "@/components/shared/badges";
import { Logo } from "@/components/shared/Logo";
import { hasSupabaseConfig } from "@/lib/env";
import { getStats } from "@/lib/stats";
import { safeRedirectPath } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  missing_code: "GitHub didn't return an authorization code. Please try again.",
  oauth_exchange: "We couldn't complete the GitHub sign-in. Please try again.",
  oauth_start: "We couldn't reach GitHub. Please try again.",
  rate_limited: "Too many sign-in attempts. Please wait a moment and try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next);
  const error = params.error ? (ERRORS[params.error] ?? "Sign-in failed. Please try again.") : null;
  const stats = await getStats();
  const isConfigured = hasSupabaseConfig();

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />

      <div className="relative grid w-full max-w-md gap-12 lg:max-w-5xl lg:grid-cols-[26rem_minmax(0,1fr)] lg:items-center">
      <div className="flex flex-col gap-8">
        <Logo className="self-center" size="lg" />

        <div className="glass flex flex-col gap-6 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">Sign in to find your squad</h1>
            <p className="text-sm text-zinc-400">
              Your skills are verified from your public GitHub repositories. No forms to fill out.
            </p>
          </div>

          {!isConfigured && process.env.NODE_ENV === "development" && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">Supabase Credentials Not Set</p>
                <p className="mt-0.5 text-zinc-300">
                  Please add your Supabase URL & keys to <code className="font-mono text-amber-300">.env.local</code> to enable GitHub authentication.
                </p>
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <LoginButton next={next} />

          <p className="flex items-start gap-2 text-xs text-zinc-400">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
            Read-only access to your public profile. We never see private code and never write to GitHub.
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Builders", value: stats.builders },
            { label: "Teams", value: stats.teams },
            { label: "Open events", value: stats.events },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-2 py-3">
              <dt className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-400">
                {s.label === "Teams" && <PulseDot />}
                {s.label}
              </dt>
              <dd className="mt-1 font-mono text-xl font-semibold text-white">
                <AnimatedCounter value={s.value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <aside className="hidden flex-col gap-3 lg:flex" aria-label="Matching preview">
        <p className="text-xs font-medium uppercase tracking-wider text-indigo-300">Live preview</p>
        <p className="max-w-md text-sm text-zinc-400">
          Pick the roles and stack your team needs. Candidates re-rank instantly by verified GitHub skills.
        </p>
        <MatchDemo />
      </aside>
      </div>
    </div>
  );
}
