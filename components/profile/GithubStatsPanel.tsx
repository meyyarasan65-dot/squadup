"use client";

import {
  AlertCircle,
  Cpu,
  ExternalLink,
  Flame,
  GitCommitHorizontal,
  GitFork,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { GithubIcon } from "@/components/shared/badges";
import { SkillBars } from "@/components/shared/SkillBars";
import { Badge } from "@/components/ui/badge";
import { languageColor } from "@/lib/constants";
import { formatCompact, formatRelative } from "@/lib/utils";
import type { GithubStats, LeetCodeStats, VerifiedFramework, VerifiedSkills } from "@/types";
import { SyncGithubButton } from "./SyncGithubButton";

interface GithubStatsPanelProps {
  stats: GithubStats;
  skills: VerifiedSkills;
  githubUsername: string;
  authenticityScore?: number;
  verifiedTechStack?: VerifiedFramework[];
  leetcodeStats?: LeetCodeStats;
}

export function GithubStatsPanel({
  stats,
  skills,
  githubUsername,
  authenticityScore = 100,
  verifiedTechStack = [],
  leetcodeStats,
}: GithubStatsPanelProps) {
  const isDemo = stats.source === "seed";

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-7">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-white">
            <GithubIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">GitHub Ingestion Data</h2>
              {stats.source && (
                <Badge variant={stats.source === "oauth" ? "success" : "secondary"}>
                  {stats.source === "oauth" ? "OAuth Verified" : stats.source === "seed" ? "Demo Data" : "Public Sync"}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              <a
                href={`https://github.com/${githubUsername}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-mono text-zinc-300 hover:text-white hover:underline"
              >
                @{githubUsername}
                <ExternalLink className="h-3 w-3" />
              </a>
              {stats.synced_at && (
                <>
                  <span>·</span>
                  <span>Synced {formatRelative(stats.synced_at)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {!isDemo && <SyncGithubButton />}
      </div>

      {/* Partial Data Notice */}
      {stats.partial && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>GitHub secondary rate limit reached during last sync. Displaying cached/approximate repository metrics.</span>
        </div>
      )}

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Star className="h-3.5 w-3.5 text-amber-400" />
            Total Stars
          </span>
          <span className="font-mono text-xl font-bold text-white">
            {formatCompact(stats.total_stars)}
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <GitCommitHorizontal className="h-3.5 w-3.5 text-indigo-400" />
            Lifetime Commits
          </span>
          <span className="font-mono text-xl font-bold text-white">
            {stats.total_commits !== null ? formatCompact(stats.total_commits) : "N/A"}
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <GitFork className="h-3.5 w-3.5 text-emerald-400" />
            Repos Analyzed
          </span>
          <span className="font-mono text-xl font-bold text-white">
            {stats.repos_analyzed}
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Users className="h-3.5 w-3.5 text-pink-400" />
            Followers
          </span>
          <span className="font-mono text-xl font-bold text-white">
            {formatCompact(stats.followers)}
          </span>
        </div>
      </div>

      {/* Verified Skill Bars */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Proof of Skill: Verified Codebase Share</h3>
          <span className="text-[11px] text-zinc-500">Byte breakdown across repos</span>
        </div>
        <SkillBars skills={skills} limit={6} />
      </div>

      {/* Autonomous Hacker DNA & Dependency Auditor */}
      <div className="flex flex-col gap-3 rounded-xl border border-cyan-900/40 bg-zinc-950/60 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Autonomous Hacker DNA</h3>
          </div>
          <span className="font-mono text-xs font-semibold text-emerald-300">
            {authenticityScore.toFixed(0)}% Authenticity
          </span>
        </div>

        {/* LeetCode stats */}
        {leetcodeStats?.totalSolved && leetcodeStats.totalSolved > 0 ? (
          <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs">
            <span className="flex items-center gap-1.5 text-amber-300">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              LeetCode Competitive Stats
            </span>
            <span className="font-mono text-white">
              {leetcodeStats.totalSolved} Solved
              {leetcodeStats.ranking ? ` (Rank #${formatCompact(leetcodeStats.ranking)})` : ""}
            </span>
          </div>
        ) : null}

        {/* Manifest frameworks */}
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
            <Cpu className="h-3 w-3 text-cyan-400" />
            Audited Frameworks (package.json & requirements.txt)
          </span>
          {verifiedTechStack.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {verifiedTechStack.map((fw) => (
                <span
                  key={fw.name}
                  className="inline-flex items-center gap-1 rounded bg-cyan-950/40 px-2 py-0.5 text-xs text-cyan-300 border border-cyan-800/40 font-mono"
                  title={`${fw.category} (weight: ${fw.weight})`}
                >
                  {fw.name}
                  <span className="text-[10px] text-zinc-500">· {fw.category}</span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-zinc-500">
              Auditor scans active non-forked repos during sync.
            </span>
          )}
        </div>
      </div>

      {/* Top Repositories */}
      {stats.top_repos.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-white">Top Active Repositories</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {stats.top_repos.map((repo) => (
              <a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900/60"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-mono text-xs font-medium text-zinc-200 group-hover:text-white group-hover:underline">
                      {repo.name}
                    </span>
                    <ExternalLink className="h-3 w-3 text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  {repo.language && (
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-zinc-400">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: languageColor(repo.language) }}
                      />
                      {repo.language}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 font-mono text-xs text-zinc-400">
                  <Star className="h-3 w-3 text-amber-400" />
                  <span>{repo.stars}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

