"use client";

import { motion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import { languageColor } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { VerifiedSkills } from "@/types";

interface SkillBarsProps {
  skills: VerifiedSkills;
  /** Languages to visually emphasize (e.g. a team's desired stack). */
  highlight?: string[];
  limit?: number;
  compact?: boolean;
  className?: string;
}

/** GitHub-verified language shares as color-coded progress bars. */
export function SkillBars({ skills, highlight = [], limit = 5, compact = false, className }: SkillBarsProps) {
  const entries = Object.entries(skills)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  const wanted = new Set(highlight.map((h) => h.toLowerCase()));

  if (entries.length === 0) {
    return (
      <p className={cn("text-xs text-zinc-500", className)}>
        No verified languages yet. Skills appear after a GitHub sync.
      </p>
    );
  }

  return (
    <ul className={cn("flex flex-col", compact ? "gap-1.5" : "gap-2.5", className)}>
      {entries.map(([lang, pct], i) => {
        const color = languageColor(lang);
        const emphasized = wanted.has(lang.toLowerCase());
        return (
          <li key={lang} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className={cn("flex items-center gap-1.5", emphasized ? "text-white" : "text-zinc-300")}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
                {lang}
                {emphasized && <BadgeCheck className="h-3 w-3 text-emerald-400" aria-label="matches team stack" />}
              </span>
              <span className="font-mono tabular-nums text-zinc-400">{pct.toFixed(pct < 10 ? 1 : 0)}%</span>
            </div>
            <div className={cn("overflow-hidden rounded-full bg-zinc-800/80", compact ? "h-1" : "h-1.5")}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}55` }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(pct, 2)}%` }}
                transition={{ duration: 0.8, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A single multi-segment bar for a candidate's language mix, with a compact dot legend below.
 * Languages in `highlight` (the team's desired stack) are called out in the legend.
 */
export function LanguageBar({
  skills,
  highlight = [],
  limit = 4,
  className,
}: {
  skills: VerifiedSkills;
  highlight?: string[];
  limit?: number;
  className?: string;
}) {
  const entries = Object.entries(skills)
    .filter(([, pct]) => pct > 0)
    .sort((a, b) => b[1] - a[1]);
  const wanted = new Set(highlight.map((h) => h.toLowerCase()));

  if (entries.length === 0) {
    return (
      <p className={cn("text-xs text-zinc-400", className)}>
        No verified languages yet. Skills appear after a GitHub sync.
      </p>
    );
  }

  const shown = entries.slice(0, limit);
  const hidden = entries.length - shown.length;
  const total = entries.reduce((sum, [, pct]) => sum + pct, 0);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className="flex h-2 gap-px overflow-hidden rounded-full bg-white/[0.05]"
        role="img"
        aria-label={`Languages: ${shown.map(([l, p]) => `${l} ${Math.round(p)}%`).join(", ")}`}
      >
        {entries.map(([lang, pct], i) => (
          <motion.span
            key={lang}
            className="h-full"
            style={{ backgroundColor: languageColor(lang) }}
            initial={{ width: 0 }}
            animate={{ width: `${(pct / total) * 100}%` }}
            transition={{ duration: 0.7, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
        {shown.map(([lang, pct]) => {
          const emphasized = wanted.has(lang.toLowerCase());
          return (
            <li
              key={lang}
              className={cn("flex items-center gap-1.5", emphasized ? "font-medium text-white" : "text-zinc-400")}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: languageColor(lang) }} aria-hidden />
              {lang}
              <span className="font-mono tabular-nums text-zinc-400">{Math.round(pct)}%</span>
              {emphasized && <BadgeCheck className="h-3 w-3 text-emerald-400" aria-label="matches team stack" />}
            </li>
          );
        })}
        {hidden > 0 && <li className="text-zinc-500">+{hidden} more</li>}
      </ul>
    </div>
  );
}

/** One-line stacked bar: a dense summary of the same data. */
export function SkillStrip({ skills, className }: { skills: VerifiedSkills; className?: string }) {
  const entries = Object.entries(skills).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;
  return (
    <div className={cn("flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full", className)}>
      {entries.map(([lang, pct]) => (
        <span
          key={lang}
          title={`${lang} ${pct}%`}
          className="h-full first:rounded-l-full last:rounded-r-full"
          style={{ width: `${pct}%`, backgroundColor: languageColor(lang) }}
        />
      ))}
    </div>
  );
}
