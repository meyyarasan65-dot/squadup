import { useId } from "react";
import { ROLE_LABELS, ROLE_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { MatchResult, Role } from "@/types";

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        ROLE_STYLES[role],
        className,
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

/**
 * Ghost pill for a match reason. Strong signals (exact role, high language overlap) are emerald;
 * the rest are quieter sky, so neither competes with the primary role badge.
 */
export function MatchTag({ reason, className }: { reason: string; className?: string }) {
  const strong = reason === "Exact Role Match" || reason.startsWith("High ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs",
        strong
          ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400"
          : "border-sky-500/20 bg-sky-500/[0.08] text-sky-400",
        className,
      )}
    >
      {reason}
    </span>
  );
}

/** Live "openings" indicator: a pulsing dot. */
export function PulseDot({ className, tone = "emerald" }: { className?: string; tone?: "emerald" | "indigo" }) {
  const color = tone === "emerald" ? "bg-emerald-400" : "bg-indigo-400";
  return (
    <span className={cn("relative inline-flex h-2 w-2", className)} aria-hidden>
      <span className={cn("absolute inline-flex h-full w-full animate-pulse-ring rounded-full", color)} />
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", color)} />
    </span>
  );
}

/** Border, fill, glow and text colour for the score badge: emerald 80+, amber 50–79, muted below. */
export function scoreTier(score: number): string {
  if (score >= 80) {
    return "border-emerald-500/40 text-emerald-400 bg-emerald-500/10 shadow-[0_0_14px_rgba(16,185,129,0.2)]";
  }
  if (score >= 50) return "border-amber-500/40 text-amber-400 bg-amber-500/10";
  return "border-zinc-700 text-zinc-400 bg-zinc-800/40";
}

const BREAKDOWN_ROWS = [
  { key: "role", label: "Role target fit", max: 35 },
  { key: "stack", label: "Verified stack overlap", max: 30 },
  { key: "pace", label: "Hacker velocity pace", max: 15 },
  { key: "auth", label: "Commit authenticity", max: 20 },
] as const;

function ScoreBreakdown({ id, score, breakdown }: { id: string; score: number; breakdown: MatchResult["breakdown"] }) {
  return (
    <div
      id={id}
      role="tooltip"
      className={cn(
        "pointer-events-none invisible absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-white/[0.1] bg-zinc-900 p-3 text-left opacity-0 shadow-xl transition duration-150",
        "group-hover/score:visible group-hover/score:opacity-100 group-focus-within/score:visible group-focus-within/score:opacity-100",
      )}
    >
      <p className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-400">
        Constraint Match
        <span className="font-mono normal-case text-zinc-200">{score}/100</span>
      </p>
      <ul className="flex flex-col gap-2">
        {BREAKDOWN_ROWS.map(({ key, label, max }) => {
          const value = breakdown[key as keyof typeof breakdown] ?? 0;
          return (
            <li key={key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">{label}</span>
                <span className="font-mono tabular-nums text-zinc-400">
                  {value}
                  <span className="text-zinc-500"> / {max}</span>
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
                  style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Circular 0–100 match score. With `breakdown`, hovering or focusing it reveals how the
 * score splits across role fit, language overlap and event registration.
 */
export function MatchScoreRing({
  score,
  size = 44,
  breakdown,
}: {
  score: number;
  size?: number;
  breakdown?: MatchResult["breakdown"];
}) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const tooltipId = useId();

  return (
    <div className="group/score relative inline-flex shrink-0">
      <div
        className={cn(
          "relative inline-flex items-center justify-center rounded-full border",
          scoreTier(score),
          breakdown && "cursor-help",
        )}
        style={{ width: size, height: size }}
        role="img"
        aria-label={`Match score ${score} out of 100`}
        aria-describedby={breakdown ? tooltipId : undefined}
        tabIndex={breakdown ? 0 : undefined}
      >
        <svg width={size} height={size} viewBox="0 0 40 40" className="absolute inset-0 -rotate-90">
          <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={3} />
          <circle
            cx="20"
            cy="20"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - score / 100)}
          />
        </svg>
        <span className="relative font-mono text-xs font-semibold tabular-nums">{score}</span>
      </div>
      {breakdown && <ScoreBreakdown id={tooltipId} score={score} breakdown={breakdown} />}
    </div>
  );
}

export function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      width={16}
      height={16}
      style={{ width: 16, height: 16, minWidth: 16, minHeight: 16 }}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("h-4 w-4 shrink-0", className)}
      aria-hidden
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12.02c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56v-1.96c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.53 11.53 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}
