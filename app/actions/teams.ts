"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { authed, readRpc, UNAUTHENTICATED, validate } from "@/lib/action-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";
import {
  createTeamSchema,
  removeMemberSchema,
  teamIdSchema,
  updateTeamSchema,
  type CreateTeamValues,
  type UpdateTeamValues,
} from "@/lib/schemas";
import type { ActionResult } from "@/types";

function dedupe<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export async function createTeamAction(
  values: CreateTeamValues,
): Promise<ActionResult<{ teamId: string }>> {
  const input = validate(createTeamSchema, values);
  if (!input.ok) return input;

  const session = await authed();
  if (!session) return UNAUTHENTICATED;

  const limit = checkRateLimit(`action:create_team:${session.userId}`, 5, 60_000);
  if (!limit.success) {
    return { ok: false, error: `Team creation rate limit reached. Try again in ${limit.retryAfterSec}s.` };
  }

  const { data, error } = await session.supabase.rpc("create_team", {
    p_event_id: input.data.event_id,
    p_team_name: input.data.team_name,
    p_pitch: input.data.pitch,
    p_target_roles: dedupe(input.data.target_roles),
    p_tech_stack: dedupe(input.data.tech_stack),
  });
  const result = readRpc(data, error);
  if (!result.success || !result.team_id) {
    return { ok: false, error: result.error ?? "Could not create the team" };
  }

  revalidateTag("teams");
  revalidateTag("candidates");
  revalidatePath("/events");
  revalidatePath("/matchmaker");
  return { ok: true, data: { teamId: result.team_id } };
}

export async function updateTeamAction(values: UpdateTeamValues): Promise<ActionResult> {
  const input = validate(updateTeamSchema, values);
  if (!input.ok) return input;

  const session = await authed();
  if (!session) return UNAUTHENTICATED;

  const limit = checkRateLimit(`action:update_team:${session.userId}`, 15, 60_000);
  if (!limit.success) {
    return { ok: false, error: `Too many updates. Please wait ${limit.retryAfterSec}s.` };
  }

  // RLS restricts updates to the leader; an empty result means "not allowed".
  const { data, error } = await session.supabase
    .from("teams")
    .update({
      team_name: input.data.team_name,
      pitch: input.data.pitch,
      target_roles: dedupe(input.data.target_roles),
      tech_stack: dedupe(input.data.tech_stack),
      is_locked: input.data.is_locked,
    })
    .eq("id", input.data.team_id)
    .select("id");

  if (error) return { ok: false, error: "Could not save the team" };
  if (!data || data.length === 0) {
    return { ok: false, error: "Only the team leader can edit this team" };
  }

  revalidateTag("teams");
  revalidatePath(`/teams/${input.data.team_id}`);
  revalidatePath("/matchmaker");
  revalidatePath("/events");
  return { ok: true, data: undefined };
}

export async function leaveTeamAction(teamId: string): Promise<ActionResult<{ dissolved: boolean }>> {
  const input = validate(teamIdSchema, { teamId });
  if (!input.ok) return input;

  const session = await authed();
  if (!session) return UNAUTHENTICATED;

  const { data, error } = await session.supabase.rpc("leave_team", { p_team_id: input.data.teamId });
  const result = readRpc(data, error);
  if (!result.success) return { ok: false, error: result.error ?? "Could not leave the team" };

  revalidateTag("teams");
  revalidateTag("candidates");
  revalidatePath(`/teams/${input.data.teamId}`);
  revalidatePath("/matchmaker");
  revalidatePath("/events");
  return { ok: true, data: { dissolved: result.dissolved ?? false } };
}

export async function removeMemberAction(teamId: string, userId: string): Promise<ActionResult> {
  const input = validate(removeMemberSchema, { teamId, userId });
  if (!input.ok) return input;

  const session = await authed();
  if (!session) return UNAUTHENTICATED;

  const { data, error } = await session.supabase.rpc("remove_team_member", {
    p_team_id: input.data.teamId,
    p_user_id: input.data.userId,
  });
  const result = readRpc(data, error);
  if (!result.success) return { ok: false, error: result.error ?? "Could not remove that member" };

  revalidatePath(`/teams/${input.data.teamId}`);
  revalidatePath("/matchmaker");
  return { ok: true, data: undefined };
}

export async function deleteTeamAction(teamId: string): Promise<ActionResult> {
  const input = validate(teamIdSchema, { teamId });
  if (!input.ok) return input;

  const session = await authed();
  if (!session) return UNAUTHENTICATED;

  const limit = checkRateLimit(`action:delete_team:${session.userId}`, 5, 60_000);
  if (!limit.success) {
    return { ok: false, error: `Too many requests. Please wait ${limit.retryAfterSec}s.` };
  }

  // First try the atomic delete_team RPC
  const { data, error } = await session.supabase.rpc("delete_team", {
    p_team_id: input.data.teamId,
  });

  const result = readRpc(data, error);
  if (result.success) {
    revalidatePath("/events");
    revalidatePath("/matchmaker");
    revalidatePath("/invites");
    return { ok: true, data: undefined };
  }

  // Fallback if migration 003 hasn't been executed yet in the database:
  // Verify team leadership
  const adminClient = createAdminClient();
  const { data: team, error: teamErr } = await adminClient
    .from("teams")
    .select("leader_id")
    .eq("id", input.data.teamId)
    .maybeSingle();

  if (teamErr || !team) {
    return { ok: false, error: "Team not found" };
  }

  if (team.leader_id !== session.userId) {
    return { ok: false, error: "Only the team leader can delete this team" };
  }

  // Fetch member ids to restore their looking for team status
  const { data: members } = await adminClient
    .from("team_members")
    .select("user_id")
    .eq("team_id", input.data.teamId);

  // Delete team
  const { error: delErr } = await adminClient
    .from("teams")
    .delete()
    .eq("id", input.data.teamId);

  if (delErr) {
    return { ok: false, error: delErr.message || "Could not delete team" };
  }

  if (members && members.length > 0) {
    const userIds = members.map((m) => m.user_id);
    await adminClient
      .from("profiles")
      .update({ is_looking_for_team: true })
      .in("id", userIds);
  }

  revalidateTag("teams");
  revalidateTag("candidates");
  revalidatePath("/events");
  revalidatePath("/matchmaker");
  revalidatePath("/invites");
  return { ok: true, data: undefined };
}

export async function updateSprintNotesAction(
  teamId: string,
  notes: string,
): Promise<ActionResult> {
  const session = await authed();
  if (!session) return UNAUTHENTICATED;

  const admin = createAdminClient();
  const { data: team } = await admin
    .from("teams")
    .select("leader_id")
    .eq("id", teamId)
    .maybeSingle();

  if (!team) {
    return { ok: false, error: "Team not found" };
  }

  const { data: member } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (!member && team.leader_id !== session.userId) {
    return { ok: false, error: "Only squad members can edit the sprint canvas" };
  }

  const { error } = await admin
    .from("teams")
    .update({ sprint_notes: notes })
    .eq("id", teamId);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

export async function updateTeamTracksAction(
  teamId: string,
  tracks: string[],
): Promise<ActionResult> {
  const session = await authed();
  if (!session) return UNAUTHENTICATED;

  const admin = createAdminClient();
  const { data: team } = await admin
    .from("teams")
    .select("leader_id")
    .eq("id", teamId)
    .maybeSingle();

  if (!team || team.leader_id !== session.userId) {
    return { ok: false, error: "Only the squad leader can modify target sponsor tracks" };
  }

  const { error } = await admin
    .from("teams")
    .update({ selected_tracks: tracks })
    .eq("id", teamId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/teams/${teamId}`);
  return { ok: true, data: undefined };
}
