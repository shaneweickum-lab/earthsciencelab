"use client";

import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import {
  decide, describe, hashLocal, isEmpty, payload, readLocal, readMeta, writeLocal, writeMeta, type LocalSave,
} from "@/lib/cloudSync";
import { supabase } from "@/lib/supabase";
import { useProgress } from "./progress";

export interface Profile {
  id: string;
  role: "teacher" | "student";
  display_name: string;
}

type SyncStatus = "off" | "syncing" | "saved" | "error";

interface Conflict {
  cloudAt: string;
  here: string;
  cloud: string;
  world: unknown;
  progress: unknown;
}

interface AccountStore {
  session: Session | null;
  profile: Profile | null;
  status: SyncStatus;
  lastSync: number | null;
  /** Set when this device and the cloud both have a different farm: the player picks one. */
  conflict: Conflict | null;
  setSession: (s: Session | null) => Promise<void>;
  sync: () => Promise<void>;
  keep: (which: "here" | "cloud") => Promise<void>;
  signOut: () => Promise<void>;
}

const SAVE_COLUMNS = "world, progress, updated_at";

/** Reload what the site shows from localStorage after a download. */
function reloadLocal() {
  void useProgress.persist.rehydrate();
  window.dispatchEvent(new Event("earthsciencelab:save-replaced"));
}

export const useAccount = create<AccountStore>()((set, get) => {
  let busy = false;

  async function upload(local: LocalSave, userId: string) {
    const db = supabase()!;
    const { data, error } = await db.from("saves")
      .upsert({ user_id: userId, ...payload(local), updated_at: new Date().toISOString() })
      .select("updated_at").single();
    if (error) throw error;
    writeMeta({ userId, hash: hashLocal(local), cloudAt: data.updated_at });
  }

  function download(userId: string, world: unknown, progress: unknown, cloudAt: string) {
    writeLocal(world, progress);
    writeMeta({ userId, hash: hashLocal(readLocal()), cloudAt });
    reloadLocal();
  }

  return {
    session: null,
    profile: null,
    status: "off",
    lastSync: null,
    conflict: null,

    setSession: async (session) => {
      set({ session, profile: session ? get().profile : null, status: session ? get().status : "off" });
      if (!session) return;
      const db = supabase();
      if (!db) return;
      const { data } = await db.from("profiles").select("id, role, display_name").eq("id", session.user.id).maybeSingle();
      set({ profile: (data as Profile | null) ?? null });
      await get().sync();
    },

    sync: async () => {
      const { session, conflict } = get();
      const db = supabase();
      if (!db || !session || conflict || busy) return;
      busy = true;
      const userId = session.user.id;
      try {
        const local = readLocal();
        const meta = readMeta();
        // Cheap check first: nothing changed here since the last sync, and we checked recently.
        const { data: row, error } = await db.from("saves").select("updated_at").eq("user_id", userId).maybeSingle();
        if (error) throw error;
        const action = decide(userId, local, meta, row?.updated_at ?? null);
        if (action !== "none") set({ status: "syncing" });
        if (action === "upload") await upload(local, userId);
        else if (action === "download" || action === "conflict") {
          const { data: full, error: e2 } = await db.from("saves").select(SAVE_COLUMNS).eq("user_id", userId).single();
          if (e2) throw e2;
          if (action === "download") download(userId, full.world, full.progress, full.updated_at);
          else {
            const here = payload(local);
            set({
              conflict: {
                cloudAt: full.updated_at, world: full.world, progress: full.progress,
                here: describe(here.world, here.progress), cloud: describe(full.world, full.progress),
              },
            });
          }
        } else if (!meta && isEmpty(local)) writeMeta(null);
        set({ status: "saved", lastSync: Date.now() });
      } catch {
        set({ status: "error" });
      } finally {
        busy = false;
      }
    },

    keep: async (which) => {
      const { conflict, session } = get();
      if (!conflict || !session) return;
      set({ conflict: null, status: "syncing" });
      try {
        if (which === "cloud") download(session.user.id, conflict.world, conflict.progress, conflict.cloudAt);
        else await upload(readLocal(), session.user.id);
        set({ status: "saved", lastSync: Date.now() });
      } catch {
        set({ status: "error" });
      }
    },

    /**
     * Save to the cloud one last time, then clear this device's copy so the next person who
     * signs in here (a shared classroom computer) starts with their own farm.
     */
    signOut: async () => {
      const db = supabase();
      const { session, conflict } = get();
      if (db && session && !conflict) {
        const local = readLocal();
        if (!isEmpty(local) && hashLocal(local) !== readMeta()?.hash) await upload(local, session.user.id).catch(() => {});
      }
      writeLocal(null, null);
      writeMeta(null);
      reloadLocal();
      await db?.auth.signOut();
      set({ session: null, profile: null, status: "off", conflict: null, lastSync: null });
    },
  };
});
