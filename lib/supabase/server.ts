import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import { hasSupabaseConfig, supabaseAnonKey, supabaseServiceRoleKey, supabaseUrl } from "@/lib/env";
import { toProfile } from "@/lib/mappers";
import type { Database } from "@/types/database";
import type { Profile } from "@/types";

/** Per-request client acting as the signed-in user (RLS applies). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The middleware refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

/** Service-role client. Bypasses RLS — only for trusted server code paths. */
export function createAdminClient() {
  return createSupabaseClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * The signed-in user and their profile, memoized per request so layouts and
 * pages can both call it without duplicate round-trips.
 */
export const getSessionProfile = cache(
  async (): Promise<{ userId: string; profile: Profile | null } | null> => {
    if (!hasSupabaseConfig()) return null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return { userId: user.id, profile: data ? toProfile(data) : null };
    } catch {
      return null;
    }
  },
);
