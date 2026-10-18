"use client";

import { useState } from "react";
import { useMulti } from "@/net/mp";
import { fairPrice, stallChance } from "@/world/engine";
import { ITEMS } from "@/world/items";
import { ownerOf, STALL_SIZE, stallOf, storePrice } from "@/world/multi";
import type { Listing, Slot } from "@/world/types";
import { ItemIcon } from "./ItemIcon";
import { Modal } from "./Menus";
import { useWorld } from "./useWorld";

const send = (op: string, args: unknown[]) => useWorld.getState().remote?.(op, args);

/** A market stall in the town square: stock your own, or buy from someone else's. */
export function StallMenu() {
  const garden = Number(useWorld((s) => s.chestId));
  const close = useWorld((s) => s.close);
  const world = useMulti((s) => s.world);
  const me = useMulti((s) => s.me);
  if (!world || !me) return <SoloStall />;
  const owner = ownerOf(world, garden);
  const mine = owner?.id === me.pid;
  const title = owner ? (mine ? "Your market stall" : `${owner.name}'s market stall`) : "An empty stall";
  return (
    <Modal title={title} icon="🧺" onClose={close} wide>
      {!owner ? (
        <p className="text-sm text-muted">Nobody farms this garden yet, so the stall is empty.</p>
      ) : mine ? (
        <OwnStall garden={garden} />
      ) : (
        <BuyFrom garden={garden} sellerName={owner.name} />
      )}
    </Modal>
  );
}

/** Your stall in a game of your own: townsfolk stop by during the day. */
function SoloStall() {
  const w = useWorld((s) => s.world!);
  const run = useWorld((s) => s.run);
  const close = useWorld((s) => s.close);
  const list = w.stall ?? [];
  return (
    <Modal title="Your market stall" icon="🧺" onClose={close} wide>
      <StockStall
        list={list}
        inventory={w.inventory}
        price={(s) => fairPrice(w, s)}
        blurb={
          <>
            Townsfolk browse the square from 8 AM to 8 PM and buy what you put out. Near the store&apos;s price it sells steadily; a bargain sells
            fast; ask too much and nobody bites. You can show {STALL_SIZE} kinds of things at once.
          </>
        }
        note={(l) => `${Math.round(stallChance(w, l) * 100)}% chance an hour`}
        onStock={(slot, qty, price) => run("stock", slot, qty, price)}
        onUnstock={(i) => run("unstock", i)}
      />
    </Modal>
  );
}

function Listings({ garden, list: own, action, note }: { garden?: number; list?: Listing[]; action: (i: number, qty: number) => React.ReactNode; note?: (l: Listing) => string }) {
  const world = useMulti((s) => s.world);
  const list = own ?? (world && garden !== undefined ? stallOf(world, garden) : []);
  if (!list.length) return <p className="rounded-xl bg-paper p-3 text-sm text-muted">Nothing on the stall right now.</p>;
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {list.map((l, i) => (
        <li key={`${l.item}-${l.grade}-${l.price}`} className="flex items-center gap-2 rounded-xl border border-line bg-paper p-2 text-sm">
          <ItemIcon id={l.item} grade={l.grade} />
          <span className="mr-auto font-bold">
            {ITEMS[l.item].name} ×{l.qty}
            <span className="block text-xs font-semibold text-muted">🪙 {l.price} each{l.grade ? ` · grade ${l.grade}` : ""}{note ? ` · ${note(l)}` : ""}</span>
          </span>
          {action(i, l.qty)}
        </li>
      ))}
    </ul>
  );
}

function OwnStall({ garden }: { garden: number }) {
  const world = useMulti((s) => s.world)!;
  const me = useMulti((s) => s.me)!;
  const p = world.players[me.pid];
  return (
    <StockStall
      list={stallOf(world, garden)}
      inventory={p.inventory}
      price={(s) => storePrice(s.item, s.grade, p.organic)}
      blurb={<>Other farmers can buy what you put here, even while you&apos;re away. The coins come straight to you. You can show {STALL_SIZE} kinds of things at once.</>}
      onStock={(slot, qty, price) => send("stock", [slot, qty, price])}
      onUnstock={(i) => send("unstock", [i])}
    />
  );
}

/** Your own stall: what's on it, and putting things out at your price. */
function StockStall({ list, inventory, price: storeFor, blurb, note, onStock, onUnstock }: {
  list: Listing[];
  inventory: (Slot | null)[];
  price: (s: Pick<Slot, "item" | "grade">) => number;
  blurb: React.ReactNode;
  note?: (l: Listing) => string;
  onStock: (slot: number, qty: number, price: number) => void;
  onUnstock: (i: number) => void;
}) {
  const [pick, setPick] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const sellable = inventory.flatMap((s, i) => (s && ITEMS[s.item].sell && !ITEMS[s.item].tool && ITEMS[s.item].kind !== "utensil" ? [{ s, i }] : []));
  const chosen = pick !== null ? inventory[pick] : null;
  const choose = (i: number) => {
    const s = inventory[i]!;
    setPick(i);
    setQty(s.qty);
    setPrice(storeFor(s));
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{blurb}</p>
      <section>
        <h3 className="mb-2 font-black">On your stall</h3>
        <Listings list={list} note={note} action={(i) => <button className="btn btn-ghost py-1 text-xs" onClick={() => onUnstock(i)}>Take back</button>} />
      </section>
      <section>
        <h3 className="mb-2 font-black">Put something out</h3>
        {sellable.length ? (
          <div className="flex flex-wrap gap-1.5">
            {sellable.map(({ s, i }) => (
              <button key={i} onClick={() => choose(i)} aria-label={`Sell ${ITEMS[s.item].name}`}
                className={`relative grid h-12 w-12 place-items-center rounded-xl text-2xl ${pick === i ? "bg-sun ring-2 ring-soil" : "bg-paper hover:bg-white"}`}>
                <ItemIcon id={s.item} grade={s.grade} />
                {s.qty > 1 && <span className="absolute bottom-0 right-1 text-[11px] font-black">{s.qty}</span>}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Nothing in your bag to sell. Crops, food, honey, eggs, wood, and stone all sell.</p>
        )}
        {chosen && (
          <div className="mt-3 flex flex-wrap items-end gap-3 rounded-xl bg-paper p-3 text-sm">
            <span className="font-black">{ITEMS[chosen.item].name}</span>
            <label className="grid gap-0.5 text-xs font-bold">How many
              <input type="number" min={1} max={chosen.qty} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(chosen.qty, Number(e.target.value) || 1)))} className="w-20 rounded-lg border border-line px-2 py-1 text-sm" />
            </label>
            <label className="grid gap-0.5 text-xs font-bold">Price each
              <input type="number" min={1} value={price} onChange={(e) => setPrice(Math.max(1, Number(e.target.value) || 1))} className="w-24 rounded-lg border border-line px-2 py-1 text-sm" aria-label="Price each" />
            </label>
            <span className="text-xs text-muted">The store pays {storeFor(chosen)}.</span>
            <button className="btn btn-primary ml-auto py-1.5 text-sm" onClick={() => { onStock(pick!, qty, price); setPick(null); }}>Put on the stall</button>
          </div>
        )}
      </section>
    </div>
  );
}

function BuyFrom({ garden, sellerName }: { garden: number; sellerName: string }) {
  const world = useMulti((s) => s.world)!;
  const me = useMulti((s) => s.me)!;
  const coins = world.players[me.pid].coins;
  const list = stallOf(world, garden);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted">Everything you buy here pays {sellerName} directly.</span>
        <span className="ml-auto rounded-full bg-paper px-3 py-1 font-black">🪙 {coins.toLocaleString()}</span>
      </div>
      <Listings
        garden={garden}
        action={(i, qty) => (
          <span className="flex gap-1">
            <button className="btn btn-ghost py-1 text-xs" disabled={coins < list[i].price} onClick={() => send("buyStall", [garden, i, 1])}>Buy 1</button>
            {qty > 1 && <button className="btn btn-primary py-1 text-xs" disabled={coins < list[i].price * qty} onClick={() => send("buyStall", [garden, i, qty])}>All · {list[i].price * qty}</button>}
          </span>
        )}
      />
    </div>
  );
}
