"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "@/store/account";
import { BADGES } from "@/store/badges";
import { useProgress } from "@/store/progress";
import { levelFor } from "@/store/progressLogic";
import { DEFAULT_AVATAR } from "@/world/avatars";
import { dayOf, formatDate, yearOf } from "@/world/clock";
import { loadWorld, ownedPlots, saveWorld } from "@/world/engine";
import { homestead } from "@/world/homestead";
import { PLOTS } from "@/world/map";
import type { WorldState } from "@/world/types";
import { SAVE_KEY, useWorld } from "../world/useWorld";
import { HomesteadEditor } from "./HomesteadEditor";

function readSave(): WorldState | null {
  try {
    return loadWorld(localStorage.getItem(SAVE_KEY));
  } catch {
    return null;
  }
}

/** The world saved in this browser, kept in sync with localStorage as the player decorates. */
export function useSavedWorld() {
  const [world, setWorld] = useState<WorldState | null | undefined>(undefined);
  useEffect(() => {
    // A game left open in this tab saves first, so nothing it did is lost.
    useWorld.getState().save();
    setWorld(readSave());
    const reload = () => setWorld(readSave());
    window.addEventListener("earthsciencelab:save-replaced", reload);
    return () => window.removeEventListener("earthsciencelab:save-replaced", reload);
  }, []);
  const update = useCallback((fn: (w: WorldState) => WorldState) => {
    setWorld((w) => {
      if (!w) return w;
      const next = fn(w);
      try {
        localStorage.setItem(SAVE_KEY, saveWorld(next));
      } catch {
        // Storage can be full or blocked.
      }
      return next;
    });
  }, []);
  return { world, update };
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-paper px-3 py-2">
      <div className="text-lg font-black leading-tight">{value}</div>
      <div className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

/** The player's profile: their farmer, their progress, and the home they've decorated. */
export function HomesteadPage() {
  const { world, update } = useSavedWorld();
  const name = useAccount((s) => s.profile?.display_name);
  const xp = useProgress((s) => s.xp);
  const badges = useProgress((s) => s.badges);
  if (world === undefined) return <div className="card p-6 text-sm text-muted">Opening your homestead…</div>;
  const avatar = world?.avatar ?? DEFAULT_AVATAR;
  const h = world ? homestead(world) : null;
  const pieces = h ? h.room.length + h.yard.length : 0;
  return (
    <div className="space-y-5">
      <section className="card flex flex-wrap items-center gap-5 p-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/icons/avatar_${avatar}.png`} alt="Your farmer" className="h-24 w-24 rounded-2xl bg-paper p-2" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-soil">My Homestead</p>
          <h1 className="font-display text-4xl font-black">{name || "Farmer"}</h1>
          <p className="text-sm text-muted">
            Level {levelFor(xp)} · {xp} XP · {badges.length} of {Object.keys(BADGES).length} badges
          </p>
        </div>
        {world && (
          <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:grid-cols-6">
            <Stat label="Farm day" value={`${formatDate(dayOf(world.minute), world.settings, true)}, Y${yearOf(dayOf(world.minute), world.settings)}`} />
            <Stat label="Coins" value={world.coins.toLocaleString()} />
            <Stat label="Harvests" value={world.harvests} />
            <Stat label="Journal" value={world.journal.length} />
            <Stat label="Plots" value={`${ownedPlots(world).length}/${PLOTS.length}`} />
            <Stat label="Decor" value={pieces} />
          </div>
        )}
      </section>
      {world ? (
        <HomesteadEditor world={world} update={update} />
      ) : (
        <section className="card p-6">
          <h2 className="text-xl font-black">You don&apos;t have a farm yet</h2>
          <p className="mt-1 text-sm text-muted">
            Start a farm in Soil &amp; Sprout. Grow and sell crops for farm coins, then come back here to furnish your farmhouse and plant up your front yard.
          </p>
          <Link href="/soil/game" className="btn btn-primary mt-4 inline-flex">🚜 Play Soil &amp; Sprout</Link>
        </section>
      )}
    </div>
  );
}
