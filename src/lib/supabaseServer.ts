import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

/** Kid-friendly login words: three words and a number, like "otter-maple-river-42". */
const WORDS = [
  "acorn", "apple", "badger", "basil", "beaver", "berry", "birch", "bison", "breeze", "brook", "cactus", "canyon",
  "cedar", "clover", "comet", "coral", "cricket", "daisy", "delta", "dune", "eagle", "ember", "falcon", "fern",
  "finch", "fossil", "frog", "garnet", "geyser", "glacier", "granite", "harbor", "hazel", "heron", "island", "jasper",
  "juniper", "kelp", "lagoon", "lichen", "lotus", "maple", "marble", "meadow", "mesa", "moss", "nectar", "oak",
  "otter", "pebble", "pine", "pollen", "prairie", "quartz", "raven", "reef", "river", "robin", "sage", "salmon",
  "sprout", "tundra", "willow", "wren",
];

export function loginWords(): string {
  const bytes = crypto.getRandomValues(new Uint32Array(4));
  const w = (i: number) => WORDS[bytes[i] % WORDS.length];
  return `${w(0)}-${w(1)}-${w(2)}-${10 + (bytes[3] % 90)}`;
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
