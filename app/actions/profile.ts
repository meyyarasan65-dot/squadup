"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { authed, UNAUTHENTICATED, validate } from "@/lib/action-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  availabilitySchema,
  eventRegistrationSchema,
  profileFormSchema,
  type ProfileFormValues,
} from "@/lib/schemas";
import type { ActionResult } from "@/types";

export async function updateProfileAction(values: ProfileFormValues): Promise<ActionResult> {
  const input = validate(profileFormSchema, values);
  if (!input.ok) return input;

  const session = await authed();
  if (!session) return UNAUTHENTICATED;

  const limit = checkRateLimit(`action:update_profile:${session.userId}`, 15, 60_000);
  if (!limit.success) {
    return { ok: false, error: `Too many profile updates. Please wait ${limit.retryAfterSec}s.` };
  }

  const { error } = await session.supabase
    .from("profiles")
    .update({
      full_name: input.data.full_name,
      college: input.data.college,
      bio: input.data.bio || null,
      primary_role: input.data.primary_role,
      is_looking_for_team: input.data.is_looking_for_team,
      hacker_pace: input.data.hacker_pace ?? "all_nighter",
      onboarded: true,
    })
    .eq("id", session.userId);

  if (error) return { ok: false, error: "Could not save your profile" };

  revalidateTag("candidates");
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

export async function toggleAvailabilityAction(looking: boolean): Promise<ActionResult> {
  const input = validate(availabilitySchema, { looking });
  if (!input.ok) return input;

  const session = await authed();
  if (!session) return UNAUTHENTICATED;

  const { error } = await session.supabase
    .from("profiles")
    .update({ is_looking_for_team: input.data.looking })
    .eq("id", session.userId);

  if (error) return { ok: false, error: "Could not update your availability" };

  revalidateTag("candidates");
  revalidatePath("/matchmaker");
  revalidatePath("/profile");
  return { ok: true, data: undefined };
}

export async function toggleEventRegistrationAction(
  eventId: string,
  register: boolean,
): Promise<ActionResult> {
  const input = validate(eventRegistrationSchema, { eventId, register });
  if (!input.ok) return input;

  const session = await authed();
  if (!session) return UNAUTHENTICATED;

  const { error } = input.data.register
    ? await session.supabase
        .from("event_registrations")
        .upsert(
          { event_id: input.data.eventId, user_id: session.userId },
          { onConflict: "event_id,user_id", ignoreDuplicates: true },
        )
    : await session.supabase
        .from("event_registrations")
        .delete()
        .eq("event_id", input.data.eventId)
        .eq("user_id", session.userId);

  if (error) return { ok: false, error: "Could not update your registration" };

  revalidateTag("registrations");
  revalidatePath("/events");
  revalidatePath("/matchmaker");
  return { ok: true, data: undefined };
}
