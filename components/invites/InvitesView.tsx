"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  Clock,
  History,
  Inbox,
  Send,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cancelInviteAction, respondToInviteAction } from "@/app/actions/invites";
import { CountdownBadge } from "@/components/matchmaker/CountdownBadge";
import { GithubIcon, RoleBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkillBars } from "@/components/shared/SkillBars";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatRelative } from "@/lib/utils";
import type { InviteWithDetails } from "@/types";

interface InvitesViewProps {
  userId: string;
  incoming: InviteWithDetails[];
  outgoing: InviteWithDetails[];
  history: InviteWithDetails[];
}

export function InvitesView({ userId, incoming, outgoing, history }: InvitesViewProps) {
  const router = useRouter();
  const [activeInviteId, setActiveInviteId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleRespond = (inviteId: string, accept: boolean, teamName: string) => {
    setActiveInviteId(inviteId);
    startTransition(async () => {
      const result = await respondToInviteAction(inviteId, accept);
      setActiveInviteId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        accept ? `Accepted invitation into ${teamName}!` : "Invitation declined",
        { description: accept ? "You are now on the squad roster." : undefined },
      );
      router.refresh();
    });
  };

  const handleCancel = (inviteId: string) => {
    setActiveInviteId(inviteId);
    startTransition(async () => {
      const result = await cancelInviteAction(inviteId);
      setActiveInviteId(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Invitation cancelled / withdrawn");
      router.refresh();
    });
  };

  return (
    <Tabs defaultValue="incoming" className="w-full">
      <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
        <TabsTrigger value="incoming" className="gap-2">
          <Inbox className="h-4 w-4" />
          <span>Incoming</span>
          {incoming.length > 0 && (
            <span className="ml-1 rounded-full bg-indigo-500 px-1.5 py-0.2 font-mono text-[10px] font-bold text-white">
              {incoming.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="outgoing" className="gap-2">
          <Send className="h-4 w-4" />
          <span>Sent</span>
          {outgoing.length > 0 && (
            <span className="ml-1 rounded-full bg-zinc-700 px-1.5 py-0.2 font-mono text-[10px] font-medium text-zinc-200">
              {outgoing.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="history" className="gap-2">
          <History className="h-4 w-4" />
          <span>History</span>
        </TabsTrigger>
      </TabsList>

      {/* Incoming Invites */}
      <TabsContent value="incoming">
        {incoming.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Your inbox is clear"
            description="When teams invite you or candidates request to join your squads, they'll show up here with a 24-hour countdown."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {incoming.map((invite) => {
              const isLoading = activeInviteId === invite.id;
              const isTeamInvite = invite.direction === "team_to_user";

              return (
                <motion.div
                  key={invite.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Badge variant={isTeamInvite ? "success" : "default"}>
                      {isTeamInvite ? "Team Invitation" : "Candidate Join Request"}
                    </Badge>
                    <CountdownBadge expiresAt={invite.expires_at} />
                  </div>

                  {isTeamInvite ? (
                    /* Team invited user */
                    <div className="flex flex-col gap-3">
                      <div>
                        <Link
                          href={`/teams/${invite.team.id}`}
                          className="flex items-center gap-1 font-semibold text-white hover:underline"
                        >
                          {invite.team.team_name}
                          <ArrowUpRight className="h-3.5 w-3.5 text-zinc-500" />
                        </Link>
                        <p className="text-xs text-zinc-400">
                          for {invite.team.event.title}
                        </p>
                      </div>

                      {invite.team.pitch && (
                        <p className="line-clamp-2 text-xs text-zinc-300">
                          &ldquo;{invite.team.pitch}&rdquo;
                        </p>
                      )}

                      {invite.team.target_roles.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {invite.team.target_roles.map((r) => (
                            <RoleBadge key={r} role={r} />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Candidate requested to join user's team */
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={invite.profile.full_name}
                          src={invite.profile.avatar_url}
                          className="h-10 w-10"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {invite.profile.full_name}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <RoleBadge role={invite.profile.primary_role} />
                            <a
                              href={`https://github.com/${invite.profile.github_username}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 font-mono text-zinc-500 hover:text-white"
                            >
                              <GithubIcon className="h-3 w-3" />
                              {invite.profile.github_username}
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg bg-zinc-950/60 p-2.5 text-xs text-zinc-400">
                        Requested to join:{" "}
                        <Link
                          href={`/teams/${invite.team.id}`}
                          className="font-medium text-zinc-200 hover:underline"
                        >
                          {invite.team.team_name}
                        </Link>
                      </div>

                      <SkillBars
                        skills={invite.profile.verified_skills}
                        highlight={invite.team.tech_stack}
                        limit={3}
                        compact
                      />
                    </div>
                  )}

                  <div className="mt-auto flex items-center gap-2 border-t border-zinc-800/80 pt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-zinc-400 hover:text-red-400"
                      onClick={() => handleRespond(invite.id, false, invite.team.team_name)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      variant="success"
                      className="flex-1"
                      onClick={() => handleRespond(invite.id, true, invite.team.team_name)}
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
      </TabsContent>

      {/* Outgoing Invites */}
      <TabsContent value="outgoing">
        {outgoing.length === 0 ? (
          <EmptyState
            icon={Send}
            title="No sent invites pending"
            description="When you invite candidates or request to join a squad, track pending responses here."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {outgoing.map((invite) => {
              const isLoading = activeInviteId === invite.id;
              const isSentCandidateInvite = invite.direction === "team_to_user";

              return (
                <div
                  key={invite.id}
                  className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Badge variant="secondary">
                      {isSentCandidateInvite ? "Sent Team Invite" : "Your Join Request"}
                    </Badge>
                    <CountdownBadge expiresAt={invite.expires_at} />
                  </div>

                  {isSentCandidateInvite ? (
                    /* User's team invited a candidate */
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={invite.profile.full_name}
                        src={invite.profile.avatar_url}
                        className="h-10 w-10"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{invite.profile.full_name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <RoleBadge role={invite.profile.primary_role} />
                          <span className="truncate">@{invite.profile.github_username}</span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          Invited to: {invite.team.team_name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* User requested to join a team */
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/teams/${invite.team.id}`}
                        className="flex items-center gap-1 font-semibold text-white hover:underline"
                      >
                        {invite.team.team_name}
                        <ArrowUpRight className="h-3.5 w-3.5 text-zinc-500" />
                      </Link>
                      <p className="text-xs text-zinc-400">
                        Event: {invite.team.event.title}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Waiting for team leader review
                      </p>
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between border-t border-zinc-800/80 pt-3">
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <Clock className="h-3 w-3" />
                      Pending response
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancel(invite.id)}
                      loading={isLoading}
                    >
                      {isSentCandidateInvite ? "Cancel invite" : "Withdraw request"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </TabsContent>

      {/* History */}
      <TabsContent value="history">
        {history.length === 0 ? (
          <EmptyState
            icon={History}
            title="No past activity"
            description="Resolved, declined, and expired invitations will appear in this log."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((item) => {
              const statusVariant =
                item.status === "accepted"
                  ? "success"
                  : item.status === "declined"
                    ? "destructive"
                    : "secondary";

              const isUserInvolved = item.user_id === userId;

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    {item.status === "accepted" ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Check className="h-4 w-4" />
                      </div>
                    ) : item.status === "declined" ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                        <XCircle className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                        <Clock className="h-4 w-4" />
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-white">
                        {item.direction === "team_to_user"
                          ? `${item.team.team_name} invited ${isUserInvolved ? "you" : item.profile.full_name}`
                          : `${isUserInvolved ? "You" : item.profile.full_name} requested to join ${item.team.team_name}`}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {item.team.event.title}
                        {item.created_at && ` · ${formatDate(item.created_at)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.created_at && (
                      <span className="text-xs text-zinc-500">
                        {formatRelative(item.created_at)}
                      </span>
                    )}
                    <Badge variant={statusVariant} className="capitalize">
                      {item.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
