"use client";

import { recipeStatus, STATIONS } from "@/world/engine";
import { ITEMS, RECIPES, type Station } from "@/world/items";
import { ItemIcon } from "./ItemIcon";
import { Modal } from "./Menus";
import { useWorld } from "./useWorld";

const ICONS: Record<Station, string> = { workbench: "🪚", grinder: "⚙️", spinningWheel: "🧵", furnace: "🔥" };

/** A crafting station: what it makes, what each takes, and a button to make one. */
export function CraftMenu() {
  const w = useWorld((s) => s.world!);
  const id = useWorld((s) => s.chestId);
  const run = useWorld((s) => s.run);
  const close = useWorld((s) => s.close);
  const b = w.buildings.find((x) => x.id === id);
  if (!b || !(b.kind in STATIONS)) return null;
  const station = b.kind as Station;
  const recipes = RECIPES.filter((r) => r.station === station);
  return (
    <Modal title={STATIONS[station]} icon={ICONS[station]} onClose={close} wide>
      <ul className="space-y-1.5">
        {recipes.map((r) => {
          const { inputs, ok } = recipeStatus(w, r);
          const out = ITEMS[r.id];
          return (
            <li key={r.id} className="flex items-center gap-3 rounded-xl border border-line p-2">
              <ItemIcon id={r.id} className="text-2xl" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{out.name}{r.qty > 1 ? ` ×${r.qty}` : ""}</p>
                <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                  {inputs.map((i) => (
                    <span key={i.item} className={`inline-flex items-center gap-1 ${i.have >= i.qty ? "text-muted" : "font-bold text-danger"}`}>
                      <ItemIcon id={i.item} /> {ITEMS[i.item].name} {Math.min(i.have, i.qty)}/{i.qty}
                    </span>
                  ))}
                </p>
              </div>
              <button className="btn btn-primary shrink-0 px-3 py-1 text-sm" disabled={!ok} onClick={() => run("craft", r.id)} aria-label={`Make ${out.name}`}>
                Make
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
