"use client";

import { buyPlot, cartFloors, enterMine, HOTBAR_SIZE, nextPlotPrice, ownedPlots, putInChest, takeAllFromChest, takeFromChest } from "@/world/engine";
import { ITEMS } from "@/world/items";
import { CHEST_SIZE, PLOTS } from "@/world/map";
import type { Slot } from "@/world/types";
import { ItemIcon, WearBar } from "./ItemIcon";
import { Modal } from "./Menus";
import { useWorld } from "./useWorld";

function Grid({ slots, onPick, hotbar = 0, label }: { slots: (Slot | null)[]; onPick: (i: number) => void; hotbar?: number; label: string }) {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
      {slots.map((s, i) => (
        <button
          key={i}
          onClick={() => s && onPick(i)}
          disabled={!s}
          aria-label={s ? `${label} ${ITEMS[s.item].name}${s.grade ? ` grade ${s.grade}` : ""} ×${s.qty}` : `Empty slot ${i + 1}`}
          title={s ? ITEMS[s.item].name : undefined}
          className={`relative grid aspect-square place-items-center rounded-xl text-2xl transition ${
            i < hotbar ? "bg-leaf-light" : "bg-paper"
          } ${s ? "hover:bg-white hover:ring-2 hover:ring-soil" : ""}`}
        >
          {s && <ItemIcon id={s.item} grade={s.grade} />}
          <WearBar slot={s} />
          {s && s.qty > 1 && <span className="absolute bottom-0 right-1 text-[11px] font-black">{s.qty}</span>}
        </button>
      ))}
    </div>
  );
}

/** A storage chest: click something in the chest to take it, or in your bag to put it away. */
export function ChestMenu() {
  const w = useWorld((s) => s.world!);
  const id = useWorld((s) => s.chestId);
  const update = useWorld((s) => s.update);
  const close = useWorld((s) => s.close);
  const chest = w.buildings.find((b) => b.id === id);
  if (!chest || !id) return null;
  const items = Array.from({ length: CHEST_SIZE }, (_, i) => chest.data.items?.[i] ?? null);
  const empty = items.every((s) => !s);
  return (
    <Modal title={chest.id === "chest" ? "Grandma Rosa's chest" : "Storage chest"} icon="🧰" onClose={close} wide>
      <div className="mb-2 flex items-center gap-2">
        <p className="flex-1 text-sm text-muted">Click something in the chest to take it. Click something in your bag to put it away.</p>
        <button className="btn btn-primary py-1.5 text-sm" disabled={empty} onClick={() => update((s) => takeAllFromChest(s, id))}>
          Take all
        </button>
      </div>
      <Grid slots={items} label="Take" onPick={(i) => update((s) => takeFromChest(s, id, i))} />
      <p className="mt-4 mb-2 text-xs font-black uppercase tracking-wider text-muted">Your bag (the top row is your hotbar)</p>
      <Grid slots={w.inventory} hotbar={HOTBAR_SIZE} label="Store" onPick={(i) => update((s) => putInChest(s, id, i))} />
    </Modal>
  );
}

/** The mine cart at the entrance: ride down to the top or any fifth floor you've reached. */
export function MineCart() {
  const w = useWorld((s) => s.world!);
  const update = useWorld((s) => s.update);
  const close = useWorld((s) => s.close);
  const go = (floor: number) => {
    update((s) => enterMine(s, floor));
    close();
  };
  return (
    <Modal title="The old mine" icon="⛏️" onClose={close}>
      <p className="mb-3 text-sm text-muted">Climb down the ladder, or ride the mine cart to a floor you&apos;ve already reached.</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {cartFloors(w).map((f) => (
          <button key={f} className={`btn ${f === 1 ? "btn-ghost" : "btn-primary"}`} onClick={() => go(f)}>
            {f === 1 ? "🪜 Floor 1" : `🛒 Floor ${f}`}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">Deepest floor reached: {w.deepest ?? 0}</p>
    </Modal>
  );
}

/** A plot of farmland for sale: its price, and a button to buy it. */
export function PlotMenu() {
  const w = useWorld((s) => s.world!);
  const id = Number(useWorld((s) => s.chestId));
  const update = useWorld((s) => s.update);
  const close = useWorld((s) => s.close);
  const plot = PLOTS[id];
  if (!plot) return null;
  const price = nextPlotPrice(w);
  const owned = ownedPlots(w).length;
  return (
    <Modal title="Farmland for sale" icon="🌱" onClose={close}>
      <p className="text-sm">
        This plot is {plot.x1 - plot.x0 + 1} × {plot.y1 - plot.y0 + 1} tiles of {plot.y0 >= 36 ? "rich South Fields bottomland" : "field by the house"}.
        You own {owned} of {PLOTS.length} plots.
      </p>
      <p className="mt-2 text-xs text-muted">Each plot costs a little more than the last. Some quests give you land for free, too.</p>
      <div className="mt-4 flex items-center gap-3">
        <span className="rounded-full bg-paper px-3 py-1 text-sm font-black">🪙 {w.coins.toLocaleString()}</span>
        <button className="btn btn-primary ml-auto" disabled={w.coins < price} onClick={() => { update((s) => buyPlot(s, id)); close(); }}>
          Buy for 🪙 {price}
        </button>
      </div>
    </Modal>
  );
}
