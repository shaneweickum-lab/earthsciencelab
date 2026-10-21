"use client";

import { playerTile, travelMinutes } from "@/world/engine";
import { CATCHES, ITEMS, sellPrice } from "@/world/items";
import { DESTINATIONS } from "@/world/map";
import { route } from "@/world/town";
import { ItemIcon } from "./ItemIcon";
import { Modal } from "./Menus";
import { useWorld } from "./useWorld";

/** A signpost: everywhere it points, and how long the walk takes. */
export function TravelMenu() {
  const w = useWorld((s) => s.world!);
  const run = useWorld((s) => s.run);
  const close = useWorld((s) => s.close);
  const p = playerTile(w);
  return (
    <Modal title="Signpost" icon="🪧" onClose={close}>
      <p className="mb-3 text-sm text-muted">Pick a place and you&apos;ll walk there. The clock keeps running on the way.</p>
      <ul className="space-y-1.5">
        {DESTINATIONS.map((d) => {
          const here = Math.abs(d.x - p.x) + Math.abs(d.y - p.y) <= 3;
          const steps = route(w, [p.x, p.y], [d.x, d.y]).length;
          return (
            <li key={d.id} className="flex items-center gap-3 rounded-xl border border-line p-2">
              <span className="text-2xl" aria-hidden>{d.icon}</span>
              <span className="flex-1 font-bold">{d.name}</span>
              {here ? (
                <span className="rounded-full bg-paper px-3 py-1 text-sm font-black text-muted">You&apos;re here</span>
              ) : (
                <button
                  className="btn btn-primary px-3 py-1 text-sm"
                  onClick={() => {
                    run("travel", d.id);
                    close();
                  }}
                  aria-label={`Walk to ${d.name}`}
                >
                  🚶 {travelMinutes(steps)} min
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

/** Kai's fishing hut: a rod for sale, and Kai buys whatever you've caught. */
export function HutMenu() {
  const w = useWorld((s) => s.world!);
  const run = useWorld((s) => s.run);
  const close = useWorld((s) => s.close);
  const rod = ITEMS.rod;
  const fish = w.inventory.map((s, i) => ({ s, i })).filter(({ s }) => s && CATCHES.some((c) => c.id === s.item));
  return (
    <Modal title="Kai's Fishing Hut" icon="🎣" onClose={close}>
      <div className="mb-3 flex items-center gap-3 rounded-xl border border-line p-2">
        <ItemIcon id="rod" className="text-2xl" />
        <div className="min-w-0 flex-1">
          <p className="font-bold">{rod.name}</p>
          <p className="text-xs text-muted">{rod.desc}</p>
        </div>
        <button className="btn btn-primary px-3 py-1 text-sm" disabled={w.coins < rod.price!} onClick={() => run("buy", "rod", 1)} aria-label="Buy Fishing Rod">
          🪙 {rod.price}
        </button>
      </div>
      <p className="mb-1.5 text-xs font-black uppercase tracking-wider text-muted">Kai buys your catch</p>
      {fish.length === 0 && <p className="rounded-xl bg-paper p-4 text-center text-sm text-muted">No fish yet. Try the dock at dawn or dusk.</p>}
      <ul className="space-y-1.5">
        {fish.map(({ s, i }) => {
          const each = sellPrice(ITEMS[s!.item], s!.grade, false);
          return (
            <li key={i} className="flex items-center gap-3 rounded-xl border border-line p-2">
              <ItemIcon id={s!.item} className="text-2xl" />
              <span className="flex-1 font-bold">{ITEMS[s!.item].name} ×{s!.qty}</span>
              <button className="btn btn-ghost py-1 text-sm" onClick={() => run("sellNow", i, 1)}>Sell 1 · {each}</button>
              <button className="btn btn-primary py-1 text-sm" onClick={() => run("sellNow", i, s!.qty)}>All · {each * s!.qty}</button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
