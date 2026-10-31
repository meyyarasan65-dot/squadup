"use client";

import { Check, Plus } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { toggleEventRegistrationAction } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";

/** Register interest in an event (feeds the EventRegistered match component). */
export function RegisterToggle({
  eventId,
  registered,
  locked = false,
}: {
  eventId: string;
  registered: boolean;
  /** Team members stay registered while on a team. */
  locked?: boolean;
}) {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(registered);

  const toggle = () => {
    const next = !optimistic;
    startTransition(async () => {
      setOptimistic(next);
      const result = await toggleEventRegistrationAction(eventId, next);
      if (!result.ok) toast.error(result.error);
    });
  };

  return (
    <Button
      size="sm"
      variant={optimistic ? "secondary" : "outline"}
      onClick={toggle}
      disabled={locked}
      aria-pressed={optimistic}
      title={locked ? "You're on a team for this event" : undefined}
    >
      {optimistic ? <Check className="text-emerald-400" /> : <Plus />}
      {optimistic ? "Registered" : "Register"}
    </Button>
  );
}
