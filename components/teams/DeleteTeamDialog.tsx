"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteTeamAction } from "@/app/actions/teams";
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

interface DeleteTeamDialogProps {
  team: TeamWithMembers;
  size?: "sm" | "default";
}

export function DeleteTeamDialog({ team, size = "sm" }: DeleteTeamDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    startTransition(async () => {
      const result = await deleteTeamAction(team.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`"${team.team_name}" deleted`, {
        description: "The squad has been disbanded and all pending invites cancelled.",
      });
      setOpen(false);
      router.push("/events");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className="gap-1.5 text-red-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
          title="Delete Squad"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete team</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-400">
            <Trash2 className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Leader Action</span>
          </div>
          <DialogTitle>Delete &ldquo;{team.team_name}&rdquo;?</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-sm text-zinc-400">
              <p>
                Are you sure you want to permanently delete this team?
              </p>
              <ul className="list-disc pl-5 text-xs text-zinc-400 space-y-1">
                <li>All {team.members.length} team member(s) will be released back to looking for teams.</li>
                <li>All pending outgoing team invites and incoming join requests will be cancelled.</li>
                <li>This team will be permanently removed from the hackathon roster.</li>
              </ul>
              <p className="text-red-400/90 font-medium">This action cannot be undone.</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-500 text-primary-foreground font-medium gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting team...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Disband & Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

