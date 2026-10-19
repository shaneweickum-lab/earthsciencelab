"use client";

import { isCooking, kitchenAt, recipeStatus, STATIONS } from "@/world/engine";
import { COOKING, ITEMS, RECIPES, type Recipe, type Station } from "@/world/items";
import type { WorldState } from "@/world/types";
import { ItemIcon } from "./ItemIcon";
import { Modal } from "./Menus";
import { useWorld } from "./useWorld";

const ICONS: Record<Station, string> = { workbench: "🪚", grinder: "⚙️", spinningWheel: "🧵", furnace: "🔥", stove: "🍳", oven: "🥖" };

function RecipeRow({ w, r, at }: { w: WorldState; r: Recipe; at?: string }) {
  const run = useWorld((s) => s.run);
  const { inputs, missingTools, missingStations, ok } = recipeStatus(w, r, at);
  const out = ITEMS[r.id];
  const cooking = isCooking(r);
  return (
    <li className="flex items-center gap-3 rounded-xl border border-line p-2">
      <ItemIcon id={r.id} className="text-2xl" />
      <div className="min-w-0 flex-1">
        <p className="font-bold">
          {out.name}{r.qty > 1 ? ` ×${r.qty}` : ""}
          {out.energy ? <span className="ml-2 text-xs font-semibold text-leaf">⚡ +{out.energy}</span> : null}
        </p>
        <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
          {inputs.map((i) => (
            <span key={i.item} className={`inline-flex items-center gap-1 ${i.have >= i.qty ? "text-muted" : "font-bold text-danger"}`}>
              <ItemIcon id={i.item} /> {ITEMS[i.item].name} {Math.min(i.have, i.qty)}/{i.qty}
            </span>
          ))}
        </p>
        {cooking && (r.tools?.length || r.stations?.length) ? (
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs">
            {(r.tools ?? []).map((t) => (
              <span key={t} className={`inline-flex items-center gap-1 ${missingTools.includes(t) ? "font-bold text-danger" : "text-muted"}`}>
                <ItemIcon id={t} /> {ITEMS[t].name}
              </span>
            ))}
            {(r.stations ?? []).map((st) => (
              <span key={st} className={missingStations.includes(st) ? "font-bold text-danger" : "text-muted"}>
                {ICONS[st]} {STATIONS[st]}
              </span>
            ))}
          </p>
        ) : null}
      </div>
      <button className="btn btn-primary shrink-0 px-3 py-1 text-sm" disabled={!ok} onClick={() => run("craft", r.id, at)} aria-label={`${cooking ? "Cook" : "Make"} ${out.name}`}>
        {cooking ? "Cook" : "Make"}
      </button>
    </li>
  );
}

/** The cookbook (a tab of the I window): every dish; knife-only food is made right there. */
export function Cookbook() {
  const w = useWorld((s) => s.world!);
  const close = useWorld((s) => s.close);
  return (
    <Modal title="Cookbook" icon="📖" onClose={close} wide>
      <p className="mb-2 text-sm text-muted">
        Carry the utensils a dish needs in your bag. Food with only a knife can be made anywhere; the rest cook at a stove or oven
        (put them side by side for recipes that need both). Select food and use it to eat it.
      </p>
      <ul className="space-y-1.5">{COOKING.map((r) => <RecipeRow key={r.id} w={w} r={r} />)}</ul>
    </Modal>
  );
}

/**
 * A crafting station: what it makes, what each takes, and a button to make one. A stove or oven
 * opens the kitchen (every dish, and what's missing for each).
 */
export function CraftMenu() {
  const w = useWorld((s) => s.world!);
  const id = useWorld((s) => s.chestId);
  const close = useWorld((s) => s.close);
  const b = w.buildings.find((x) => x.id === id);
  if (!b || !(b.kind in STATIONS)) return null;
  const station = b.kind as Station;
  const kitchen = station === "stove" || station === "oven";
  const recipes = kitchen ? COOKING : RECIPES.filter((r) => r.station === station && !isCooking(r));
  const here = kitchenAt(w, b.id);
  return (
    <Modal title={kitchen ? `Kitchen: ${here.map((s) => STATIONS[s]).join(" and ")}` : STATIONS[station]} icon={ICONS[station]} onClose={close} wide>
      <ul className="space-y-1.5">{recipes.map((r) => <RecipeRow key={r.id} w={w} r={r} at={b.id} />)}</ul>
    </Modal>
  );
}
