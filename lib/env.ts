// Public values must be referenced as literal `process.env.NEXT_PUBLIC_*`
// expressions so Next.js can inline them into the client bundle.

export function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes("your_supabase_url") &&
    !url.includes("placeholder") &&
    url.startsWith("http")
  );
}

function required(name: string, value: string | undefined, fallback = ""): string {
  if (!value || value.includes("your_")) {
    if (fallback) return fallback;
    throw new Error(`Missing environment variable ${name}. See .env.local.example.`);
  }
  return value;
}

export function supabaseUrl(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "https://placeholder-project.supabase.co",
  );
}

export function supabaseAnonKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder",
  );
}

/** Server-only. */
export function supabaseServiceRoleKey(): string {
  return required(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-service-role",
  );
}
