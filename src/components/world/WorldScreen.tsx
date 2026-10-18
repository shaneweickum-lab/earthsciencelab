"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { act, buildingAt, facingTile, interact, interactTarget, pickUpBuilding, soilHealth } from "@/world/engine";
import { actionAnim } from "@/world/preview";
import { npcInFront } from "@/world/town";
import { useElementsPanel } from "@/store/elementsPanel";
import { useProgress } from "@/store/progress";
import { Hotbar, Messages, StatusBar, TileInspector } from "./Hud";
import { JournalBook } from "./JournalBook";
import { MainMenu, NewGameSetup, PauseMenu } from "./MainMenu";
import { NoticeBoard, NpcDialog, QuestLog } from "./Town";
import { Bag, DaySummary, HouseMenu, IntroLetter, TvForecast } from "./Menus";
import { ShippingMenu, StoreMenu } from "./Shop";
import { ChestMenu, MineCart } from "./Chest";
import { CraftMenu } from "./Craft";
import { labelLayer, runtime, useWorld } from "./useWorld";

const WorldScene = dynamic(() => import("./scene/WorldScene"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-white/80">Loading your farm…</div>,
});

const MOVE: Record<string, string> = {
  w: "up", arrowup: "up", s: "down", arrowdown: "down", a: "left", arrowleft: "left", d: "right", arrowright: "right",
};

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * Space (or the A button) uses the item in your hand; E always interacts: harvest, observe a critter,
 * or open a building, whatever you're holding.
 */
export function doAction(mode: "use" | "interact" = "use") {
  const st = useWorld.getState();
  const w = st.world;
  if (!w || st.menu) return;
  const here = { ...w, player: runtime.player };
  const npc = npcInFront(here);
  if (npc) {
    st.talkTo(npc.id);
    return;
  }
  const target = interactTarget(here);
  if (target === "house") st.open("house");
  else if (target === "board") st.open("board");
  else if (target === "store") st.open("store");
  else if (target === "shipping") st.open("shipping");
  else if (target === "mine") st.open("mine");
  else if (target === "chest" || target === "craft") {
    const { x, y } = facingTile(here);
    st.openChest(buildingAt(here, x, y)!.id, target);
  } else {
    // E reaches out to touch or collect; Space uses the item in hand.
    runtime.action = { at: performance.now(), anim: mode === "interact" ? "pickup" : actionAnim(here) };
    st.update(mode === "interact" ? interact : act);
  }
}

function pickUp() {
  const st = useWorld.getState();
  const w = st.world;
  if (!w || st.menu) return;
  const { x, y } = facingTile(w);
  const b = buildingAt(w, x, y);
  if (b) st.update((s) => pickUpBuilding(s, b.id));
}

function useGameKeys() {
  useEffect(() => {
    function down(e: KeyboardEvent) {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (useElementsPanel.getState().isOpen) return;
      const k = e.key.toLowerCase();
      const st = useWorld.getState();
      if (st.screen !== "playing") return;
      // The game owns E (and other keys) while you play: mark them handled so site shortcuts skip them.
      if (st.menu) {
        if (k === "e" || k === "j" || k === "i") e.preventDefault();
        if (k === "q") e.preventDefault();
        const toggles = (k === "i" && st.menu === "bag") || (k === "j" && st.menu === "journal") || (k === "q" && st.menu === "quests");
        if ((k === "escape" || toggles) && st.menu !== "intro" && st.menu !== "summary") st.close();
        return;
      }
      if (k === "escape") {
        st.open("pause");
        return;
      }
      if (MOVE[k]) {
        runtime.keys.add(MOVE[k]);
        e.preventDefault();
        return;
      }
      if (k === " " || k === "e") {
        e.preventDefault();
        if (!e.repeat) doAction(k === "e" ? "interact" : "use");
        return;
      }
      if (/^[0-9]$/.test(k)) {
        const n = k === "0" ? 9 : Number(k) - 1;
        st.update((w) => ({ ...w, selected: n }));
        e.preventDefault();
        return;
      }
      if (k === "i" || k === "tab") {
        e.preventDefault();
        st.open("bag");
      } else if (k === "j") {
        e.preventDefault();
        st.open("journal");
      } else if (k === "q") {
        e.preventDefault();
        st.open("quests");
      } else if (k === "p") {
        pickUp();
      }
    }
    function up(e: KeyboardEvent) {
      const d = MOVE[e.key.toLowerCase()];
      if (d) runtime.keys.delete(d);
      if (e.key === " " && !useWorld.getState().menu && !isTyping(e.target)) e.preventDefault();
    }
    function clear() {
      runtime.keys.clear();
    }
    window.addEventListener("keydown", down, true);
    window.addEventListener("keyup", up, true);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down, true);
      window.removeEventListener("keyup", up, true);
      window.removeEventListener("blur", clear);
    };
  }, []);
}

/** Journal pages, harvests, and soil health count toward site-wide XP and badges. */
function useProgressSync() {
  const journal = useWorld((s) => s.world?.journal);
  const harvests = useWorld((s) => s.world?.harvests ?? 0);
  const tiles = useWorld((s) => s.world?.tiles);
  useEffect(() => {
    if (!journal || !tiles || !useProgress.persist.hasHydrated()) return;
    let best = 0;
    for (const t of tiles) if (t.ground === "farm" && t.known.lab && t.known.shovel && t.known.water) best = Math.max(best, soilHealth(t));
    useProgress.getState().recordFarm({ journal, harvests, bestSoilHealth: best });
  }, [journal, harvests, tiles]);
}

function HoldButton({ dir, label, className }: { dir: string; label: string; className: string }) {
  return (
    <button
      aria-label={`Walk ${dir}`}
      className={`grid h-12 w-12 place-items-center rounded-xl bg-card/80 text-xl font-black shadow active:bg-sun ${className}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        runtime.keys.add(dir);
      }}
      onPointerUp={() => runtime.keys.delete(dir)}
      onPointerCancel={() => runtime.keys.delete(dir)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
}

function TouchControls() {
  const open = useWorld((s) => s.open);
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-24 hidden items-end justify-between pointer-coarse:flex">
      <div className="pointer-events-auto grid grid-cols-3 gap-1">
        <HoldButton dir="up" label="▲" className="col-start-2" />
        <HoldButton dir="left" label="◀" className="col-start-1 row-start-2" />
        <HoldButton dir="down" label="▼" className="col-start-2 row-start-2" />
        <HoldButton dir="right" label="▶" className="col-start-3 row-start-2" />
      </div>
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <div className="flex gap-2">
          <button className="h-11 rounded-full bg-card/90 px-3 text-sm font-black shadow" onClick={() => open("bag")}>🎒</button>
          <button className="h-11 rounded-full bg-card/90 px-3 text-sm font-black shadow" onClick={() => open("journal")}>📓</button>
          <button aria-label="Interact" className="h-11 rounded-full bg-card/90 px-3 text-sm font-black shadow" onClick={() => doAction("interact")}>✋</button>
        </div>
        <button aria-label="Action" className="grid h-16 w-16 place-items-center rounded-full bg-leaf text-lg font-black text-white shadow-xl active:scale-95" onClick={() => doAction("use")}>
          A
        </button>
      </div>
    </div>
  );
}

export function WorldScreen() {
  const ready = useWorld((s) => s.world !== null && s.screen === "playing");
  const screen = useWorld((s) => s.screen);
  const menu = useWorld((s) => s.menu);
  const init = useWorld((s) => s.init);
  const save = useWorld((s) => s.save);
  const open = useWorld((s) => s.open);
  useGameKeys();
  useProgressSync();

  useEffect(() => {
    init();
    const onHide = () => {
      if (document.hidden) useWorld.getState().save();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", save);
    return () => {
      useWorld.getState().save();
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", save);
    };
  }, [init, save]);

  return (
    <div className="relative h-[78vh] min-h-[520px] w-full select-none overflow-hidden rounded-3xl bg-[#0f1a2e] shadow-xl" aria-label="Soil & Sprout game">
      <div ref={(el) => { labelLayer.current = el; }} className="pointer-events-none absolute inset-0 z-[5]" />
      {screen === "menu" && <MainMenu />}
      {screen === "setup" && <NewGameSetup />}
      {ready && <WorldScene />}
      {ready && (
        <>
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-2">
            <button
              className="pointer-events-auto rounded-full bg-card/90 px-3 py-1.5 text-sm font-bold shadow hover:bg-white"
              onClick={() => open("pause")}
              aria-label="Pause and settings"
            >
              ☰ Menu <kbd className="text-xs text-muted">Esc</kbd>
            </button>
            <Messages />
          </div>
          <div className="pointer-events-none absolute right-3 top-3 z-10">
            <StatusBar />
          </div>
          <div className="pointer-events-none absolute bottom-24 right-3 z-10 hidden md:block">
            <TileInspector />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center">
            <Hotbar />
          </div>
          <div className="pointer-events-auto absolute bottom-24 left-3 z-10 hidden gap-1.5 md:flex">
            <button className="rounded-full bg-card/90 px-3 py-1.5 text-sm font-bold shadow hover:bg-white" onClick={() => open("bag")}>🎒 Bag <kbd className="text-xs text-muted">I</kbd></button>
            <button className="rounded-full bg-card/90 px-3 py-1.5 text-sm font-bold shadow hover:bg-white" onClick={() => open("journal")}>📓 Journal <kbd className="text-xs text-muted">J</kbd></button>
            <button className="rounded-full bg-card/90 px-3 py-1.5 text-sm font-bold shadow hover:bg-white" onClick={() => open("quests")}>📜 Quests <kbd className="text-xs text-muted">Q</kbd></button>
          </div>
          <TouchControls />
          {menu === "intro" && <IntroLetter />}
          {menu === "house" && <HouseMenu />}
          {menu === "tv" && <TvForecast />}
          {menu === "summary" && <DaySummary />}
          {menu === "bag" && <Bag />}
          {menu === "store" && <StoreMenu />}
          {menu === "shipping" && <ShippingMenu />}
          {menu === "chest" && <ChestMenu />}
          {menu === "mine" && <MineCart />}
          {menu === "craft" && <CraftMenu />}
          {menu === "journal" && <JournalBook />}
          {menu === "pause" && <PauseMenu />}
          {menu === "npc" && <NpcDialog />}
          {menu === "board" && <NoticeBoard />}
          {menu === "quests" && <QuestLog />}
        </>
      )}
    </div>
  );
}
