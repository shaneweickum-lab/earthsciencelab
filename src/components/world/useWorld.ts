"use client";

import { create } from "zustand";
import { loadWorld, newWorld, saveWorld } from "@/world/engine";
import type { WorldState } from "@/world/types";

export const SAVE_KEY = "earthsciencelab-world";

export type Menu = null | "intro" | "house" | "tv" | "store" | "shipping" | "bag" | "journal" | "summary";

interface WorldStore {
  world: WorldState | null;
  menu: Menu;
  /** Load the saved farm, or start a new one. */
  init: () => void;
  /** Apply an engine function to the world. */
  update: (fn: (w: WorldState) => WorldState) => void;
  open: (menu: Menu) => void;
  close: () => void;
  save: () => void;
  restart: () => void;
}

/**
 * Fast-changing values that update every frame live here instead of in React state,
 * so walking around doesn't re-render the whole game.
 */
export const runtime = {
  player: { x: 10, y: 10, facing: "down" as WorldState["player"]["facing"] },
  keys: new Set<string>(),
  moving: false,
  /** When the player last pressed the action button (for the reach animation). */
  actionAt: 0,
};

function withRuntime(w: WorldState): WorldState {
  return { ...w, player: { ...runtime.player } };
}

function syncRuntime(w: WorldState) {
  runtime.player = { ...w.player };
}

export const useWorld = create<WorldStore>((set, get) => ({
  world: null,
  menu: null,
  init: () => {
    let saved: WorldState | null = null;
    try {
      saved = loadWorld(localStorage.getItem(SAVE_KEY));
    } catch {
      saved = null;
    }
    const world = saved ?? newWorld();
    syncRuntime(world);
    set({ world, menu: world.introSeen ? null : "intro" });
  },
  update: (fn) => {
    const w = get().world;
    if (!w) return;
    const next = fn(withRuntime(w));
    syncRuntime(next);
    set({ world: next });
  },
  open: (menu) => set({ menu }),
  close: () => set({ menu: null }),
  save: () => {
    const w = get().world;
    if (!w) return;
    try {
      localStorage.setItem(SAVE_KEY, saveWorld(withRuntime(w)));
    } catch {
      // Storage can be full or blocked; the game keeps running.
    }
  },
  restart: () => {
    const world = newWorld();
    syncRuntime(world);
    set({ world, menu: "intro" });
    get().save();
  },
}));
