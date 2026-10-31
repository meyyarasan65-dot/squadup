"use client";

import { motion } from "framer-motion";
import { Check, ExternalLink, GitCommitHorizontal, Send, Star } from "lucide-react";
import Link from "next/link";
import { GithubIcon, MatchScoreRing, RoleBadge } from "@/components/shared/badges";
import { SkillBars } from "@/components/shared/SkillBars";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCompact } from "@/lib/utils";
import type { MatchResult, Profile } from "@/types";

interface CandidateCardProps {
  candidate: Profile;
  match: MatchResult;
  /** Languages to emphasize in the skill bars (the team's desired stack). */
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
      className="group flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80"
    >
      <header className="flex items-start gap-3">
        <UserAvatar name={candidate.full_name} src={candidate.avatar_url} className="h-11 w-11" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-medium text-white">{candidate.full_name}</h3>
            {isDemo && <Badge variant="secondary">Demo</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <RoleBadge role={candidate.primary_role} />
            <span className="truncate">{candidate.college}</span>
          </div>
        </div>
        <MatchScoreRing score={match.score} />
      </header>

      {candidate.bio && <p className="line-clamp-2 text-sm text-zinc-400">{candidate.bio}</p>}

      <SkillBars skills={candidate.verified_skills} highlight={highlightLanguages} limit={4} compact />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-zinc-500">
        {stats.total_commits !== null && (
          <span className="flex items-center gap-1" title="Commits authored (GitHub search)">
            <GitCommitHorizontal className="h-3.5 w-3.5" aria-hidden />
            {formatCompact(stats.total_commits)} commits
          </span>
        )}
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5" aria-hidden />
          {formatCompact(stats.total_stars)}
        </span>
        <span>{stats.public_repos} repos</span>
        {isDemo ? (
          <span className="flex items-center gap-1 text-zinc-600">
            <GithubIcon className="h-3.5 w-3.5" />@{candidate.github_username}
          </span>
        ) : (
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-zinc-400 hover:text-white"
          >
            <GithubIcon className="h-3.5 w-3.5" />@{candidate.github_username}
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        )}
      </div>

      {match.reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {match.reasons.map((r) => (
            <Badge key={r} variant={r === "Exact Role Match" ? "success" : "default"}>
              {r}
            </Badge>
          ))}
        </div>
      )}

      <footer className="mt-auto flex items-center gap-2 pt-1">
        {requestedToJoin ? (
          <Button asChild variant="secondary" className="w-full">
            <Link href="/invites">Wants to join · review request</Link>
          </Button>
        ) : invited ? (
          <Button variant="secondary" className="w-full" disabled>
            <Check />
            Invite sent
          </Button>
        ) : (
          <Button className="w-full" onClick={onInvite} disabled={disabled}>
            <Send />
            Invite to team
          </Button>
        )}
      </footer>
    </motion.article>
  );
}
