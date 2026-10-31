import { after, NextResponse, type NextRequest } from "next/server";
import { syncGithubProfile } from "@/lib/github-sync";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const ip = getClientIpFromHeaders(request.headers);
  const rateLimit = checkRateLimit(`oauth:callback:${ip}`, 15, 60_000);
  if (!rateLimit.success) {
    return NextResponse.redirect(`${origin}/login?error=rate_limited`);
  }

  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login?error=oauth_exchange`);
  }

  const { user, provider_token: providerToken } = data.session;

  // The handle_new_user() trigger has already created the profile row.
  const { data: profile } = await supabase
    .from("profiles")
    .select("github_username, onboarded")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    // provider_token is only available right now, at code exchange; ingest the
    // user's repos in the background without delaying the redirect.
    after(() =>
      syncGithubProfile({
        userId: user.id,
        githubUsername: profile.github_username,
        providerToken: providerToken ?? null,
      }),
    );
  }

  const destination = profile?.onboarded ? next : "/profile?welcome=1";
  return NextResponse.redirect(`${origin}${destination}`);
}
