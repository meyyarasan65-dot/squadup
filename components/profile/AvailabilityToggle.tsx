"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { toggleAvailabilityAction } from "@/app/actions/profile";
import { PulseDot } from "@/components/shared/badges";
import { Label, Switch } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";

/** "Open to teams" switch with optimistic state. */
export function AvailabilityToggle({ looking, className }: { looking: boolean; className?: string }) {
  const [, startTransition] = useTransition();
  const [optimisticLooking, setOptimisticLooking] = useOptimistic(looking);

  const onChange = (next: boolean) => {
    startTransition(async () => {
      setOptimisticLooking(next);
      const result = await toggleAvailabilityAction(next);
      if (!result.ok) toast.error(result.error);
      else toast.success(next ? "You're visible to teams" : "You're hidden from team searches");
    });
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Switch id="availability" checked={optimisticLooking} onCheckedChange={onChange} />
      <Label htmlFor="availability" className="flex cursor-pointer items-center gap-2 text-sm">
        {optimisticLooking && <PulseDot />}
        {optimisticLooking ? "Open to teams" : "Not looking"}
      </Label>
    </div>
  );
}
