"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { leaveTeamAction } from "@/app/actions/teams";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { TeamWithMembers } from "@/types";

interface LeaveTeamButtonProps {
  team: TeamWithMembers;
  isLeader: boolean;
}

export function LeaveTeamButton({ team, isLeader }: LeaveTeamButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const otherMembers = team.members.filter((m) => m.user_id !== team.leader_id);
  const successor = otherMembers[0]?.profile.full_name;

  const onLeave = () => {
    startTransition(async () => {
      const result = await leaveTeamAction(team.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      if (result.data.dissolved) {
        toast.success("Team dissolved", {
          description: "All vacancies and invites have been closed.",
        });
      } else {
        toast.success("You left the team", {
          description: isLeader && successor ? `Leadership passed to ${successor}.` : undefined,
        });
      }

      setOpen(false);
      router.push("/events");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
          <LogOut className="h-4 w-4" />
          Leave team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave {team.team_name}?</DialogTitle>
          <DialogDescription>
            {isLeader ? (
              team.members.length > 1 ? (
                <>
                  You are the team leader. If you leave, leadership will automatically pass to the next member
                  {successor ? <strong className="text-zinc-200"> ({successor})</strong> : ""}.
                </>
              ) : (
                <>
                  You are the only member of this team. Leaving will <strong className="text-red-400">dissolve</strong> the team completely.
                </>
              )
            ) : (
              "Are you sure you want to leave this squad? You will become open to other teams for this event."
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onLeave} loading={isPending}>
            Confirm & leave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

