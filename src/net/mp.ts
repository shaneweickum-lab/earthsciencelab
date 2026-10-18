"use client";

import { create } from "zustand";
import { dayOf, msPerGameMinute } from "@/world/clock";
import { newMultiWorld, viewFor, type Area, type MultiWorld } from "@/world/multi";
import { DEFAULT_SETTINGS } from "@/world/settings";
import { runtime, useWorld } from "@/components/world/useWorld";
import { lobby, type Lobby, type Me, type WorldInfo } from "./lobby";
import { ClientSession, HostSession } from "./session";

export const areaKey = (a: Area) => (a.kind === "garden" ? `g${a.garden}` : a.kind === "mine" ? `m${a.floor}` : "town");

type Status = "off" | "connecting" | "playing" | "stopped";

interface MultiStore {
  lobby: Lobby | null;
  me: Me | null;
  info: WorldInfo | null;
  role: "host" | "client" | null;
  session: HostSession | ClientSession | null;
  status: Status;
  /** Why play stopped: the world is full, the host left, or an error. */
  stopReason: string;
  /** The shared world, as this farmer's copy has it. */
  world: MultiWorld | null;
  /** Bumped when others move, so their figures redraw. */
  version: number;
  /** Farmers whose chat you've muted (just for you, in this world). */
  muted: string[];
  toggleMute: (pid: string) => void;
  /** When each chat message arrived here (ms), for fading the feed and speech bubbles. */
  chatSeen: Record<number, number>;
  init: () => Promise<void>;
  open: (info: WorldInfo) => Promise<void>;
  leave: () => Promise<void>;
}

/** What this farmer's game shows: the view of the shared world from where they stand. */
let lastPlace = "";
function show(m: MultiWorld, me: string) {
  const p = m.players[me];
  if (!p) return;
  const view = viewFor(m, me);
  const st = useWorld.getState();
  // Your own walking stays local; take the world's position when it moves you (a gate, the
  // mine, a new morning).
  const place = `${areaKey(p.area)}|${dayOf(m.minute)}`;
  if (place !== lastPlace) {
    runtime.player = { ...p.player };
    if (lastPlace && lastPlace.split("|")[1] !== place.split("|")[1] && st.screen === "playing") st.open("summary");
    lastPlace = place;
  }
  useWorld.setState({ world: { ...view, player: { ...runtime.player } }, screen: "playing" });
}

export const useMulti = create<MultiStore>((set, get) => ({
  lobby: null,
  me: null,
  info: null,
  role: null,
  session: null,
  status: "off",
  stopReason: "",
  world: null,
  version: 0,
  muted: [],
  chatSeen: {},
  toggleMute: (pid) => {
    const { info, muted } = get();
    const next = muted.includes(pid) ? muted.filter((x) => x !== pid) : [...muted, pid];
    set({ muted: next });
    try {
      if (info) localStorage.setItem(`soil-mp-muted:${info.id}`, JSON.stringify(next));
    } catch {
      // Storage can be blocked; the mute lasts until you leave.
    }
  },

  init: async () => {
    const l = lobby();
    set({ lobby: l, me: l ? await l.me() : null });
  },

  open: async (info) => {
    const { lobby: l, me } = get();
    if (!l || !me) return;
    await get().leave();
    let muted: string[] = [];
    try {
      muted = JSON.parse(localStorage.getItem(`soil-mp-muted:${info.id}`) ?? "[]");
    } catch {
      muted = [];
    }
    set({ status: "connecting", info, stopReason: "", muted, chatSeen: {} });
    const transport = l.transport(info, me);
    const isHost = info.hostId === me.pid;
    let session: HostSession | ClientSession;
    if (isHost) {
      const snap = await transport.loadSnapshot();
      const saved = snap?.world;
      const world = saved ? { ...saved, hostId: saved.hostId ?? me.pid } : newMultiWorld(info.id, info.name, Math.floor(Math.random() * 2147483646) + 1, DEFAULT_SETTINGS, { id: me.pid, name: me.name, avatar: useWorld.getState().saved?.avatar });
      session = new HostSession(transport, { pid: me.pid, name: me.name, host: true }, world, snap?.seq ?? 0);
      await (session as HostSession).save();
      (session as HostSession).startClock(() => msPerGameMinute(session.world.settings.speed));
    } else session = new ClientSession(transport, { pid: me.pid, name: me.name, host: false }, useWorld.getState().saved?.avatar);
    lastPlace = "";
    session.onChange((world) => {
      const s = get().session;
      if (s !== session) return;
      if (session instanceof ClientSession && session.stopped) {
        set({ status: "stopped", stopReason: session.stopped === "full" ? "That world already has 8 farmers." : "The host left. The world is saved; you can rejoin when they're back." });
        useWorld.setState({ remote: null, world: null, screen: "menu", menu: null });
        return;
      }
      if (session instanceof ClientSession && !session.loaded) return;
      const changed = world !== get().world;
      // Note when new chat messages arrive (the ones already there when you join count as old).
      const seen = get().chatSeen;
      const fresh = (world.chat ?? []).filter((c) => !(c.id in seen));
      const chatSeen = fresh.length ? { ...seen, ...Object.fromEntries(fresh.map((c) => [c.id, get().world ? Date.now() : 0])) } : seen;
      set({ world, status: "playing", version: get().version + 1, chatSeen });
      // Others walking about only moves their figures; the world itself is redrawn when it changes.
      if (changed) show(world, me.pid);
    });
    useWorld.setState({ remote: (op, args) => session.submit({ op, args, pos: { ...runtime.player } }), menu: null });
    set({ session, role: isHost ? "host" : "client" });
    session.start();
    if (session instanceof ClientSession) session.hello();
    else {
      set({ world: session.world, status: "playing", chatSeen: Object.fromEntries((session.world.chat ?? []).map((c) => [c.id, 0])) });
      show(session.world, me.pid);
    }
  },

  leave: async () => {
    const s = get().session;
    if (!s) return;
    if (s instanceof HostSession) await s.save().catch(() => {});
    s.close();
    set({ session: null, role: null, world: null, status: "off", info: null });
    useWorld.setState({ remote: null });
    useWorld.getState().init();
  },
}));

/** True while playing a multiplayer world. */
export const inMultiplayer = () => useMulti.getState().session !== null;
