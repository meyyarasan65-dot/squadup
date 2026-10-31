"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteEventAction } from "@/app/actions/events";
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
import type { HackathonEvent } from "@/types";

interface DeleteEventDialogProps {
  event: HackathonEvent;
  teamsCount?: number;
  size?: "sm" | "default";
  /** Controlled mode, with no built-in trigger, for opening from a menu item. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DeleteEventDialog({
  event,
  teamsCount = 0,
  size = "sm",
  open: controlledOpen,
  onOpenChange,
}: DeleteEventDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    startTransition(async () => {
      const result = await deleteEventAction(event.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`"${event.title}" deleted`, {
        description: "The hackathon and all linked teams/registrations were removed.",
      });
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size={size}
            className="gap-1.5 text-red-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
            title="Delete Hackathon (Admin Only)"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-400">
            <Trash2 className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Admin Action</span>
          </div>
          <DialogTitle>Delete &ldquo;{event.title}&rdquo;?</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-sm text-zinc-400">
              <p>
                Are you sure you want to delete this hackathon? This will permanently delete:
              </p>
              <ul className="list-disc pl-5 text-xs text-zinc-400 space-y-1">
                <li>{teamsCount} squad{teamsCount === 1 ? "" : "s"} created for this event</li>
                <li>All participant event registrations</li>
                <li>All pending team invites and join requests</li>
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
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Event
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

