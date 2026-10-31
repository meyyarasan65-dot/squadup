import "server-only";
import type { z } from "zod";
import { rpcResultSchema, type RpcResult } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";
import type { Json } from "@/types/database";

export type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

/** Parses input with a zod schema into either data or a user-facing error. */
export function validate<S extends z.ZodTypeAny>(
  schema: S,
  input: unknown,
): { ok: true; data: z.infer<S> } | { ok: false; error: string } {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };
  const issue = parsed.error.issues[0];
  return { ok: false, error: issue ? issue.message : "Invalid input" };
}

/** Resolves the caller, or returns null when unauthenticated. */
export async function authed(): Promise<{ supabase: ServerSupabase; userId: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, userId: user.id } : null;
}

export const UNAUTHENTICATED: ActionResult<never> = {
  ok: false,
  error: "Your session has expired. Please sign in again.",
};

/** Normalizes a Postgres RPC response ({ success, error, ... } JSON). */
export function readRpc(data: Json | null, error: { message: string } | null): RpcResult {
  if (error) {
    console.error("[rpc]", error.message);
    return { success: false, error: "The database rejected that request. Please try again." };
  }
  const parsed = rpcResultSchema.safeParse(data);
  return parsed.success ? parsed.data : { success: false, error: "Unexpected server response" };
}
