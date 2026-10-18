import { supabase } from "@/lib/supabase";
import { SupabaseTransport } from "./supabaseTransport";
import { LocalTransport, type Transport } from "./transport";

/** A multiplayer world, as the lobby lists it. */
export interface WorldInfo {
  id: string;
  code: string;
  name: string;
  hostId: string;
  hostName: string;
  updatedAt: string;
}

export interface Me {
  pid: string;
  name: string;
}

/** Where worlds are listed, created, and joined, and how their farmers connect. */
export interface Lobby {
  kind: "cloud" | "local";
  me(): Promise<Me | null>;
  list(): Promise<WorldInfo[]>;
  create(name: string): Promise<WorldInfo>;
  join(code: string): Promise<WorldInfo>;
  transport(world: WorldInfo, me: Me): Transport;
}

const normalizeCode = (code: string) => {
  const c = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `FARM-${c.startsWith("FARM") ? c.slice(4) : c}`;
};

// ───────────────────────── Supabase ─────────────────────────

function cloudLobby(): Lobby {
  const db = supabase()!;
  const toInfo = (r: Record<string, string>): WorldInfo => ({ id: r.id, code: r.code, name: r.name, hostId: r.host_id, hostName: r.host_name, updatedAt: r.updated_at });
  return {
    kind: "cloud",
    async me() {
      const { data } = await db.auth.getSession();
      const user = data.session?.user;
      if (!user) return null;
      const { data: profile } = await db.from("profiles").select("display_name").eq("id", user.id).single();
      return { pid: user.id, name: profile?.display_name || "Farmer" };
    },
    async list() {
      const { data, error } = await db.from("worlds").select("id, code, name, host_id, host_name, updated_at").order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(toInfo);
    },
    async create(name) {
      const { data, error } = await db.rpc("create_world", { p_name: name.slice(0, 40) || "Our farm town" });
      if (error) throw error;
      return toInfo(data as Record<string, string>);
    },
    async join(code) {
      const { data, error } = await db.rpc("join_world", { p_code: normalizeCode(code) });
      if (error) throw new Error(error.message.includes("full") ? "That world already has 8 farmers." : "No world has that code. Check it and try again.");
      return toInfo(data as Record<string, string>);
    },
    transport: (world, me) => new SupabaseTransport(db, world.id, me.pid),
  };
}

// ───────────────────────── this computer (development and tests) ─────────────────────────

const LOCAL_KEY = "soil-mp-worlds";

function localLobby(): Lobby {
  const read = (): WorldInfo[] => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
    } catch {
      return [];
    }
  };
  // Each tab is its own farmer, so two tabs can play together.
  const me = (): Me => {
    let pid = sessionStorage.getItem("soil-mp-me");
    if (!pid) {
      pid = `local-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem("soil-mp-me", pid);
    }
    const name = new URLSearchParams(location.search).get("name") ?? sessionStorage.getItem("soil-mp-name") ?? `Farmer ${pid.slice(-3).toUpperCase()}`;
    sessionStorage.setItem("soil-mp-name", name);
    return { pid, name };
  };
  return {
    kind: "local",
    me: async () => me(),
    list: async () => read(),
    async create(name) {
      const m = me();
      const code = `FARM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const info: WorldInfo = { id: `local-${Date.now().toString(36)}`, code, name: name || "Our farm town", hostId: m.pid, hostName: m.name, updatedAt: new Date().toISOString() };
      localStorage.setItem(LOCAL_KEY, JSON.stringify([info, ...read()]));
      return info;
    },
    async join(code) {
      const w = read().find((x) => x.code === normalizeCode(code));
      if (!w) throw new Error("No world has that code. Check it and try again.");
      return w;
    },
    transport: (world) => new LocalTransport(world.id),
  };
}

/** The cloud lobby when the site has Supabase, or this computer's (also forced with ?net=local). */
export function lobby(): Lobby | null {
  if (typeof window === "undefined") return null;
  if (new URLSearchParams(location.search).get("net") === "local") return localLobby();
  return supabase() ? cloudLobby() : null;
}
