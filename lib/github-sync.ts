import "server-only";
import { fetchAndAggregateGithubSkills, GithubRateLimitError } from "@/lib/github";
import { createAdminClient } from "@/lib/supabase/server";
import { errorMessage } from "@/lib/utils";
import type { GithubStats, GithubSyncSource } from "@/types";

export type SyncOutcome =
  | { ok: true; stats: GithubStats }
  | { ok: false; error: string; rateLimited: boolean };

/**
 * Runs the GitHub ingestion pipeline for a user and persists the result with
 * the service role (profiles.verified_skills is not user-writable).
 *
 * On rate limiting, the previously stored skills are left untouched, so the
 * profile keeps its last good data as the fallback.
 */
export async function syncGithubProfile(params: {
  userId: string;
  githubUsername: string;
  providerToken: string | null;
}): Promise<SyncOutcome> {
  const source: GithubSyncSource = params.providerToken ? "oauth" : "public";

  try {
    const result = await fetchAndAggregateGithubSkills(params.providerToken, params.githubUsername);
    const stats: GithubStats = {
      ...result.stats,
      synced_at: new Date().toISOString(),
      source,
    };

    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({
        verified_skills: result.verifiedSkills,
        ...(result.avatarUrl ? { avatar_url: result.avatarUrl } : {}),
        github_stats: stats,
      })
      .eq("id", params.userId);

    if (error) return { ok: false, error: error.message, rateLimited: false };
    return { ok: true, stats };
  } catch (err) {
    const rateLimited = err instanceof GithubRateLimitError;
    console.error("[github-sync]", params.githubUsername, errorMessage(err));
    return { ok: false, error: errorMessage(err, "GitHub sync failed"), rateLimited };
  }
}
