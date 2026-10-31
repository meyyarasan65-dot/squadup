import { githubStatsSchema, roleSchema, verifiedSkillsSchema } from "@/lib/schemas";
import type { Tables } from "@/types/database";
import type {
  HackathonEvent,
  Invite,
  Profile,
  Role,
  Team,
  TeamMemberWithProfile,
  TeamWithMembers,
} from "@/types";

export function toProfile(row: Tables<"profiles">): Profile {
  const role = roleSchema.safeParse(row.primary_role);
  return {
    ...row,
    primary_role: role.success ? role.data : "fullstack",
    verified_skills: verifiedSkillsSchema.parse(row.verified_skills ?? {}),
    github_stats: githubStatsSchema.parse(row.github_stats ?? {}),
    is_looking_for_team: row.is_looking_for_team ?? true,
  };
}

export function toEvent(row: Tables<"events">): HackathonEvent {
  return {
    ...row,
    team_min_size: row.team_min_size ?? 2,
    team_max_size: row.team_max_size ?? 4,
  };
}

export function toRoles(values: string[]): Role[] {
  return values.flatMap((v) => {
    const r = roleSchema.safeParse(v);
    return r.success ? [r.data] : [];
  });
}

export function toTeam(row: Tables<"teams">): Team {
  return {
    ...row,
    target_roles: toRoles(row.target_roles),
    is_locked: row.is_locked ?? false,
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
