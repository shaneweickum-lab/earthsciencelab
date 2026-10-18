import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The browser's Supabase client, or null when the site isn't connected to a Supabase project
 * (no NEXT_PUBLIC_SUPABASE_URL and anon key). Everything works without it: saves just stay in
 * this browser. Newer Supabase projects call the anon key the "publishable" key, so either name works.
 * These are read when the site is built, so after adding them on Vercel, redeploy.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (!url || !anonKey || typeof window === "undefined") return null;
  client ??= createClient(url, anonKey, { auth: { persistSession: true, storageKey: "earthsciencelab-auth" } });
  return client;
}

export const cloudEnabled = !!(url && anonKey);

/** Which settings the site still needs for its cloud connection (names as they go on Vercel). */
export function missingSettings(u: string | undefined = url, key: string | undefined = anonKey): string[] {
  return [...(u ? [] : ["NEXT_PUBLIC_SUPABASE_URL"]), ...(key ? [] : ["NEXT_PUBLIC_SUPABASE_ANON_KEY"])];
}

/** Tells whoever runs the site what to add, for pages that need the cloud. */
export function CloudSetupNote({ what }: { what: string }) {
  const missing = missingSettings();
  return (
    <div className="rounded-xl bg-paper p-3 text-left text-sm">
      <p className="font-bold">{what} needs the site&apos;s cloud connection, which isn&apos;t set up yet.</p>
      <p className="mt-1 text-xs text-muted">
        For whoever runs the site: add {missing.map((m, i) => <span key={m}>{i ? " and " : ""}<code className="font-bold">{m}</code></span>)} in the
        Vercel project&apos;s Environment Variables (from Supabase&apos;s Project Settings → API), then redeploy. Settings are read when the site is built.
      </p>
    </div>
  );
}
