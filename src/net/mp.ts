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

  init: async () => {
    const l = lobby();
    set({ lobby: l, me: l ? await l.me() : null });
  },

  open: async (info) => {
    const { lobby: l, me } = get();
    if (!l || !me) return;
    await get().leave();
    set({ status: "connecting", info, stopReason: "" });
    const transport = l.transport(info, me);
    const isHost = info.hostId === me.pid;
    let session: HostSession | ClientSession;
    if (isHost) {
      const snap = await transport.loadSnapshot();
      const world = snap?.world ?? newMultiWorld(info.id, info.name, Math.floor(Math.random() * 2147483646) + 1, DEFAULT_SETTINGS, { id: me.pid, name: me.name, avatar: useWorld.getState().saved?.avatar });
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
      set({ world, status: "playing", version: get().version + 1 });
      // Others walking about only moves their figures; the world itself is redrawn when it changes.
      if (changed) show(world, me.pid);
    });
    useWorld.setState({ remote: (op, args) => session.submit({ op, args, pos: { ...runtime.player } }), menu: null });
    set({ session, role: isHost ? "host" : "client" });
    session.start();
    if (session instanceof ClientSession) session.hello();
    else {
      set({ world: session.world, status: "playing" });
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
