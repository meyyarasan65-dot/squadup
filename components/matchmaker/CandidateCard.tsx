"use client";

import { motion } from "framer-motion";
import { Check, ExternalLink, FolderGit2, GitCommit, Send, Star } from "lucide-react";
import Link from "next/link";
import { GithubIcon, MatchScoreRing, MatchTag, RoleBadge } from "@/components/shared/badges";
import { LanguageBar } from "@/components/shared/SkillBars";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCompact } from "@/lib/utils";
import type { MatchResult, Profile } from "@/types";

interface CandidateCardProps {
  candidate: Profile;
  match: MatchResult;
  /** Languages to emphasize in the language legend (the team's desired stack). */
  highlightLanguages: string[];
  invited: boolean;
  /** The candidate has already asked to join; point the leader at the inbox instead. */
  requestedToJoin?: boolean;
  onInvite: () => void;
  disabled?: boolean;
}

export function CandidateCard({
  candidate,
  match,
  highlightLanguages,
  invited,
  requestedToJoin = false,
  onInvite,
  disabled = false,
}: CandidateCardProps) {
  const stats = candidate.github_stats;
  const isDemo = stats.source === "seed";
  const githubUrl = `https://github.com/${candidate.github_username}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      className="group relative flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-zinc-900/60 p-5 backdrop-blur-md transition-all duration-300 focus-within:z-20 hover:z-20 hover:border-sky-500/30 hover:shadow-[0_0_30px_-5px_rgba(56,189,248,0.15)]"
    >
      <header className="flex items-start gap-3">
        <UserAvatar name={candidate.full_name} src={candidate.avatar_url} className="h-11 w-11" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-medium text-white">{candidate.full_name}</h3>
            {isDemo && <Badge variant="secondary">Demo</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <RoleBadge role={candidate.primary_role} />
            <span className="truncate">{candidate.college}</span>
          </div>
          {isDemo ? (
            <span className="flex items-center gap-1 font-mono text-xs text-zinc-500">
              <GithubIcon className="h-3.5 w-3.5" />@{candidate.github_username}
            </span>
          ) : (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-fit items-center gap-1 font-mono text-xs text-zinc-400 transition-colors hover:text-white"
            >
              <GithubIcon className="h-3.5 w-3.5" />@{candidate.github_username}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          )}
        </div>
        <MatchScoreRing score={match.score} breakdown={match.breakdown} />
      </header>

      {match.reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {match.reasons.map((r) => (
            <MatchTag key={r} reason={r} />
          ))}
        </div>
      )}

      {candidate.bio && <p className="line-clamp-2 text-sm text-zinc-400">{candidate.bio}</p>}

      <LanguageBar skills={candidate.verified_skills} highlight={highlightLanguages} limit={4} />

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-white/[0.06] pt-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-zinc-400">
          {stats.total_commits !== null && (
            <span className="flex items-center gap-1" title="Commits authored (GitHub search)">
              <GitCommit className="h-3.5 w-3.5" aria-hidden />
              {formatCompact(stats.total_commits)}
              <span className="sr-only">commits</span>
            </span>
          )}
          <span className="flex items-center gap-1" title="Stars earned">
            <Star className="h-3.5 w-3.5" aria-hidden />
            {formatCompact(stats.total_stars)}
            <span className="sr-only">stars</span>
          </span>
          <span className="flex items-center gap-1" title="Public repositories">
            <FolderGit2 className="h-3.5 w-3.5" aria-hidden />
            {stats.public_repos}
            <span className="sr-only">repos</span>
          </span>
        </div>

        {requestedToJoin ? (
          <Button asChild variant="secondary" size="sm" className="rounded-xl">
            <Link href="/invites">Wants to join · review</Link>
          </Button>
        ) : invited ? (
          <motion.div
            initial={{ scale: 0.92, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
          >
            <Button variant="secondary" className="rounded-xl text-emerald-300" disabled>
              <Check />
              Invite sent
            </Button>
          </motion.div>
        ) : (
          <Button
            className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 font-medium text-primary-foreground shadow-md shadow-sky-500/20 transition hover:from-sky-400 hover:to-blue-500 hover:bg-transparent active:scale-95"
            onClick={onInvite}
            disabled={disabled}
          >
            <Send />
            Invite to team
          </Button>
        )}
      </footer>
    </motion.article>
  );
}
