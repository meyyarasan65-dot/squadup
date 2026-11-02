import { SKILL_THRESHOLD_PERCENT } from "@/lib/constants";
import { isTeamOpen } from "@/lib/mappers";
import { calculateConstraintMatchScore } from "@/lib/match-engine";
import type { MatchResult, Profile, TeamWithMembers } from "@/types";

/**
 * Constraint Satisfaction Scoring Formula:
 * FinalScore = (0.35 * S_role) + (0.30 * S_stack) + (0.15 * S_pace) + (0.20 * S_auth)
 */
export const MATCH_WEIGHTS = { role: 0.35, stack: 0.30, pace: 0.15, auth: 0.20 } as const;

/** The team's desired languages, or what its members already write if none were listed. */
export function desiredLanguages(team: TeamWithMembers, excludeUserId?: string): string[] {
  if (team.tech_stack.length > 0) return team.tech_stack;
  const fromMembers = new Set<string>();
  for (const m of team.members) {
    if (m.user_id === excludeUserId) continue;
    for (const [lang, pct] of Object.entries(m.profile.verified_skills)) {
      if (pct >= SKILL_THRESHOLD_PERCENT) fromMembers.add(lang);
    }
  }
  return [...fromMembers];
}

export interface MatchOptions {
  /** Whether the candidate has registered for the team's event. */
  isRegisteredForEvent?: boolean;
}

export function calculateMatchScore(
  candidate: Profile,
  team: TeamWithMembers,
  options: MatchOptions = {},
): MatchResult {
  if (!isTeamOpen(team)) {
    return {
      score: 0,
      reasons: [team.is_locked ? "Team is locked" : "Team is full"],
      breakdown: { role: 0, stack: 0, pace: 0, auth: 0, event: 0 },
    };
  }

  const constraintResult = calculateConstraintMatchScore(candidate, team);

  const reasons = [...constraintResult.reasons];
  if (options.isRegisteredForEvent) {
    reasons.push("Registered for event");
  }

  return {
    score: constraintResult.score,
    reasons,
    breakdown: {
      role: Math.round(constraintResult.breakdown.role * MATCH_WEIGHTS.role),
      stack: Math.round(constraintResult.breakdown.stack * MATCH_WEIGHTS.stack),
      pace: Math.round(constraintResult.breakdown.pace * MATCH_WEIGHTS.pace),
      auth: Math.round(constraintResult.breakdown.auth * MATCH_WEIGHTS.auth),
      event: options.isRegisteredForEvent ? 10 : 0,
    },
  };
}

/** Key for registration lookups: `${eventId}:${userId}`. */
export function registrationKey(eventId: string, userId: string): string {
  return `${eventId}:${userId}`;
}

export interface RankedCandidate {
  candidate: Profile;
  match: MatchResult;
}

/** Candidates for a team's open slots, best first. Zero-score candidates are dropped. */
export function rankCandidatesForTeam(
  candidates: Profile[],
  team: TeamWithMembers,
  registrations: ReadonlySet<string>,
): RankedCandidate[] {
  const memberIds = new Set(team.members.map((m) => m.user_id));
  return candidates
    .filter((c) => !memberIds.has(c.id))
    .map((candidate) => ({
      candidate,
      match: calculateMatchScore(candidate, team, {
        isRegisteredForEvent: registrations.has(registrationKey(team.event_id, candidate.id)),
      }),
    }))
    .filter((r) => r.match.score > 0)
    .sort((a, b) => b.match.score - a.match.score || a.candidate.full_name.localeCompare(b.candidate.full_name));
}

export interface RankedTeam {
  team: TeamWithMembers;
  match: MatchResult;
}

/** Open teams for a solo candidate, best first. */
export function rankTeamsForCandidate(
  candidate: Profile,
  teams: TeamWithMembers[],
  registrations: ReadonlySet<string>,
): RankedTeam[] {
  return teams
    .filter((t) => isTeamOpen(t) && !t.members.some((m) => m.user_id === candidate.id))
    .map((team) => ({
      team,
      match: calculateMatchScore(candidate, team, {
        isRegisteredForEvent: registrations.has(registrationKey(team.event_id, candidate.id)),
      }),
    }))
    .sort((a, b) => b.match.score - a.match.score || a.team.team_name.localeCompare(b.team.team_name));
}
