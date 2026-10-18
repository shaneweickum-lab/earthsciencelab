"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AREA_NAME, buyDecor, canPut, DECOR, DECOR_BY_ID, homestead, moveDecor, placeDecor, resale, rotateDecor, sellDecor, storeDecor,
} from "@/world/homestead";
import type { DecorArea, WorldState } from "@/world/types";
import { HomesteadScene, type Ghost } from "./HomesteadScene";

type Mode = { kind: "idle" } | { kind: "place"; item: string; rot: number } | { kind: "move"; uid: number; item: string; rot: number };

function DecorIcon({ id, className }: { id: string; className: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/icons/decor_${id}.png`} alt="" aria-hidden className={className} draggable={false} loading="lazy" />;
}

/**
 * Decorate the farmhouse room and the front yard: buy pieces with farm coins, set them out on the
 * grid, and turn, move, store, or sell them. Works on any world (the site's save or the game's).
 */
export function HomesteadEditor({ world, update }: { world: WorldState; update: (fn: (w: WorldState) => WorldState) => void }) {
  const [area, setArea] = useState<DecorArea>("room");
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [selected, setSelected] = useState<number | null>(null);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [tab, setTab] = useState<"shop" | "stored">("shop");
  const h = homestead(world);
  const placed = h[area];
  const pick = placed.find((p) => p.uid === selected) ?? null;
  const msg = world.messages.at(-1)?.text;

  const ghost: Ghost | null = useMemo(() => {
    if (mode.kind === "idle" || !hover) return null;
    const ok = !canPut(world, area, mode.item, hover[0], hover[1], mode.rot, mode.kind === "move" ? mode.uid : undefined);
    return { item: mode.item, x: hover[0], y: hover[1], rot: mode.rot, ok };
  }, [mode, hover, world, area]);

  // R turns what you're placing; Escape puts it down.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMode({ kind: "idle" });
      if (e.key === "r" || e.key === "R") setMode((m) => (m.kind === "idle" ? m : { ...m, rot: (m.rot + 1) % 4 }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const switchArea = (a: DecorArea) => {
    setArea(a);
    setMode({ kind: "idle" });
    setSelected(null);
  };

  const onCell = (x: number, y: number) => {
    if (mode.kind === "place") {
      if (canPut(world, area, mode.item, x, y, mode.rot)) return;
      update((s) => placeDecor(s, area, mode.item, x, y, mode.rot));
      // Keep placing while there are more of the same in storage.
      if ((h.stored[mode.item] ?? 0) <= 1) setMode({ kind: "idle" });
    } else if (mode.kind === "move") {
      if (canPut(world, area, mode.item, x, y, mode.rot, mode.uid)) return;
      update((s) => moveDecor(s, area, mode.uid, x, y, mode.rot));
      setMode({ kind: "idle" });
    } else setSelected(null);
  };

  const buyAndPlace = (id: string) => {
    update((s) => buyDecor(s, id));
    setSelected(null);
    setMode({ kind: "place", item: id, rot: 0 });
  };

  const items = DECOR.filter((d) => d.area === area);
  const stored = Object.entries(h.stored).filter(([id, n]) => n > 0 && DECOR_BY_ID[id]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {(["room", "yard"] as const).map((a) => (
            <button key={a} onClick={() => switchArea(a)} className={`rounded-full px-4 py-1.5 text-sm font-bold ${area === a ? "bg-soil text-white" : "bg-card hover:bg-paper"}`}>
              {a === "room" ? "🛋️" : "🌳"} {AREA_NAME[a]}
            </button>
          ))}
          <span className="ml-auto rounded-full bg-card px-3 py-1 text-sm font-black" data-testid="homestead-coins">🪙 {world.coins.toLocaleString()}</span>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-line bg-card shadow-sm sm:aspect-[16/10]">
          <HomesteadScene
            area={area}
            placed={placed}
            selected={selected}
            ghost={ghost}
            onHover={(x, y) => setHover((p) => (p && p[0] === x && p[1] === y ? p : [x, y]))}
            onCell={onCell}
            onPick={(uid) => mode.kind === "idle" && setSelected(uid)}
          />
          <div className="pointer-events-none absolute left-3 top-3 max-w-[70%] rounded-xl bg-card/90 px-3 py-1.5 text-xs font-semibold shadow">
            {mode.kind !== "idle"
              ? <>Click a spot to set down the <b>{DECOR_BY_ID[mode.item].name.toLowerCase()}</b>. <kbd>R</kbd> turns it, <kbd>Esc</kbd> stops.</>
              : "Buy something from the catalog, or click a piece to move it. Drag to look around."}
          </div>
          {mode.kind !== "idle" && (
            <div className="absolute bottom-3 left-3 flex gap-2">
              <button className="btn btn-ghost bg-card text-sm" onClick={() => setMode({ ...mode, rot: (mode.rot + 1) % 4 })}>↻ Turn</button>
              <button className="btn btn-ghost bg-card text-sm" onClick={() => setMode({ kind: "idle" })}>Done</button>
            </div>
          )}
          {pick && mode.kind === "idle" && (
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2 rounded-2xl bg-card/95 p-2 shadow">
              <DecorIcon id={pick.item} className="h-9 w-9" />
              <span className="mr-auto text-sm font-black">{DECOR_BY_ID[pick.item].name}</span>
              <button className="btn btn-ghost text-sm" onClick={() => update((s) => rotateDecor(s, area, pick.uid))}>↻ Turn</button>
              <button className="btn btn-ghost text-sm" onClick={() => { setMode({ kind: "move", uid: pick.uid, item: pick.item, rot: pick.rot }); setSelected(null); }}>✋ Move</button>
              <button className="btn btn-ghost text-sm" onClick={() => { update((s) => storeDecor(s, area, pick.uid)); setSelected(null); }}>📦 Put away</button>
            </div>
          )}
        </div>
        {msg && <p className="px-1 text-xs text-muted">{msg}</p>}
      </div>

      <aside className="card flex max-h-[640px] flex-col p-3">
        <div className="mb-2 flex gap-1">
          {(["shop", "stored"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-full px-3 py-1.5 text-sm font-bold ${tab === t ? "bg-leaf text-white" : "hover:bg-paper"}`}>
              {t === "shop" ? "🛒 Catalog" : `📦 Storage (${stored.reduce((n, [, q]) => n + q, 0)})`}
            </button>
          ))}
        </div>
        {tab === "shop" ? (
          <ul className="grid grid-cols-2 gap-2 overflow-y-auto pr-1" aria-label="Catalog">
            {items.map((d) => (
              <li key={d.id}>
                <button
                  className="flex w-full flex-col items-center rounded-xl border border-line bg-paper p-2 text-center hover:border-leaf disabled:opacity-50"
                  disabled={world.coins < d.price}
                  onClick={() => buyAndPlace(d.id)}
                  title={`Buy the ${d.name.toLowerCase()} and set it out`}
                >
                  <DecorIcon id={d.id} className="h-14 w-14" />
                  <span className="mt-1 text-xs font-bold leading-tight">{d.name}</span>
                  <span className="text-xs font-black text-soil">🪙 {d.price}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : stored.length ? (
          <ul className="space-y-2 overflow-y-auto pr-1">
            {stored.map(([id, n]) => {
              const d = DECOR_BY_ID[id];
              return (
                <li key={id} className="flex items-center gap-2 rounded-xl border border-line bg-paper p-2">
                  <DecorIcon id={id} className="h-10 w-10" />
                  <span className="mr-auto text-xs font-bold leading-tight">{d.name}{n > 1 ? ` ×${n}` : ""}<br /><span className="font-semibold text-muted">{d.area === "room" ? "Room" : "Yard"}</span></span>
                  <button className="btn btn-primary px-2 py-1 text-xs" onClick={() => { switchArea(d.area); setMode({ kind: "place", item: id, rot: 0 }); }}>Set out</button>
                  <button className="btn btn-ghost px-2 py-1 text-xs" onClick={() => update((s) => sellDecor(s, id))} title="Sell it back for half">Sell 🪙{resale(d)}</button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="p-3 text-sm text-muted">Nothing in storage. Things you put away wait here until you set them out again or sell them.</p>
        )}
      </aside>
    </div>
  );
}
