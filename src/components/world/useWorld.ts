"use client";

import type { ActionAnim } from "@/world/preview";
import { create } from "zustand";
import { loadWorld, newWorld, saveWorld } from "@/world/engine";
import { DEFAULT_SETTINGS, type GameSettings } from "@/world/settings";
import { expireBoard } from "@/world/quests";
import { applyOp, type OpArgs, type OpName } from "@/world/ops";
import { talk } from "@/world/town";
import type { WorldState } from "@/world/types";

export const SAVE_KEY = "earthsciencelab-world";

export type Menu = null | "intro" | "house" | "tv" | "store" | "shipping" | "chest" | "mine" | "craft" | "plot" | "homestead" | "stall" | "bed" | "bag" | "journal" | "summary" | "pause" | "npc" | "board" | "quests" | "cookbook";

/** The tabs of the window that I opens: your bag, journal, quests, cookbook, and the game menu. */
export const HUB_TABS = ["bag", "journal", "quests", "cookbook", "pause"] as const;
export type HubTab = (typeof HUB_TABS)[number];
export const isHubTab = (m: Menu): m is HubTab => (HUB_TABS as readonly string[]).includes(m ?? "");

export type Screen = "menu" | "setup" | "lobby" | "playing";

interface WorldStore {
  world: WorldState | null;
  menu: Menu;
  screen: Screen;
  /** The saved farm, for the main menu's Continue button. */
  saved: WorldState | null;
  /** Show the main menu and look for a saved farm. */
  init: () => void;
  /** Start: a new farm with the recommended settings. */
  startQuick: () => void;
  /** New Game: a new farm with the settings picked on the setup screen. */
  startNew: (settings: GameSettings, avatar: string) => void;
  continueGame: () => void;
  openSetup: () => void;
  backToMenu: () => void;
  /** Save, then return to the main menu. */
  quitToMenu: () => void;
  updateSettings: (patch: Partial<GameSettings>) => void;
  /** Apply an engine function to the world. */
  update: (fn: (w: WorldState) => WorldState) => void;
  /** Do something by name (see world/ops.ts): applied here, or sent to the host in multiplayer. */
  run: <K extends OpName>(op: K, ...args: OpArgs<K>) => void;
  /** In multiplayer: how ops reach the host. Null in single-player. */
  remote: ((op: string, args: unknown[]) => void) | null;
  open: (menu: Menu) => void;
  /** The I window's tab you looked at last (I opens it there). */
  lastTab: HubTab;
  /** Which townsperson you're talking to. */
  talkingTo: string | null;
  /** The chest or crafting station that's open (or, for "plot", the plot's number). */
  chestId: string | null;
  openChest: (id: string, menu?: "chest" | "craft" | "plot" | "stall") => void;
  /** What they said when you started talking. */
  npcLine: string;
  talkTo: (id: string) => void;
  close: () => void;
  save: () => void;
}

function readSave(): WorldState | null {
  try {
    return loadWorld(localStorage.getItem(SAVE_KEY));
  } catch {
    return null;
  }
}

/**
 * Fast-changing values that update every frame live here instead of in React state,
 * so walking around doesn't re-render the whole game.
 */
export const runtime = {
  player: { x: 10, y: 10, facing: "down" as WorldState["player"]["facing"] },
  keys: new Set<string>(),
  moving: false,
  /** The player's last action and when it happened, for its animation (a swing, a use, or a pick-up). */
  action: { at: 0, anim: null as ActionAnim | null },
  /** Fraction of the current game minute that has passed, so townsfolk walk smoothly between ticks. */
  minuteFrac: 0,
};

/**
 * A container for 3D labels (drei <Html>) that outlives the canvas, so quitting to the menu
 * doesn't try to remove labels from a canvas wrapper that's already gone.
 */
export const labelLayer: { current: HTMLDivElement | null } = { current: null };

function withRuntime(w: WorldState): WorldState {
  return { ...w, player: { ...runtime.player } };
}

function syncRuntime(w: WorldState) {
  runtime.player = { ...w.player };
}

export const useWorld = create<WorldStore>((set, get) => {
  const begin = (world: WorldState) => {
    syncRuntime(world);
    runtime.keys.clear();
    set({ world, screen: "playing", menu: world.introSeen ? null : "intro" });
    get().save();
  };
  return {
    world: null,
    menu: null,
    screen: "menu",
    saved: null,
    init: () => set({ saved: readSave(), screen: "menu", world: null, menu: null }),
    startQuick: () => begin(newWorld(undefined, DEFAULT_SETTINGS)),
    startNew: (settings, avatar) => begin({ ...newWorld(undefined, settings), avatar }),
    continueGame: () => {
      const saved = readSave();
      if (saved) begin(saved);
    },
    openSetup: () => set({ screen: "setup" }),
    backToMenu: () => set({ screen: "menu" }),
    quitToMenu: () => {
      get().save();
      set({ world: null, menu: null, screen: "menu", saved: readSave() });
    },
    updateSettings: (patch) => {
      const w = get().world;
      if (w) set({ world: { ...w, settings: { ...w.settings, ...patch } } });
    },
    remote: null,
    run: (op, ...args) => {
      const remote = get().remote;
      if (remote) remote(op, args);
      else get().update((w) => applyOp(w, op, args));
    },
    update: (fn) => {
      const w = get().world;
      if (!w) return;
      const next = fn(withRuntime(w));
      syncRuntime(next);
      set({ world: next });
    },
    open: (menu) => {
      // Each morning, notice-board requests past their date come down.
      const w = get().world;
      if (menu === "summary" && w) set({ world: expireBoard(w) });
      set(isHubTab(menu) && menu !== "pause" ? { menu, lastTab: menu } : { menu });
    },
    lastTab: "bag",
    talkingTo: null,
    chestId: null,
    openChest: (id, menu = "chest") => set({ menu, chestId: id }),
    npcLine: "",
    talkTo: (id) => {
      const w = get().world;
      if (!w) return;
      const r = talk(withRuntime(w), id);
      if (get().remote) {
        get().run("talk", id);
        set({ menu: "npc", talkingTo: id, npcLine: r.text });
      } else set({ world: r.state, menu: "npc", talkingTo: id, npcLine: r.text });
    },
    close: () => set({ menu: null }),
    save: () => {
      const w = get().world;
      // Multiplayer worlds are saved by their host, not in this browser.
      if (!w || get().remote) return;
      try {
        localStorage.setItem(SAVE_KEY, saveWorld(withRuntime(w)));
      } catch {
        // Storage can be full or blocked; the game keeps running.
      }
    },
  };
});

// A farm downloaded from the cloud replaced the saved one: go back to the main menu without
// saving over it, so Continue loads the new farm.
if (typeof window !== "undefined") {
  window.addEventListener("earthsciencelab:save-replaced", () => {
    useWorld.setState({ world: null, menu: null, screen: "menu", saved: readSave() });
  });
}
