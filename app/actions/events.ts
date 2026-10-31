"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { UNAUTHENTICATED, validate } from "@/lib/action-helpers";
import { isAdminUsername } from "@/lib/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { createEventSchema, type CreateEventValues } from "@/lib/schemas";
import { createAdminClient, getSessionProfile } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

export async function createEventAction(
  values: CreateEventValues,
): Promise<ActionResult<{ eventId: string }>> {
  const input = validate(createEventSchema, values);
  if (!input.ok) return input;

  const session = await getSessionProfile();
  if (!session?.profile) return UNAUTHENTICATED;

  // Strict Admin Authorization Check
  if (!isAdminUsername(session.profile.github_username)) {
    return {
      ok: false,
      error: "Access denied: Only authorized administrator (meyyarasan65-dot) can host new hackathons.",
    };
  }

  // Rate limiting for event creation
  const limit = checkRateLimit(`action:create_event:${session.userId}`, 10, 60_000);
  if (!limit.success) {
    return {
      ok: false,
      error: `Too many requests. Please wait ${limit.retryAfterSec}s before creating another event.`,
    };
  }

  const adminClient = createAdminClient();

  // Check for slug collision
  const { data: existingSlug } = await adminClient
    .from("events")
    .select("id")
    .eq("slug", input.data.slug)
    .maybeSingle();

  if (existingSlug) {
    return {
      ok: false,
      error: `An event with the slug "${input.data.slug}" already exists. Please customize the slug.`,
    };
  }

  const { data, error } = await adminClient
    .from("events")
    .insert({
      title: input.data.title,
      slug: input.data.slug,
      organizer: input.data.organizer,
      description: input.data.description?.trim() || null,
      themes: input.data.themes,
      registration_deadline: new Date(input.data.registration_deadline).toISOString(),
      event_start: new Date(input.data.event_start).toISOString(),
      team_min_size: input.data.team_min_size,
      team_max_size: input.data.team_max_size,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createEventAction]", error);
    return {
      ok: false,
      error: error?.message || "Failed to create event in the database.",
    };
  }

  revalidateTag("events");
  revalidatePath("/events");
  revalidatePath("/matchmaker");

  return { ok: true, data: { eventId: data.id } };
}

export async function deleteEventAction(eventId: string): Promise<ActionResult> {
  const session = await getSessionProfile();
  if (!session?.profile) return UNAUTHENTICATED;

  // Strict Admin Authorization Check
  if (!isAdminUsername(session.profile.github_username)) {
    return {
      ok: false,
      error: "Access denied: Only authorized administrator (meyyarasan65-dot) can delete hackathons.",
    };
  }

  // Rate limiting for event deletion
  const limit = checkRateLimit(`action:delete_event:${session.userId}`, 10, 60_000);
  if (!limit.success) {
    return {
      ok: false,
      error: `Too many requests. Please wait ${limit.retryAfterSec}s before deleting another event.`,
    };
  }

  const adminClient = createAdminClient();

  // Find all teams participating in this event to reset their members' availability
  const { data: teams } = await adminClient
    .from("teams")
    .select("id")
    .eq("event_id", eventId);

  if (teams && teams.length > 0) {
    const teamIds = teams.map((t) => t.id);
    const { data: members } = await adminClient
      .from("team_members")
      .select("user_id")
      .in("team_id", teamIds);

    if (members && members.length > 0) {
      const userIds = [...new Set(members.map((m) => m.user_id))];
      await adminClient
        .from("profiles")
        .update({ is_looking_for_team: true })
        .in("id", userIds);
    }
  }

  // Delete the event (cascades to teams, team_members, event_registrations, invites)
  const { error } = await adminClient.from("events").delete().eq("id", eventId);

  if (error) {
    console.error("[deleteEventAction]", error);
    return { ok: false, error: error.message || "Failed to delete the event." };
  }

  revalidateTag("events");
  revalidateTag("teams");
  revalidatePath("/events");
  revalidatePath("/matchmaker");

  return { ok: true, data: undefined };
}

