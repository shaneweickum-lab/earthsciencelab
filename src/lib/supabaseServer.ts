import { createClient, type SupabaseClient } from "@supabase/supabase-js";
export { loginWords } from "./accounts";

/** Server-side clients for the student account routes. The service-role key never reaches the browser. */
export function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** A fresh anonymous client, used to sign a student in and hand the session back to the browser. */
export function anonClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Login words are typed by kids: ignore case and extra spaces, and accept spaces for dashes. */
export const normalizeWords = (s: string) => s.trim().toLowerCase().replace(/[\s_]+/g, "-").replace(/-+/g, "-");
export const normalizeCode = (s: string) => s.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
/** Letters, numbers, spaces, apostrophes, and dashes (so names can't act as search wildcards). */
export const normalizeNickname = (s: string) => s.replace(/[^\p{L}\p{N} '-]/gu, "").trim().replace(/\s+/g, " ").slice(0, 24);

export function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

export const NOT_SET_UP = { error: "Cloud accounts aren't set up on this site yet." };
