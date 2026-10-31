"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { MatchScoreRing, RoleBadge } from "@/components/shared/badges";
import { SkillStrip } from "@/components/shared/SkillBars";
import { UserAvatar } from "@/components/ui/avatar";
import { ROLE_LABELS, STACK_OPTIONS } from "@/lib/constants";
import { calculateMatchScore } from "@/lib/match-algorithm";
import { cn } from "@/lib/utils";
import type { GithubStats, Profile, Role, TeamWithMembers } from "@/types";

const emptyStats: GithubStats = {
  public_repos: 0,
  followers: 0,
  total_stars: 0,
  total_commits: null,
  repos_analyzed: 8,
  top_repos: [],
  synced_at: null,
  source: "seed",
  partial: false,
};

function mockProfile(
  id: string,
  full_name: string,
  primary_role: Role,
  verified_skills: Record<string, number>,
): Profile {
  return {
    id,
    full_name,
    primary_role,
    verified_skills,
    college: "Demo",
    github_username: id,
    avatar_url: null,
    bio: null,
    github_stats: emptyStats,
    is_looking_for_team: true,
    onboarded: true,
    created_at: null,
    updated_at: null,
  };
}

const CANDIDATES: Profile[] = [
  mockProfile("ananya", "Ananya R.", "frontend", { TypeScript: 52, CSS: 21, JavaScript: 15, HTML: 7 }),
  mockProfile("vikram", "Vikram S.", "ai_ml", { Python: 74, "Jupyter Notebook": 12, "C++": 8 }),
  mockProfile("farah", "Farah K.", "backend", { Go: 41, TypeScript: 28, Python: 18 }),
  mockProfile("joel", "Joel M.", "mobile", { Kotlin: 49, Dart: 30, Java: 13 }),
  mockProfile("priya", "Priya D.", "fullstack", { TypeScript: 46, Python: 22, Go: 12, CSS: 9 }),
];

const ROLE_CHOICES: Role[] = ["frontend", "backend", "ai_ml", "mobile"];
const STACK_CHOICES = STACK_OPTIONS.filter((s) => ["TypeScript", "Python", "Go", "Kotlin"].includes(s));

function mockTeam(roles: Role[], stack: string[]): TeamWithMembers {
  return {
    id: "demo",
    event_id: "demo-event",
    leader_id: "you",
    team_name: "Your squad",
    pitch: null,
    target_roles: roles,
    tech_stack: stack,
    is_locked: false,
    created_at: null,
    members: [],
    event: {
      id: "demo-event",
      title: "Demo Hack",
      slug: "demo",
      organizer: "Demo",
      description: null,
      themes: [],
      registration_deadline: "2099-01-01T00:00:00Z",
      event_start: "2099-01-02T00:00:00Z",
      team_min_size: 2,
      team_max_size: 4,
      created_at: null,
    },
  };
}

/** Landing-page demo: the real scoring algorithm re-ranking mock candidates live. */
export function MatchDemo() {
  const [roles, setRoles] = useState<Role[]>(["frontend"]);
  const [stack, setStack] = useState<string[]>(["TypeScript"]);

  const ranked = useMemo(() => {
    const team = mockTeam(roles, stack);
    return CANDIDATES.map((c) => ({
      candidate: c,
      match: calculateMatchScore(c, team, { isRegisteredForEvent: c.id !== "joel" }),
    })).sort((a, b) => b.match.score - a.match.score);
  }, [roles, stack]);

  const toggle = <T,>(list: T[], item: T) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  return (
    <div className="glass relative overflow-hidden rounded-2xl p-4 sm:p-6">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="relative flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Your team needs</p>
          <div className="flex flex-wrap gap-1.5">
            {ROLE_CHOICES.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={roles.includes(r)}
                onClick={() => setRoles((prev) => toggle(prev, r))}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  roles.includes(r)
                    ? "border-indigo-500/60 bg-indigo-500/15 text-indigo-200"
                    : "border-zinc-800 text-zinc-400 hover:text-zinc-200",
                )}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
            <span className="mx-1 w-px self-stretch bg-zinc-800" aria-hidden />
            {STACK_CHOICES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={stack.includes(s)}
                onClick={() => setStack((prev) => toggle(prev, s))}
                className={cn(
                  "rounded-full border px-3 py-1 font-mono text-xs transition-colors",
                  stack.includes(s)
                    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
                    : "border-zinc-800 text-zinc-400 hover:text-zinc-200",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <LayoutGroup>
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {ranked.map(({ candidate, match }, i) => (
                <motion.li
                  key={candidate.id}
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  whileHover={{ y: -2 }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border bg-zinc-950/70 p-3",
                    i === 0 && match.score > 0 ? "border-emerald-500/30" : "border-zinc-800",
                  )}
                >
                  <UserAvatar name={candidate.full_name} src={null} className="h-9 w-9" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-white">{candidate.full_name}</span>
                      <RoleBadge role={candidate.primary_role} />
                    </div>
                    <SkillStrip skills={candidate.verified_skills} />
                    <p className="truncate text-[11px] text-zinc-500">
                      {match.reasons.length ? match.reasons.join(" · ") : "No overlap with your needs"}
                    </p>
                  </div>
                  <MatchScoreRing score={match.score} size={40} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </LayoutGroup>
      </div>
    </div>
  );
}
