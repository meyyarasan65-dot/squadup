import { openRoles } from "@/lib/mappers";
import type { MatchResult, Profile, TeamWithMembers } from "@/types";

export interface ConstraintMatchBreakdown {
  role: number;
  stack: number;
  pace: number;
  auth: number;
}

export interface ConstraintMatchResult {
  score: number;
  reasons: string[];
  breakdown: ConstraintMatchBreakdown;
}

/**
 * Calculates Jaccard similarity between candidate's verified tech stack and team's required tech stack.
 * Jaccard = (|A ∩ B| / |A ∪ B|) * 100
 */
export function calculateStackJaccardSimilarity(
  candidateStack: string[],
  teamStack: string[],
): { score: number; overlap: string[] } {
  if (teamStack.length === 0) {
    return { score: 100, overlap: [] };
  }

  const normCandidate = new Set(candidateStack.map((s) => s.toLowerCase().trim()));
  const normTeam = new Set(teamStack.map((s) => s.toLowerCase().trim()));

  const overlap: string[] = [];
  for (const item of normTeam) {
    if (normCandidate.has(item)) {
      overlap.push(item);
    }
  }

  const allUnique = new Set([...normCandidate, ...normTeam]);
  if (allUnique.size === 0) {
    return { score: 100, overlap: [] };
  }

  const score = Math.round((overlap.length / allUnique.size) * 100);
  return { score, overlap };
}

/**
 * Constraint Satisfaction Scoring Engine:
 * FinalScore = (0.35 * S_role) + (0.30 * S_stack) + (0.15 * S_pace) + (0.20 * S_auth)
 *
 * S_role: 100 if candidate fulfills an unsatisfied target role, 0 if saturated.
 * S_stack: Jaccard similarity between candidate's verified tech stack + verified skills and team's required stack.
 * S_pace: 100 if candidate.hacker_pace === team.hacker_pace, else 40.
 * S_auth: Candidate's commit_authenticity_score.
 */
export function calculateConstraintMatchScore(
  candidate: Profile,
  team: TeamWithMembers,
): ConstraintMatchResult {
  const reasons: string[] = [];

  // 1. Role satisfaction (Weight: 0.35)
  const vacantRoles = openRoles(team);
  const isNeededRole = vacantRoles.includes(candidate.primary_role);
  const sRole = isNeededRole ? 100 : 0;
  if (isNeededRole) {
    reasons.push(`Satisfies vacant ${candidate.primary_role.toUpperCase()} role`);
  }

  // 2. Stack similarity (Weight: 0.30)
  // Combine verified frameworks and verified languages from candidate
  const candidateKnownStack = [
    ...(candidate.verified_tech_stack?.map((f) => f.name) ?? []),
    ...Object.keys(candidate.verified_skills ?? {}),
    ...(candidate.raw_dependencies ?? []),
  ];
  const { score: sStack, overlap } = calculateStackJaccardSimilarity(
    candidateKnownStack,
    team.tech_stack,
  );
  if (overlap.length > 0) {
    reasons.push(`Verified overlap in ${overlap.slice(0, 3).join(", ")}`);
  } else if (team.tech_stack.length === 0) {
    reasons.push("Flexible technology requirements");
  }

  // 3. Pace alignment (Weight: 0.15)
  const paceMatches = candidate.hacker_pace === team.hacker_pace;
  const sPace = paceMatches ? 100 : 40;
  if (paceMatches) {
    const paceLabel = candidate.hacker_pace === "all_nighter" ? "All-Nighter Sprint" : "Structured Day";
    reasons.push(`Synchronized ${paceLabel} velocity`);
  }

  // 4. Authenticity score (Weight: 0.20)
  const sAuth = Math.min(100, Math.max(0, candidate.commit_authenticity_score ?? 100));
  if (sAuth >= 85) {
    reasons.push(`${sAuth.toFixed(0)}% GitHub commit authenticity`);
  }

  // Final weighted sum
  const finalScore = Math.round(
    0.35 * sRole +
    0.30 * sStack +
    0.15 * sPace +
    0.20 * sAuth,
  );

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    reasons,
    breakdown: {
      role: sRole,
      stack: sStack,
      pace: sPace,
      auth: sAuth,
    },
  };
}

/**
 * Compatibility adapter for match results to satisfy MatchResult interface
 */
export function constraintScoreToMatchResult(
  result: ConstraintMatchResult,
): MatchResult {
  return {
    score: result.score,
    reasons: result.reasons,
    breakdown: {
      role: Math.round(result.breakdown.role),
      stack: Math.round(result.breakdown.stack),
      pace: Math.round(result.breakdown.pace),
      auth: Math.round(result.breakdown.auth),
    },
  };
}
