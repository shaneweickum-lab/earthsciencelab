"use client";

import { HOTBAR_SIZE, putInChest, takeAllFromChest, takeFromChest } from "@/world/engine";
import { ITEMS } from "@/world/items";
import { CHEST_SIZE } from "@/world/map";
import type { Slot } from "@/world/types";
import { ItemIcon } from "./ItemIcon";
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
    <Modal title="Grandma Rosa's chest" icon="🧰" onClose={close} wide>
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
