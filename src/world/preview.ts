import { CROPS } from "@/game/crops";
import { buildingAt, canPlantHere, crittersHere, facingTile, mineOpen, nextPlotPrice, OBSTACLE_HP, obstacleName, plotLocked, ROCKS, selectedItem, STATIONS, tileAt } from "./engine";
import { ITEMS, TIERS, WORLD_CROPS, type ItemDef, type Station } from "./items";
import { amendmentPoints, MAX_BOOST } from "./grades";
import { on } from "./settings";
import type { Tile, WorldState } from "./types";

export interface ActionPreview {
  /** Short label for the action button, e.g. "Till". */
  label: string;
  /** What will happen, in kid-friendly words. Empty when nothing useful will happen. */
  text: string;
  ok: boolean;
}

/** How many more swings an obstacle needs with this tool. */
function swings(t: Tile, def: ItemDef, verb: string): string {
  const hp = OBSTACLE_HP[t.obstacle!] - (t.hits ?? 0);
  const n = Math.ceil(hp / TIERS[def.tool!.tier].power);
  const tree = t.obstacle === "tree" ? " Trees shelter wildlife; a felled one sprouts again from its stump." : "";
  return `${verb} the ${obstacleName(t.obstacle!)}: ${n} more swing${n === 1 ? "" : "s"}.${tree}`;
}

/** Tells the player what pressing Space will do on the tile in front of them, before they do it. */
export function previewAction(state: WorldState): ActionPreview {
  const slot = selectedItem(state);
  const { x, y } = facingTile(state);
  const t = tileAt(state, x, y);
  if (!t) return { label: "", text: "", ok: false };
  const b = buildingAt(state, x, y);
  const critter = crittersHere(state).find((c) => c.x === x && c.y === y);
  if (critter) return { label: "Observe", text: "Look closely and add it to your Nature Journal.", ok: true };

  if (!b && plotLocked(state, x, y)) {
    const price = nextPlotPrice(state);
    return { label: "Buy", text: `This plot isn't yours yet. Press E to buy it for ${price} coins, or earn it from a quest.`, ok: state.coins >= price };
  }
  if (b?.kind === "chest") return { label: "Open", text: "Open the chest to take things out or put them away.", ok: true };
  if (b?.kind === "gardenGate") return { label: "Enter", text: "Go through the gate into this farmer's garden. Press E.", ok: true };
  if (b?.kind === "marketStall") return { label: "Shop", text: "See what's for sale, or stock your own stall. Press E.", ok: true };
  if (b?.kind === "mineEntrance") return mineOpen(state)
    ? { label: "Enter", text: "Climb down into the old mine.", ok: true }
    : { label: "Enter", text: "The mine is boarded up. Luis might know about it.", ok: false };
  if (b?.kind === "ladderDown") return { label: "Climb", text: `Climb down to floor ${(state.mine?.floor ?? 0) + 1}.`, ok: true };
  if (b?.kind === "ladderUp") return { label: "Climb", text: "Climb back up to town.", ok: true };
  if (b?.kind === "barn" && !b.data.owner && !state.foundWorkbench) return { label: "Look", text: "Something big is under a dusty tarp in the barn.", ok: true };
  if (b && b.kind in STATIONS) return { label: "Craft", text: `Use the ${STATIONS[b.kind as Station].toLowerCase()}.`, ok: true };
  if (!slot) {
    if (t.crop && t.crop.growth >= 1) return { label: "Harvest", text: `Pick the ${CROPS[t.crop.id].name.toLowerCase()}.`, ok: true };
    return { label: "Hands", text: "Nothing to pick up here.", ok: false };
  }
  const def = ITEMS[slot.item];

  if (t.crop && t.crop.growth >= 1 && !t.crop.dead && def.kind !== "amendment")
    return { label: "Harvest", text: WORLD_CROPS[t.crop.id].cover ? "Dig the clover into the soil as green manure." : `Pick the ${CROPS[t.crop.id].name.toLowerCase()}.`, ok: true };

  const isGarden = t.ground === "farm" || t.greenhouse;
  switch (def.kind) {
    case "seed": {
      const why = canPlantHere(state, x, y, def.crop!);
      return why ? { label: "Plant", text: why, ok: false } : { label: "Plant", text: `Plant ${CROPS[def.crop!].name}. ${CROPS[def.crop!].givesText}`, ok: true };
    }
    case "amendment":
      if (!isGarden) return { label: "Apply", text: "Use this on garden soil.", ok: false };
      if (slot.item === "labKit" && !on(state, "soilTesting")) return { label: "Test", text: "Soil numbers are already visible (Hidden soil is off).", ok: false };
      if (slot.item === "labKit") return t.known.lab
        ? { label: "Test", text: "You already have lab results here.", ok: false }
        : { label: "Test", text: "Reveals organic matter, nutrients, and pH for this spot.", ok: true };
      {
        const pts = amendmentPoints(slot.item, t);
        const room = Math.max(0, MAX_BOOST - (t.boost ?? 0));
        const bonus = pts && room ? ` Raises the next crop's grade (+${Math.min(pts, room)}).` : "";
        return { label: "Apply", text: def.desc + bonus, ok: !t.obstacle };
      }
    case "kit":
      return { label: "Build", text: `Place a ${def.name}. ${def.desc}`, ok: true };
    case "tool":
      break;
    default:
      return { label: "", text: "", ok: false };
  }

  switch (def.tool!.use) {
    case "hoe":
      if (!isGarden) return { label: "Till", text: "Only the garden field can be tilled.", ok: false };
      if (t.obstacle) return { label: "Till", text: `Clear the ${t.obstacle} first.`, ok: false };
      if (t.weeds) return { label: "Till", text: "Cut the weeds with the scythe first.", ok: false };
      if (t.tilled) return { label: "Till", text: "Already tilled.", ok: false };
      return { label: "Till", text: on(state, "tillage") ? "Loosen the soil for seeds. Tilling breaks soil crumbs a little (structure −2)." : "Loosen the soil for seeds.", ok: true };
    case "can":
      if (t.ground === "water") return { label: "Refill", text: "Fill your watering can.", ok: true };
      if (b?.kind === "rainBarrel") return { label: "Refill", text: "Refill with rainwater.", ok: true };
      if (b?.kind === "well") return { label: "Refill", text: "Fill your can with groundwater from the well.", ok: true };
      if (state.water <= 0) return { label: "Water", text: "Your can is empty. Refill at the pond.", ok: false };
      if (!t.tilled) return { label: "Water", text: "Water tilled soil or crops.", ok: false };
      if (on(state, "waterlogging") && t.moisture >= 70) return { label: "Water", text: `Careful: the soil is already wet (${Math.round(t.moisture)}). Too much water can drown roots.`, ok: true };
      return { label: "Water", text: `Soak the soil (moisture ${Math.round(t.moisture)} → ${Math.min(100, Math.round(t.moisture + 45))}).`, ok: true };
    case "scythe":
      if (t.weeds) return { label: "Cut", text: "Cut the weeds and get plant fiber for compost.", ok: true };
      if (t.crop?.dead) return { label: "Clear", text: "Clear the dead plant.", ok: true };
      return { label: "Cut", text: "Nothing to cut.", ok: false };
    case "axe":
      if (t.obstacle && !ROCKS.includes(t.obstacle)) return { label: "Chop", text: swings(t, def, "Chop"), ok: true };
      if (t.obstacle) return { label: "Chop", text: "Use a pickaxe on rocks.", ok: false };
      return { label: "Chop", text: "Nothing to chop.", ok: false };
    case "pickaxe":
      if (t.obstacle && ROCKS.includes(t.obstacle)) return { label: "Break", text: swings(t, def, "Break"), ok: true };
      if (t.tilled && !t.crop) return { label: "Un-till", text: "Flatten this tilled spot.", ok: true };
      return { label: "Break", text: "Nothing to break.", ok: false };
    case "shovel":
      if (!isGarden) return { label: "Dig", text: "Dig a test hole in the garden.", ok: false };
      if (t.obstacle || t.crop) return { label: "Dig", text: "Find an open spot to dig.", ok: false };
      return { label: "Dig", text: "Shovel test: count earthworms and check soil crumbs (life + structure).", ok: true };
    case "ring":
      if (!isGarden) return { label: "Test", text: "Test the garden soil.", ok: false };
      return { label: "Test", text: "Infiltration test: time how fast water soaks in (water holding).", ok: true };
  }
  return { label: "", text: "", ok: false };
}

/** The farmer's animation for pressing Space here: a swing, a careful use, a pick-up, or none. */
export type ActionAnim = "swing" | "use" | "pickup";
const ANIMS: Record<string, ActionAnim> = {
  Till: "swing", Cut: "swing", Clear: "swing", Chop: "swing", Break: "swing", "Un-till": "swing",
  Water: "use", Refill: "use", Plant: "use", Apply: "use", Test: "use", Build: "use", Dig: "use",
  Harvest: "pickup", Observe: "pickup", Look: "pickup",
};

export function actionAnim(state: WorldState): ActionAnim | null {
  const p = previewAction(state);
  return p.ok ? ANIMS[p.label] ?? null : null;
}
