import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseConfig, supabaseAnonKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/types/database";

const PROTECTED_PREFIXES = ["/events", "/matchmaker", "/teams", "/profile", "/invites"];

/** Refreshes the auth session cookie and gates dashboard routes. */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let res = NextResponse.next({ request });

  if (!hasSupabaseConfig()) {
    return res;
  }

  const supabase = createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        res = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          res.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers ?? {})) {
          res.headers.set(key, value);
        }
      },
    },
  });

  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // Fast path: If the request has no Supabase auth token cookies, avoid remote API round trips
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

  if (!hasAuthCookie) {
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
    return res;
  }

  // Must run before anything else touches the response: validates the JWT and
  // refreshes it if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/matchmaker";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return res;
}
