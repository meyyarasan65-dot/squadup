import type { ROLES } from "@/lib/constants";
import type { Enums, Tables } from "@/types/database";

export type Role = (typeof ROLES)[number];

/** Language name → share of the user's code in percent (0–100), top 5. */
export type VerifiedSkills = Record<string, number>;

export type TopRepo = {
  name: string;
  url: string;
  stars: number;
  language: string | null;
};

export type GithubSyncSource = "oauth" | "public" | "seed";

export type GithubStats = {
  public_repos: number;
  followers: number;
  total_stars: number;
  /** Lifetime commits authored, from GitHub commit search; null if unavailable. */
  total_commits: number | null;
  repos_analyzed: number;
  top_repos: TopRepo[];
  synced_at: string | null;
  source: GithubSyncSource | null;
  /** True when GitHub rate-limited part of the last sync and some data is approximate. */
  partial: boolean;
};

export interface Profile
  extends Omit<
    Tables<"profiles">,
    "primary_role" | "verified_skills" | "github_stats" | "is_looking_for_team"
  > {
  primary_role: Role;
  verified_skills: VerifiedSkills;
  github_stats: GithubStats;
  is_looking_for_team: boolean;
}

export interface HackathonEvent
  extends Omit<Tables<"events">, "team_min_size" | "team_max_size"> {
  team_min_size: number;
  team_max_size: number;
}

export interface Team extends Omit<Tables<"teams">, "target_roles" | "is_locked"> {
  target_roles: Role[];
  is_locked: boolean;
}

export type TeamMember = Tables<"team_members">;

export interface TeamMemberWithProfile extends TeamMember {
  profile: Profile;
}

export interface TeamWithMembers extends Team {
  event: HackathonEvent;
  members: TeamMemberWithProfile[];
}

export type InviteStatus = Enums<"invite_status">;
export type InviteDirection = Enums<"invite_direction">;

export interface Invite extends Omit<Tables<"invites">, "status"> {
  status: InviteStatus;
}

export interface InviteWithDetails extends Invite {
  team: Team & { event: HackathonEvent };
  profile: Profile;
}

export interface MatchResult {
  /** 0–100 */
  score: number;
  reasons: string[];
  breakdown: {
    role: number;
    language: number;
    event: number;
  };
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };
