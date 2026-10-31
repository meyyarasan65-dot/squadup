import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/** Daily Vercel Cron webhook (see vercel.json): marks lapsed pending invites expired. */
export async function GET(request: NextRequest) {
  const ip = getClientIpFromHeaders(request.headers);
  const rateLimit = checkRateLimit(`cron:expire:${ip}`, 10, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSec) } },
    );
  }

  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await createAdminClient().rpc("expire_stale_invites");
  if (error) {
    console.error("[cron/expire-invites]", error.message);
    return NextResponse.json({ ok: false, error: "Failed to expire invites" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, expired: data ?? 0 });
}
