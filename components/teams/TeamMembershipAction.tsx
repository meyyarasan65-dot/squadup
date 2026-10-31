"use client";

import { Check, Clock, Lock, Send, UserCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cancelInviteAction, respondToInviteAction, sendInviteAction } from "@/app/actions/invites";
import { CountdownBadge } from "@/components/matchmaker/CountdownBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InviteWithDetails, TeamWithMembers } from "@/types";

interface TeamMembershipActionProps {
  team: TeamWithMembers;
  meId: string;
  myOtherTeamName: string | null;
  pendingInvite: InviteWithDetails | null;
  isEventClosed: boolean;
}

export function TeamMembershipAction({
  team,
  meId,
  myOtherTeamName,
  pendingInvite,
  isEventClosed,
}: TeamMembershipActionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<string | null>(null);

  const isFull = team.members.length >= team.event.team_max_size;

  if (myOtherTeamName) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs text-zinc-400">
        <UserCheck className="h-4 w-4 text-zinc-500" />
        <span>
          You are already on <strong className="text-zinc-200">{myOtherTeamName}</strong> for this event.
        </span>
      </div>
    );
  }

  if (pendingInvite) {
    if (pendingInvite.direction === "team_to_user") {
      // The team invited the current user
      const handleRespond = (accept: boolean) => {
        setActionType(accept ? "accept" : "decline");
        startTransition(async () => {
          const result = await respondToInviteAction(pendingInvite.id, accept);
          setActionType(null);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success(accept ? `Joined ${team.team_name}!` : "Invitation declined");
          router.refresh();
        });
      };

      return (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-emerald-300">You are invited to this squad!</span>
            <CountdownBadge expiresAt={pendingInvite.expires_at} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleRespond(false)}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
              Decline
            </Button>
            <Button
              size="sm"
              variant="success"
              onClick={() => handleRespond(true)}
              loading={actionType === "accept"}
            >
              <Check className="h-4 w-4" />
              Accept invite
            </Button>
          </div>
        </div>
      );
    }

    if (pendingInvite.direction === "user_to_team") {
      // The user requested to join
      const handleCancel = () => {
        setActionType("cancel");
        startTransition(async () => {
          const result = await cancelInviteAction(pendingInvite.id);
          setActionType(null);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Request withdrawn");
          router.refresh();
        });
      };

      return (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-zinc-300">Join request pending leader review</span>
            <CountdownBadge expiresAt={pendingInvite.expires_at} />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={handleCancel}
            loading={actionType === "cancel"}
          >
            Withdraw request
          </Button>
        </div>
      );
    }
  }

  if (isEventClosed) {
    return (
      <Badge variant="secondary" className="px-3 py-1.5">
        Registration closed
      </Badge>
    );
  }

  if (team.is_locked) {
    return (
      <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
        <Lock className="h-3 w-3" />
        Recruitment locked
      </Badge>
    );
  }

  if (isFull) {
    return (
      <Badge variant="secondary" className="px-3 py-1.5">
        Squad full ({team.members.length}/{team.event.team_max_size})
      </Badge>
    );
  }

  const handleRequest = () => {
    setActionType("join");
    startTransition(async () => {
      const result = await sendInviteAction(team.id, meId, "user_to_team");
      setActionType(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Request sent to team leader");
      router.refresh();
    });
  };

  return (
    <Button onClick={handleRequest} loading={actionType === "join"} size="sm">
      <Send className="h-4 w-4" />
      Request to join squad
    </Button>
  );
}

