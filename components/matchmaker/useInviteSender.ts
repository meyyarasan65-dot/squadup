"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { sendInviteAction } from "@/app/actions/invites";
import { pairKey } from "@/lib/utils";
import type { InviteDirection } from "@/types";

/**
 * Sends invites/requests with optimistic UI: the pair is marked as pending
 * immediately and automatically rolls back if the server rejects it.
 */
export function useInviteSender(serverPendingPairs: readonly string[]) {
  const [isPending, startTransition] = useTransition();
  const [pendingPairs, markPending] = useOptimistic(
    serverPendingPairs,
    (state: readonly string[], key: string) => [...state, key],
  );

  const send = (teamId: string, userId: string, direction: InviteDirection, successMessage: string) => {
    startTransition(async () => {
      markPending(pairKey(teamId, userId));
      const result = await sendInviteAction(teamId, userId, direction);
      if (result.ok) toast.success(successMessage, { description: "It expires in 24 hours." });
      else toast.error(result.error);
    });
  };

  const isPairPending = (teamId: string, userId: string) => pendingPairs.includes(pairKey(teamId, userId));

  return { send, isPairPending, isSending: isPending };
}
