"use client";

import { INVITE_TTL_HOURS } from "@/lib/constants";
import { useNow } from "@/lib/hooks";
import { cn, formatRemaining } from "@/lib/utils";

const TTL_MS = INVITE_TTL_HOURS * 60 * 60 * 1000;
const RADIUS = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface CountdownBadgeProps {
  expiresAt: string;
  className?: string;
}

/** Radial 24h countdown for a pending invite. Re-renders every 30 seconds. */
export function CountdownBadge({ expiresAt, className }: CountdownBadgeProps) {
  const now = useNow(30_000);
  const remaining = now === null ? null : new Date(expiresAt).getTime() - now;
  const fraction = remaining === null ? 1 : Math.min(1, Math.max(0, remaining / TTL_MS));
  const expired = remaining !== null && remaining <= 0;

  const tone = expired
    ? "text-zinc-500"
    : fraction < 0.15
      ? "text-red-400"
      : fraction < 0.4
        ? "text-amber-400"
        : "text-emerald-400";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 py-0.5 pl-0.5 pr-2.5 font-mono text-xs tabular-nums",
        tone,
        className,
      )}
      title={`Expires ${new Date(expiresAt).toLocaleString("en-IN")}`}
    >
      <svg
        width={20}
        height={20}
        style={{ width: 20, height: 20, minWidth: 20, minHeight: 20 }}
        viewBox="0 0 24 24"
        className="h-5 w-5 shrink-0 -rotate-90"
        aria-hidden
      >
        <circle cx="12" cy="12" r={RADIUS} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={3} />
        <circle
          cx="12"
          cy="12"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span>
        {remaining === null ? "--" : expired ? "Expired" : `${formatRemaining(remaining)} left`}
      </span>
    </span>
  );
}
