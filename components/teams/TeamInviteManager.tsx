"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cancelInviteAction, respondToInviteAction } from "@/app/actions/invites";
import { CountdownBadge } from "@/components/matchmaker/CountdownBadge";
import { GithubIcon, RoleBadge } from "@/components/shared/badges";
import { SkillBars } from "@/components/shared/SkillBars";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { openSlots } from "@/lib/mappers";
import type { InviteWithDetails, TeamWithMembers } from "@/types";

interface TeamInviteManagerProps {
  team: TeamWithMembers;
  invites: InviteWithDetails[];
}

export function TeamInviteManager({ team, invites }: TeamInviteManagerProps) {
  const router = useRouter();
  const [loadingInviteId, setLoadingInviteId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const teamInvites = invites.filter((i) => i.team_id === team.id);
  const incomingRequests = teamInvites.filter((i) => i.direction === "user_to_team");
  const outgoingInvites = teamInvites.filter((i) => i.direction === "team_to_user");
  const slots = openSlots(team);

  const handleRespond = (inviteId: string, accept: boolean) => {
    setLoadingInviteId(inviteId);
    startTransition(async () => {
      const result = await respondToInviteAction(inviteId, accept);
      setLoadingInviteId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(accept ? "Candidate accepted into team!" : "Request declined");
      router.refresh();
    });
  };

  const handleCancel = (inviteId: string) => {
    setLoadingInviteId(inviteId);
    startTransition(async () => {
      const result = await cancelInviteAction(inviteId);
      setLoadingInviteId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Invitation cancelled");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Incoming Requests */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white">Join requests</h3>
            <Badge variant={incomingRequests.length > 0 ? "success" : "secondary"}>
              {incomingRequests.length}
            </Badge>
          </div>
          {slots > 0 && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/matchmaker?event=${team.event_id}`}>
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Find candidates
              </Link>
            </Button>
          )}
        </div>

        {incomingRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
            No incoming join requests at this time.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {incomingRequests.map((invite) => {
              const candidate = invite.profile;
              const isLoading = loadingInviteId === invite.id;

              return (
                <motion.div
                  key={invite.id}
                  layout
                  className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={candidate.full_name} src={candidate.avatar_url} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{candidate.full_name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <RoleBadge role={candidate.primary_role} />
                          <span className="truncate">@{candidate.github_username}</span>
                        </div>
                      </div>
                    </div>
                    <CountdownBadge expiresAt={invite.expires_at} />
                  </div>

                  {candidate.bio && (
                    <p className="line-clamp-2 text-xs text-zinc-400">{candidate.bio}</p>
                  )}

                  <SkillBars skills={candidate.verified_skills} highlight={team.tech_stack} limit={3} compact />

                  <div className="mt-auto flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-zinc-400 hover:text-red-400"
                      onClick={() => handleRespond(invite.id, false)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      variant="success"
                      className="flex-1"
                      onClick={() => handleRespond(invite.id, true)}
                      loading={isLoading}
                    >
                      <Check className="h-4 w-4" />
                      Accept
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Outgoing Invites */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-white">Sent invitations</h3>
          <Badge variant="secondary">{outgoingInvites.length}</Badge>
        </div>

        {outgoingInvites.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
            No active outgoing invitations.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {outgoingInvites.map((invite) => {
              const candidate = invite.profile;
              const isLoading = loadingInviteId === invite.id;

              return (
                <div
                  key={invite.id}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={candidate.full_name} src={candidate.avatar_url} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{candidate.full_name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <RoleBadge role={candidate.primary_role} />
                          <span className="flex items-center gap-1 text-zinc-500 font-mono">
                            <GithubIcon className="h-3 w-3" />
                            {candidate.github_username}
                          </span>
                        </div>
                      </div>
                    </div>
                    <CountdownBadge expiresAt={invite.expires_at} />
                  </div>

                  <SkillBars skills={candidate.verified_skills} highlight={team.tech_stack} limit={3} compact />

                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-xs text-zinc-500">Waiting for candidate response</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancel(invite.id)}
                      loading={isLoading}
                    >
                      Cancel invite
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Open recruiting notice */}
      {slots > 0 && incomingRequests.length === 0 && outgoingInvites.length === 0 && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                You have {slots} open {slots === 1 ? "vacancy" : "vacancies"}
              </p>
              <p className="text-xs text-zinc-400">
                Matchmaker ranks candidates by role fit and GitHub language overlap.
              </p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link href={`/matchmaker?event=${team.event_id}`}>Recruit candidates</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

