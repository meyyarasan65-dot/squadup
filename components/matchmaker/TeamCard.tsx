"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Check, Clock, UserPlus } from "lucide-react";
import Link from "next/link";
import { MatchScoreRing, MatchTag, PulseDot, RoleBadge } from "@/components/shared/badges";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { languageColor } from "@/lib/constants";
import { openRoles, openSlots } from "@/lib/mappers";
import { formatRelative } from "@/lib/utils";
import type { MatchResult, TeamWithMembers } from "@/types";

interface TeamCardProps {
  team: TeamWithMembers;
  match: MatchResult;
  requested: boolean;
  /** The team has already invited this user; send them to the inbox to accept. */
  invitedByTeam?: boolean;
  onRequest: () => void;
  disabled?: boolean;
}

export function TeamCard({
  team,
  match,
  requested,
  invitedByTeam = false,
  onRequest,
  disabled = false,
}: TeamCardProps) {
  const roles = openRoles(team);
  const slots = openSlots(team);

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
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Link
            href={`/teams/${team.id}`}
            className="flex items-center gap-1 truncate font-medium text-white hover:underline"
          >
            {team.team_name}
            <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
          <p className="truncate text-xs text-zinc-400">{team.event.title}</p>
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

      {team.pitch && <p className="line-clamp-2 text-sm text-zinc-400">{team.pitch}</p>}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <PulseDot />
          <span>
            {slots} open {slots === 1 ? "slot" : "slots"}
            {roles.length > 0 && " · looking for"}
          </span>
        </div>
        {roles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {roles.map((r) => (
              <RoleBadge key={r} role={r} />
            ))}
          </div>
        )}
      </div>

      {team.tech_stack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {team.tech_stack.map((lang) => (
            <span
              key={lang}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-300"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: languageColor(lang) }} />
              {lang}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {team.members.slice(0, 5).map((m) => (
            <UserAvatar
              key={m.id}
              name={m.profile.full_name}
              src={m.profile.avatar_url}
              className="h-7 w-7 ring-2 ring-zinc-950"
            />
          ))}
        </div>
        <span className="flex items-center gap-1 text-xs text-zinc-400" suppressHydrationWarning>
          <Clock className="h-3 w-3" aria-hidden />
          closes {formatRelative(team.event.registration_deadline)}
        </span>
      </div>

      <footer className="mt-auto pt-1">
        {invitedByTeam ? (
          <Button asChild variant="success" className="w-full">
            <Link href="/invites">You&apos;re invited · respond</Link>
          </Button>
        ) : requested ? (
          <motion.div
            initial={{ scale: 0.92, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
          >
            <Button variant="secondary" className="w-full text-emerald-300" disabled>
              <Check />
              Request sent
            </Button>
          </motion.div>
        ) : (
          <Button className="w-full" onClick={onRequest} disabled={disabled}>
            <UserPlus />
            Request to join
          </Button>
        )}
      </footer>
    </motion.article>
  );
}
