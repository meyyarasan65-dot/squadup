"use client";

import { UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { removeMemberAction } from "@/app/actions/teams";
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
import type { TeamMemberWithProfile } from "@/types";

interface RemoveMemberButtonProps {
  teamId: string;
  member: TeamMemberWithProfile;
}

export function RemoveMemberButton({ teamId, member }: RemoveMemberButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onRemove = () => {
    startTransition(async () => {
      const result = await removeMemberAction(teamId, member.user_id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${member.profile.full_name} was removed from the squad`);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
          title={`Remove ${member.profile.full_name}`}
        >
          <UserMinus className="h-4 w-4" />
          <span className="sr-only">Remove {member.profile.full_name}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {member.profile.full_name}?</DialogTitle>
          <DialogDescription>
            This will remove them from the squad and reopen their slot in the roster.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onRemove} loading={isPending}>
            Remove member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

