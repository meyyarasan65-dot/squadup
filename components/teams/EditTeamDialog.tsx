"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { toast } from "sonner";
import { updateTeamAction } from "@/app/actions/teams";
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
import { Label, Switch } from "@/components/ui/form-controls";
import { updateTeamSchema, type TeamFormValues, type UpdateTeamValues } from "@/lib/schemas";
import type { TeamWithMembers } from "@/types";

interface EditTeamDialogProps {
  team: TeamWithMembers;
}

export function EditTeamDialog({ team }: EditTeamDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateTeamValues>({
    resolver: zodResolver(updateTeamSchema),
    defaultValues: {
      team_id: team.id,
      team_name: team.team_name,
      pitch: team.pitch ?? "",
      target_roles: team.target_roles,
      tech_stack: team.tech_stack,
      is_locked: team.is_locked,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateTeamAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Team settings saved");
      setOpen(false);
      router.refresh();
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
          Edit team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit team settings</DialogTitle>
          <DialogDescription>
            Update your pitch, open roles, desired languages, or lock recruitment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          <TeamFormFields
            register={form.register as unknown as UseFormRegister<TeamFormValues>}
            control={form.control as unknown as Control<TeamFormValues>}
            errors={form.formState.errors as unknown as FieldErrors<TeamFormValues>}
          />

          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="is_locked" className="cursor-pointer text-sm font-medium text-zinc-200">
                Lock team recruitment
              </Label>
              <p className="text-xs text-zinc-500">
                Prevents new candidate join requests while locked
              </p>
            </div>
            <Controller
              control={form.control}
              name="is_locked"
              render={({ field }) => (
                <Switch
                  id="is_locked"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

