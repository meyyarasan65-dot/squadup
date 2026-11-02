import {
  githubStatsSchema,
  hackerPaceSchema,
  leetCodeStatsSchema,
  roleSchema,
  sponsorTrackSchema,
  verifiedFrameworkSchema,
  verifiedSkillsSchema,
} from "@/lib/schemas";
import { z } from "zod";
import type { Tables } from "@/types/database";
import type {
  HackathonEvent,
  HackerPace,
  Invite,
  Profile,
  Role,
  Team,
  TeamMemberWithProfile,
  TeamWithMembers,
} from "@/types";

export function toProfile(row: Tables<"profiles">): Profile {
  const role = roleSchema.safeParse(row.primary_role);
  const rawPace = hackerPaceSchema.safeParse(row.hacker_pace);
  const verifiedTechStackParsed = z
    .array(verifiedFrameworkSchema)
    .catch([])
    .parse(row.verified_tech_stack ?? []);
  const rawDepsParsed = z.array(z.string()).catch([]).parse(row.raw_dependencies ?? []);
  const leetcodeParsed = leetCodeStatsSchema.parse(row.leetcode_stats ?? {});

  return {
    ...row,
    primary_role: role.success ? role.data : "fullstack",
    verified_skills: verifiedSkillsSchema.parse(row.verified_skills ?? {}),
    github_stats: githubStatsSchema.parse(row.github_stats ?? {}),
    is_looking_for_team: row.is_looking_for_team ?? true,
    raw_dependencies: rawDepsParsed,
    verified_tech_stack: verifiedTechStackParsed,
    commit_authenticity_score:
      typeof row.commit_authenticity_score === "number"
        ? row.commit_authenticity_score
        : Number(row.commit_authenticity_score ?? 100),
    leetcode_stats: leetcodeParsed,
    hacker_pace: (rawPace.success ? rawPace.data : "all_nighter") as HackerPace,
  };
}

export function toEvent(row: Tables<"events">): HackathonEvent {
  const tracks = z.array(sponsorTrackSchema).catch([]).parse(row.sponsor_tracks ?? []);
  return {
    ...row,
    team_min_size: row.team_min_size ?? 2,
    team_max_size: row.team_max_size ?? 4,
    sponsor_tracks: tracks,
  };
}

export function toRoles(values: string[]): Role[] {
  return values.flatMap((v) => {
    const r = roleSchema.safeParse(v);
    return r.success ? [r.data] : [];
  });
}

export function toTeam(row: Tables<"teams">): Team {
  const rawPace = hackerPaceSchema.safeParse(row.hacker_pace);
  const tracks = z.array(z.string()).catch([]).parse(row.selected_tracks ?? []);
  return {
    ...row,
    target_roles: toRoles(row.target_roles),
    is_locked: row.is_locked ?? false,
    hacker_pace: (rawPace.success ? rawPace.data : "all_nighter") as HackerPace,
    selected_tracks: tracks,
  };
}

export function toInvite(row: Tables<"invites">): Invite {
  return { ...row, status: row.status ?? "pending" };
}

/** Row shape produced by TEAM_WITH_MEMBERS_SELECT. */
export type TeamWithMembersRow = Tables<"teams"> & {
  event: Tables<"events"> | null;
  members: (Tables<"team_members"> & { profile: Tables<"profiles"> | null })[];
};

export const TEAM_WITH_MEMBERS_SELECT =
  "*, event:events(*), members:team_members(*, profile:profiles(*))" as const;

/** Returns null when a joined row is missing (e.g. deleted mid-request). */
export function toTeamWithMembers(row: TeamWithMembersRow): TeamWithMembers | null {
  if (!row.event) return null;
  const members: TeamMemberWithProfile[] = row.members.flatMap((m) =>
    m.profile ? [{ ...m, profile: toProfile(m.profile) }] : [],
  );
  members.sort((a, b) => (a.joined_at ?? "").localeCompare(b.joined_at ?? ""));
  return { ...toTeam(row), event: toEvent(row.event), members };
}

/** Vacancies still open: target roles not yet covered by a member's role. */
export function openRoles(team: TeamWithMembers): Role[] {
  const filled = new Set(team.members.map((m) => m.role_assigned));
  return team.target_roles.filter((r) => !filled.has(r));
}

export function openSlots(team: TeamWithMembers): number {
  return Math.max(0, team.event.team_max_size - team.members.length);
}

export function isTeamOpen(team: TeamWithMembers): boolean {
  return !team.is_locked && openSlots(team) > 0;
}
