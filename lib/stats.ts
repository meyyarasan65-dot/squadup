import { unstable_cache } from "next/cache";
import { hasSupabaseConfig } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/server";

const FALLBACK = { builders: 6, teams: 4, events: 3 };

/** Public headline numbers for the landing and login pages (cached for a minute). */
export const getStats = unstable_cache(
  async () => {
    if (!hasSupabaseConfig()) return FALLBACK;

    try {
      const supabase = createAdminClient();
      const nowIso = new Date().toISOString();
      const [builders, teams, events] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("teams").select("id", { count: "exact", head: true }),
        supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .gt("registration_deadline", nowIso),
      ]);
      return {
        builders: builders.count ?? 0,
        teams: teams.count ?? 0,
        events: events.count ?? 0,
      };
    } catch {
      return FALLBACK;
    }
  },
  ["landing-login-stats"],
  { revalidate: 60, tags: ["stats"] },
);
