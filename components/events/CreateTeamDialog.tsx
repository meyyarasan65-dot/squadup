"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createTeamAction } from "@/app/actions/teams";
import { TeamFormFields } from "@/components/teams/TeamFormFields";
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
import { teamFormSchema, type TeamFormValues } from "@/lib/schemas";
import type { HackathonEvent } from "@/types";

export function CreateTeamDialog({ event }: { event: HackathonEvent }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: { team_name: "", pitch: "", target_roles: [], tech_stack: [] },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createTeamAction({ ...values, event_id: event.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${values.team_name} is live`, { description: "Now find people for your open roles." });
      setOpen(false);
      form.reset();
      router.push(`/teams/${result.data.teamId}`);
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          Create team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a team</DialogTitle>
          <DialogDescription>
            For {event.title}. Teams of {event.team_min_size}–{event.team_max_size}. You&apos;ll be the leader.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          <TeamFormFields register={form.register} control={form.control} errors={form.formState.errors} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Create team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
