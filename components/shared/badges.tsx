import { ROLE_LABELS, ROLE_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

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

/** Small radial gauge for a 0–100 match score. */
export function MatchScoreRing({ score, size = 44 }: { score: number; size?: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const tone = score >= 70 ? "text-emerald-400" : score >= 40 ? "text-indigo-400" : "text-zinc-500";
  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", tone)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Match score ${score} out of 100`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        className="absolute inset-0 -rotate-90"
      >
        <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={3.5} />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <span className="font-mono text-xs font-semibold tabular-nums text-white">{score}</span>
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
