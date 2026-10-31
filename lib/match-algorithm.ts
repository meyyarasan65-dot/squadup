import { ROLE_LABELS, SKILL_THRESHOLD_PERCENT } from "@/lib/constants";
import { isTeamOpen, openRoles } from "@/lib/mappers";
import type { MatchResult, Profile, Role, TeamWithMembers } from "@/types";

/**
 * MatchScore = 0.45·RoleMatch + 0.35·LanguageOverlap + 0.20·EventRegistered
 * Each component is in [0, 1]; the score is reported on a 0–100 scale.
 */
export const MATCH_WEIGHTS = { role: 0.45, language: 0.35, event: 0.2 } as const;

/** Language share at which we call out a "High <lang> Overlap". */
const HIGH_OVERLAP_PERCENT = 25;

/** A team rarely needs every listed language covered by one person. */
const LANGUAGES_FOR_FULL_OVERLAP = 3;

/** Partial credit when a candidate's role can reasonably fill another slot. */
const ADJACENT_ROLES: Partial<Record<Role, Partial<Record<Role, number>>>> = {
  fullstack: { frontend: 0.6, backend: 0.6 },
  frontend: { fullstack: 0.5, ui_ux: 0.3 },
  backend: { fullstack: 0.5, devops: 0.3 },
  ui_ux: { frontend: 0.3 },
  devops: { backend: 0.3 },
};

function roleComponent(role: Role, wanted: Role[]): { value: number; reason: string | null } {
  if (wanted.includes(role)) return { value: 1, reason: "Exact Role Match" };

  let best: { value: number; slot: Role } | null = null;
  for (const slot of wanted) {
    const credit = ADJACENT_ROLES[role]?.[slot] ?? 0;
    if (credit > (best?.value ?? 0)) best = { value: credit, slot };
  }
  if (best) return { value: best.value, reason: `Can cover ${ROLE_LABELS[best.slot]}` };
  return { value: 0, reason: null };
}

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

function languageComponent(
  skills: Profile["verified_skills"],
  desired: string[],
): { value: number; reasons: string[] } {
  if (desired.length === 0) return { value: 0, reasons: [] };

  const lowerSkills = new Map(Object.entries(skills).map(([k, v]) => [k.toLowerCase(), { k, v }]));
  const matched = desired
    .map((lang) => lowerSkills.get(lang.toLowerCase()))
    .filter((s): s is { k: string; v: number } => !!s && s.v >= SKILL_THRESHOLD_PERCENT)
    .sort((a, b) => b.v - a.v);

  const value = Math.min(1, matched.length / Math.min(desired.length, LANGUAGES_FOR_FULL_OVERLAP));
  const reasons = matched
    .slice(0, 2)
    .map((s) => (s.v >= HIGH_OVERLAP_PERCENT ? `High ${s.k} Overlap` : `Writes ${s.k}`));
  return { value, reasons };
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
      breakdown: { role: 0, language: 0, event: 0 },
    };
  }

  const wanted = openRoles(team);
  const role = roleComponent(candidate.primary_role, wanted);
  const language = languageComponent(
    candidate.verified_skills,
    desiredLanguages(team, candidate.id),
  );
  const event = options.isRegisteredForEvent ? 1 : 0;

  const raw =
    MATCH_WEIGHTS.role * role.value +
    MATCH_WEIGHTS.language * language.value +
    MATCH_WEIGHTS.event * event;

  const reasons = [
    ...(role.reason ? [role.reason] : []),
    ...language.reasons,
    ...(event ? ["Registered for event"] : []),
  ];

  return {
    score: Math.round(raw * 100),
    reasons,
    breakdown: {
      role: Math.round(MATCH_WEIGHTS.role * role.value * 100),
      language: Math.round(MATCH_WEIGHTS.language * language.value * 100),
      event: Math.round(MATCH_WEIGHTS.event * event * 100),
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
