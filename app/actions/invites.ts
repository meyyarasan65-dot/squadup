"use server";

import { revalidatePath } from "next/cache";
import { authed, readRpc, UNAUTHENTICATED, validate } from "@/lib/action-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { inviteIdSchema, respondToInviteSchema, sendInviteSchema } from "@/lib/schemas";
import type { ActionResult, InviteDirection } from "@/types";

function revalidateInviteViews(teamId?: string) {
  revalidatePath("/matchmaker");
  revalidatePath("/invites");
  revalidatePath("/events");
  if (teamId) revalidatePath(`/teams/${teamId}`);
  // The dashboard layout renders the pending-invite badge.
  revalidatePath("/", "layout");
}

/**
 * team_to_user: a leader invites a candidate.
 * user_to_team: a candidate requests to join (userId must be the caller).
 * All authorization and capacity checks run atomically in send_team_invite().
 */
export async function sendInviteAction(
  teamId: string,
  userId: string,
  direction: InviteDirection,
): Promise<ActionResult<{ inviteId: string }>> {
  const input = validate(sendInviteSchema, { teamId, userId, direction });
  if (!input.ok) return input;

  const session = await authed();
  if (!session) return UNAUTHENTICATED;

  const limit = checkRateLimit(`action:send_invite:${session.userId}`, 20, 60_000);
  if (!limit.success) {
    return { ok: false, error: `Too many invites sent. Please wait ${limit.retryAfterSec}s.` };
  }

  const { data, error } = await session.supabase.rpc("send_team_invite", {
    p_team_id: input.data.teamId,
    p_user_id: input.data.userId,
    p_direction: input.data.direction,
  });
  const result = readRpc(data, error);
  if (!result.success || !result.invite_id) {
    return { ok: false, error: result.error ?? "Could not send the invite" };
  }

  revalidateInviteViews(input.data.teamId);
  return { ok: true, data: { inviteId: result.invite_id } };
}

/** Accept runs the row-locking accept_team_invite() RPC; decline is a plain transition. */
export async function respondToInviteAction(
  inviteId: string,
  accept: boolean,
): Promise<ActionResult<{ teamId: string | null }>> {
  const input = validate(respondToInviteSchema, { inviteId, accept });
  if (!input.ok) return input;

  const session = await authed();
  if (!session) return UNAUTHENTICATED;

  const { data, error } = input.data.accept
    ? await session.supabase.rpc("accept_team_invite", { p_invite_id: input.data.inviteId })
    : await session.supabase.rpc("decline_team_invite", { p_invite_id: input.data.inviteId });
  const result = readRpc(data, error);
  if (!result.success) return { ok: false, error: result.error ?? "Could not update the invite" };

  revalidateInviteViews(result.team_id);
  return { ok: true, data: { teamId: result.team_id ?? null } };
}

/** The sender withdraws a pending invite or join request. */
export async function cancelInviteAction(inviteId: string): Promise<ActionResult> {
  const input = validate(inviteIdSchema, { inviteId });
  if (!input.ok) return input;

  const session = await authed();
  if (!session) return UNAUTHENTICATED;

  const { data, error } = await session.supabase.rpc("decline_team_invite", {
    p_invite_id: input.data.inviteId,
  });
  const result = readRpc(data, error);
  if (!result.success) return { ok: false, error: result.error ?? "Could not cancel the invite" };

  revalidateInviteViews();
  return { ok: true, data: undefined };
}
