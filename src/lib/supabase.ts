import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The browser's Supabase client, or null when the site isn't connected to a Supabase project
 * (no NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY). Everything works without it:
 * saves just stay in this browser.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (!url || !anonKey || typeof window === "undefined") return null;
  client ??= createClient(url, anonKey, { auth: { persistSession: true, storageKey: "earthsciencelab-auth" } });
  return client;
}

export const cloudEnabled = !!(url && anonKey);
