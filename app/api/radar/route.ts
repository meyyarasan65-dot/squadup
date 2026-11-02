import { NextResponse, type NextRequest } from "next/server";
import { toProfile } from "@/lib/mappers";
import { radarQuerySchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const rawQuery = {
    event_id: searchParams.get("event_id") || undefined,
    missing_role: searchParams.get("missing_role") || undefined,
    radius_minutes: searchParams.get("radius_minutes") || undefined,
  };

  const parseResult = radarQuerySchema.safeParse(rawQuery);
  if (!parseResult.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid radar parameters", details: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  const { event_id, missing_role, radius_minutes } = parseResult.data;
  const supabase = await createClient();

  const radiusMs = radius_minutes * 60 * 1000;
  const cutoffTime = new Date(Date.now() - radiusMs).toISOString();

  // Primary query: Active, looking for team, role matching, recent heartbeat
  let query = supabase
    .from("profiles")
    .select("*")
    .eq("is_looking_for_team", true)
    .gte("updated_at", cutoffTime);

  if (missing_role) {
    query = query.eq("primary_role", missing_role);
  }

  const { data: initialData, error: queryError } = await query
    .order("commit_authenticity_score", { ascending: false, nullsFirst: false })
    .limit(20);

  if (queryError) {
    return NextResponse.json(
      { ok: false, error: "Failed to query radar candidates" },
      { status: 500 },
    );
  }

  let data = initialData;

  // Graceful fallback: If no recent candidates found within the narrow time window,
  // query all available looking-for-team candidates for this role so user never sees empty radar
  if (!data || data.length === 0) {
    let fallbackQuery = supabase
      .from("profiles")
      .select("*")
      .eq("is_looking_for_team", true);

    if (missing_role) {
      fallbackQuery = fallbackQuery.eq("primary_role", missing_role);
    }

    const fallbackRes = await fallbackQuery
      .order("commit_authenticity_score", { ascending: false, nullsFirst: false })
      .limit(15);

    if (!fallbackRes.error && fallbackRes.data) {
      data = fallbackRes.data;
    }
  }

  const registeredUserIds = new Set<string>();
  if (event_id && data && data.length > 0) {
    const userIds = data.map((d) => d.id);
    const { data: regs } = await supabase
      .from("event_registrations")
      .select("user_id")
      .eq("event_id", event_id)
      .in("user_id", userIds);

    if (regs) {
      for (const r of regs) registeredUserIds.add(r.user_id);
    }
  }

  const profiles = (data ?? []).map((row) => ({
    ...toProfile(row),
    isRegisteredForEvent: registeredUserIds.has(row.id),
  }));

  // Sort: Registered first if event_id provided, then highest commit authenticity score
  profiles.sort((a, b) => {
    if (event_id) {
      if (a.isRegisteredForEvent && !b.isRegisteredForEvent) return -1;
      if (!a.isRegisteredForEvent && b.isRegisteredForEvent) return 1;
    }
    return (b.commit_authenticity_score ?? 100) - (a.commit_authenticity_score ?? 100);
  });

  return NextResponse.json({
    ok: true,
    candidates: profiles,
    count: profiles.length,
    missing_role: missing_role ?? null,
  });
}
