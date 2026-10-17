/**
 * Cloud saves: keeps this browser's farm and progress (localStorage) in step with the signed-in
 * person's row in Supabase. Both games save to the same localStorage keys, so syncing those keys
 * covers the web game and the Godot game alike.
 */

export const WORLD_KEY = "earthsciencelab-world";
export const PROGRESS_KEY = "earthsciencelab-progress";
/** What this device last synced: whose save, what it looked like, and the cloud copy's time. */
export const META_KEY = "earthsciencelab-cloud";

export interface SyncMeta {
  userId: string;
  hash: string;
  cloudAt: string;
}

export interface LocalSave {
  world: string | null;
  progress: string | null;
}

export type SyncAction = "none" | "upload" | "download" | "conflict";

/** FNV-1a, enough to notice that a save changed. */
export function hashText(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16) + ":" + s.length;
}

export const hashLocal = (l: LocalSave) => hashText(`${l.world ?? ""}\n${l.progress ?? ""}`);
export const isEmpty = (l: LocalSave) => !l.world && !l.progress;

/**
 * What to do, given this device's save, what it last synced, and the cloud copy's time (null when
 * there's no cloud save yet). Changes on only one side flow to the other; changes on both sides
 * (or a first sync with a different farm already here) ask the player which to keep.
 */
export function decide(userId: string, local: LocalSave, meta: SyncMeta | null, cloudAt: string | null): SyncAction {
  if (!cloudAt) return isEmpty(local) ? "none" : "upload";
  if (!meta || meta.userId !== userId) return isEmpty(local) ? "download" : "conflict";
  const localChanged = hashLocal(local) !== meta.hash;
  const cloudChanged = cloudAt !== meta.cloudAt;
  if (localChanged && cloudChanged) return "conflict";
  if (localChanged) return "upload";
  if (cloudChanged) return "download";
  return "none";
}

/** Numbers a teacher sees in the class list, read from the save. */
export function summarize(world: unknown, progress: unknown) {
  const w = (world ?? {}) as { minute?: number; coins?: number; harvests?: number; journal?: unknown[] };
  const p = ((progress as { state?: { xp?: number } } | null)?.state ?? {}) as { xp?: number };
  return {
    farm_day: typeof w.minute === "number" ? Math.floor(w.minute / 1440) + 1 : null,
    coins: typeof w.coins === "number" ? Math.round(w.coins) : null,
    harvests: typeof w.harvests === "number" ? w.harvests : null,
    journal_pages: Array.isArray(w.journal) ? w.journal.length : null,
    xp: typeof p.xp === "number" ? p.xp : null,
  };
}

const parse = (s: string | null) => {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

export function readLocal(): LocalSave {
  try {
    return { world: localStorage.getItem(WORLD_KEY), progress: localStorage.getItem(PROGRESS_KEY) };
  } catch {
    return { world: null, progress: null };
  }
}

export function writeLocal(world: unknown, progress: unknown) {
  try {
    if (world) localStorage.setItem(WORLD_KEY, JSON.stringify(world));
    else localStorage.removeItem(WORLD_KEY);
    if (progress) localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    else localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // Storage blocked: nothing to do.
  }
}

export function readMeta(): SyncMeta | null {
  return parse(safeGet(META_KEY));
}

export function writeMeta(meta: SyncMeta | null) {
  try {
    if (meta) localStorage.setItem(META_KEY, JSON.stringify(meta));
    else localStorage.removeItem(META_KEY);
  } catch {
    // Storage blocked.
  }
}

function safeGet(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** The save as it goes to the cloud. */
export function payload(local: LocalSave) {
  const world = parse(local.world);
  const progress = parse(local.progress);
  return { world, progress, ...summarize(world, progress) };
}

/** A short description of a farm, for the "which one do you want to keep?" question. */
export function describe(world: unknown, progress: unknown): string {
  const s = summarize(world, progress);
  if (s.farm_day === null) return s.xp ? `${s.xp} XP, no farm yet` : "Nothing saved yet";
  return `Day ${s.farm_day} · ${s.coins ?? 0} coins · ${s.journal_pages ?? 0} journal pages${s.xp ? ` · ${s.xp} XP` : ""}`;
}
