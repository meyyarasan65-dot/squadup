import { NextResponse, type NextRequest } from "next/server";
import { GITHUB_RESYNC_COOLDOWN_MS } from "@/lib/constants";
import { syncGithubProfile } from "@/lib/github-sync";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import { githubStatsSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Manual GitHub re-sync. Uses the OAuth provider token if the session still
 * carries one (it is dropped on token refresh), otherwise the public API.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIpFromHeaders(request.headers);
  const ipLimit = checkRateLimit(`api:sync:ip:${ip}`, 5, 60_000);
  if (!ipLimit.success) {
    return NextResponse.json(
      { ok: false, error: `Too many requests. Please wait ${ipLimit.retryAfterSec}s.` },
      {
        status: 429,
        headers: {
          "Retry-After": String(ipLimit.retryAfterSec),
          "X-RateLimit-Limit": String(ipLimit.limit),
          "X-RateLimit-Remaining": String(ipLimit.remaining),
        },
      },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const userLimit = checkRateLimit(`api:sync:user:${user.id}`, 5, 60_000);
  if (!userLimit.success) {
    return NextResponse.json(
      { ok: false, error: `Sync rate limit reached. Please wait ${userLimit.retryAfterSec}s.` },
      {
        status: 429,
        headers: {
          "Retry-After": String(userLimit.retryAfterSec),
          "X-RateLimit-Limit": String(userLimit.limit),
          "X-RateLimit-Remaining": String(userLimit.remaining),
        },
      },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("github_username, github_stats")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
  }

  const lastSync = githubStatsSchema.parse(profile.github_stats ?? {}).synced_at;
  if (lastSync) {
    const waitMs = new Date(lastSync).getTime() + GITHUB_RESYNC_COOLDOWN_MS - Date.now();
    if (waitMs > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Synced recently. Try again in ${Math.ceil(waitMs / 60_000)} min.`,
        },
        { status: 429, headers: { "Retry-After": String(Math.ceil(waitMs / 1000)) } },
      );
    }
  }

  // getUser() above has verified the JWT; getSession() only adds the provider token.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const outcome = await syncGithubProfile({
    userId: user.id,
    githubUsername: profile.github_username,
    providerToken: session?.provider_token ?? null,
  });

  if (!outcome.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: outcome.rateLimited
          ? `${outcome.error} Your last synced skills are still shown.`
          : outcome.error,
      },
      { status: outcome.rateLimited ? 429 : 502 },
    );
  }

  return NextResponse.json({ ok: true, stats: outcome.stats });
}
