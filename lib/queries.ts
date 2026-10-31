import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  TEAM_WITH_MEMBERS_SELECT,
  toEvent,
  toInvite,
  toProfile,
  toTeam,
  toTeamWithMembers,
} from "@/lib/mappers";
import { registrationKey } from "@/lib/match-algorithm";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { HackathonEvent, InviteWithDetails, Profile, TeamWithMembers } from "@/types";

function compact<T>(values: (T | null)[]): T[] {
  return values.filter((v): v is T => v !== null);
}

export const getEvents = unstable_cache(
  async (): Promise<HackathonEvent[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("registration_deadline", { ascending: true });
    if (error) throw new Error("Failed to load events");
    return data.map(toEvent);
  },
  ["events-list"],
  { revalidate: 30, tags: ["events"] },
);

const getCachedAllTeams = unstable_cache(
  async (): Promise<TeamWithMembers[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("teams")
      .select(TEAM_WITH_MEMBERS_SELECT)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error("Failed to load teams");
    return compact(data.map(toTeamWithMembers));
  },
  ["all-teams-with-members"],
  { revalidate: 15, tags: ["teams"] },
);

export async function getTeamsWithMembers(filter?: { eventId?: string }): Promise<TeamWithMembers[]> {
  const allTeams = await getCachedAllTeams();
  if (filter?.eventId) {
    return allTeams.filter((t) => t.event_id === filter.eventId);
  }
  return allTeams;
}

export const getTeam = cache(async (id: string): Promise<TeamWithMembers | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .select(TEAM_WITH_MEMBERS_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Failed to load team");
  return data ? toTeamWithMembers(data) : null;
});

/** Profiles open to offers, most recently active first. */
export const getCandidates = unstable_cache(
  async (): Promise<Profile[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_looking_for_team", true)
      .eq("onboarded", true)
      .order("updated_at", { ascending: false })
      .limit(300);
    if (error) throw new Error("Failed to load candidates");
    return data.map(toProfile);
  },
  ["candidates-list"],
  { revalidate: 20, tags: ["candidates"] },
);

const getCachedRegistrationList = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("event_registrations").select("event_id, user_id");
    if (error) throw new Error("Failed to load registrations");
    return data.map((r) => registrationKey(r.event_id, r.user_id));
  },
  ["registration-keys"],
  { revalidate: 20, tags: ["registrations"] },
);

/** Set of `${eventId}:${userId}` registration keys. */
export async function getRegistrationKeys(): Promise<Set<string>> {
  const list = await getCachedRegistrationList();
  return new Set(list);
}

const INVITE_DETAILS_SELECT = "*, team:teams(*, event:events(*)), profile:profiles(*)" as const;

/**
 * Every live invite the user can see (RLS: ones addressed to them or to teams
 * they lead). Lapsed-but-unpruned invites are excluded.
 */
export async function getLiveInvites(): Promise<InviteWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invites")
    .select(INVITE_DETAILS_SELECT)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: true });
  if (error) throw new Error("Failed to load invites");

  return data.flatMap((row) => {
    if (!row.team || !row.team.event || !row.profile) return [];
    const { team, profile, ...invite } = row;
    return [
      {
        ...toInvite(invite),
        team: { ...toTeam(team), event: toEvent(team.event) },
        profile: toProfile(profile),
      },
    ];
  });
}

/** Recently resolved invites, for the inbox history section. */
export async function getRecentInviteHistory(): Promise<InviteWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invites")
    .select(INVITE_DETAILS_SELECT)
    .neq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error("Failed to load invite history");

  return data.flatMap((row) => {
    if (!row.team || !row.team.event || !row.profile) return [];
    const { team, profile, ...invite } = row;
    return [
      {
        ...toInvite(invite),
        team: { ...toTeam(team), event: toEvent(team.event) },
        profile: toProfile(profile),
      },
    ];
  });
}

/** Pending invites waiting on *this user's* response (drives the nav badge). */
export function incomingInvites(invites: InviteWithDetails[], userId: string): InviteWithDetails[] {
  return invites.filter((i) =>
    i.direction === "team_to_user" ? i.user_id === userId : i.team.leader_id === userId,
  );
}

export function outgoingInvites(invites: InviteWithDetails[], userId: string): InviteWithDetails[] {
  return invites.filter((i) =>
    i.direction === "team_to_user" ? i.team.leader_id === userId : i.user_id === userId,
  );
}

/** Count used by the dashboard nav badge, memoized per request. */
export const countIncomingInvites = cache(async (userId: string): Promise<number> => {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data: led } = await supabase.from("teams").select("id").eq("leader_id", userId);
  const ledIds = (led ?? []).map((t) => t.id);

  const [toMe, toMyTeams] = await Promise.all([
    supabase
      .from("invites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("direction", "team_to_user")
      .eq("status", "pending")
      .gt("expires_at", nowIso),
    ledIds.length
      ? supabase
          .from("invites")
          .select("id", { count: "exact", head: true })
          .in("team_id", ledIds)
          .eq("direction", "user_to_team")
          .eq("status", "pending")
          .gt("expires_at", nowIso)
      : Promise.resolve({ count: 0 }),
  ]);

  return (toMe.count ?? 0) + (toMyTeams.count ?? 0);
});
