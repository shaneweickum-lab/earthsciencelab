import { CROPS, type CropId } from "@/game/crops";
import type { BuildingKind, Grade, Season } from "./types";

/** How each crop behaves in the world: seasons, days to grow, temperature needs, prices. */
export interface WorldCrop {
  id: CropId;
  /** Seasons it can be planted and grow outdoors (the "Planting seasons" feature). */
  seasons: Season[];
  /** Typical days from seed to harvest on seed packets and extension guides (at 30-day months). */
  realDays: number;
  /** Days between pickings, for crops that keep producing. */
  regrowDays?: number;
  /** Cool-season crops like it mild; warm-season crops need warm soil and air. */
  type: "cool" | "warm";
  /** The overnight low (°F) that kills it outdoors (the "Frost & snow" feature). */
  killF: number;
  seedPrice: number;
  sellPrice: number;
  /** How many you harvest from one tile at grade C (a seeded roll in this range). */
  yield: [number, number];
  /** Cover crop: dug into the soil instead of sold. */
  cover?: boolean;
}

export const WORLD_CROPS: Record<CropId, WorldCrop> = {
  clover: { id: "clover", seasons: ["Spring", "Summer", "Fall"], realDays: 60, type: "cool", killF: 20, seedPrice: 8, sellPrice: 0, yield: [0, 0], cover: true },
  beans: { id: "beans", seasons: ["Spring", "Summer", "Fall"], realDays: 55, regrowDays: 7, type: "warm", killF: 32, seedPrice: 25, sellPrice: 20, yield: [2, 5] },
  buckwheat: { id: "buckwheat", seasons: ["Spring", "Summer", "Fall"], realDays: 70, type: "warm", killF: 33, seedPrice: 10, sellPrice: 14, yield: [2, 4] },
  carrot: { id: "carrot", seasons: ["Spring", "Summer", "Fall"], realDays: 70, type: "cool", killF: 25, seedPrice: 15, sellPrice: 32, yield: [3, 6] },
  wheat: { id: "wheat", seasons: ["Spring", "Summer", "Fall"], realDays: 100, type: "cool", killF: 22, seedPrice: 10, sellPrice: 24, yield: [2, 4] },
  potato: { id: "potato", seasons: ["Spring", "Summer"], realDays: 90, type: "cool", killF: 30, seedPrice: 30, sellPrice: 62, yield: [3, 8] },
  sunflower: { id: "sunflower", seasons: ["Spring", "Summer", "Fall"], realDays: 80, type: "warm", killF: 32, seedPrice: 20, sellPrice: 48, yield: [1, 3] },
  squash: { id: "squash", seasons: ["Spring", "Summer", "Fall"], realDays: 100, type: "warm", killF: 32, seedPrice: 30, sellPrice: 72, yield: [1, 3] },
  corn: { id: "corn", seasons: ["Spring", "Summer"], realDays: 80, type: "warm", killF: 32, seedPrice: 35, sellPrice: 45, yield: [2, 4] },
  tomato: { id: "tomato", seasons: ["Spring", "Summer", "Fall"], realDays: 80, regrowDays: 7, type: "warm", killF: 32, seedPrice: 45, sellPrice: 38, yield: [3, 8] },
};

/** Game days to grow, scaled so crops fit the calendar: real days at 30-day months, shorter for shorter months. */
export function cropDays(id: CropId, daysPerMonth: number, regrow = false): number {
  const w = WORLD_CROPS[id];
  const real = regrow && w.regrowDays ? w.regrowDays : w.realDays;
  return Math.max(regrow ? 1 : 2, Math.round((real * daysPerMonth) / 30));
}

/**
 * How well a crop grows at a daily average temperature (°F), 0–1.
 * Cool-season crops grow best around 55–75°F and stop below 40°F; warm-season crops grow best
 * around 70–90°F and stop below 50°F. Both slow down in strong heat.
 */
export function tempFactor(type: WorldCrop["type"], meanF: number): number {
  const [stop, bestLo, bestHi, hot] = type === "cool" ? [40, 55, 75, 90] : [50, 70, 90, 100];
  if (meanF <= stop) return 0;
  if (meanF < bestLo) return (meanF - stop) / (bestLo - stop);
  if (meanF <= bestHi) return 1;
  return Math.max(0.3, 1 - ((meanF - bestHi) / (hot - bestHi)) * 0.7);
}

export type ItemKind = "tool" | "seed" | "produce" | "amendment" | "material" | "kit";

export interface ItemDef {
  id: string;
  name: string;
  icon: string;
  kind: ItemKind;
  /** Store price, if the store sells it. */
  price?: number;
  /** What the store or shipping bin pays. */
  sell?: number;
  desc: string;
  crop?: CropId;
  building?: BuildingKind;
  /** A picture icon in public/icons (rendered from the game's models), used instead of the emoji when present. */
  image?: string;
  /** Breaks organic certification when used. */
  notOrganic?: boolean;
}

const tools: ItemDef[] = [
  { id: "hoe", name: "Hoe", icon: "⛏️", kind: "tool", desc: "Till soil so seeds can be planted. Tilling breaks up soil crumbs, so till only where you'll plant." },
  { id: "can", name: "Watering Can", icon: "🚿", kind: "tool", desc: "Water tilled soil. Refill at the pond or a rain barrel." },
  { id: "scythe", name: "Scythe", icon: "🌾", kind: "tool", desc: "Cut weeds. You get plant fiber for the compost bin." },
  { id: "axe", name: "Axe", icon: "🪓", kind: "tool", desc: "Chop sticks and stumps into wood." },
  { id: "pickaxe", name: "Pickaxe", icon: "🔨", kind: "tool", desc: "Break stones. Also un-tills a tile." },
  { id: "shovel", name: "Shovel", icon: "🕳️", kind: "tool", price: 60, desc: "Dig a test hole: reveals soil life and structure (the shovel test)." },
  { id: "ring", name: "Infiltration Ring", icon: "💧", kind: "tool", price: 45, desc: "Time how fast water soaks in: reveals water holding." },
];

const amendments: ItemDef[] = [
  { id: "labKit", name: "Lab Test Kit", icon: "🧪", kind: "amendment", price: 12, desc: "Mail a sample to the lab: reveals organic matter, nutrients, and pH." },
  { id: "compost", name: "Compost", icon: "🍂", kind: "amendment", price: 20, sell: 6, desc: "Adds organic matter, soil life, and slow-release nutrients." },
  { id: "mulch", name: "Straw Mulch", icon: "🟨", kind: "amendment", price: 6, desc: "Covers soil: keeps moisture in, blocks weeds, protects from storms." },
  { id: "lime", name: "Garden Lime", icon: "⚪", kind: "amendment", price: 18, desc: "Ground limestone. Raises pH in acidic soil." },
  { id: "biochar", name: "Biochar", icon: "⚫", kind: "amendment", price: 40, desc: "Charcoal full of tiny pores. Permanently helps soil hold water and nutrients." },
  { id: "synthFert", name: "Synthetic Fertilizer", icon: "⚗️", kind: "amendment", price: 15, notOrganic: true, desc: "Fast nutrients, but not organic: using it ends your organic certification, and extra washes away." },
];

const materials: ItemDef[] = [
  { id: "fiber", name: "Plant Fiber", icon: "🌿", kind: "material", sell: 1, desc: "From weeds. Feed it to a compost bin." },
  { id: "wood", name: "Wood", icon: "🪵", kind: "material", sell: 2, desc: "From sticks and stumps." },
  { id: "stone", name: "Stone", icon: "🪨", kind: "material", sell: 2, desc: "From rocks in the field." },
  { id: "honey", name: "Honey", icon: "🍯", kind: "produce", sell: 60, desc: "Made by bees from flower nectar." },
  { id: "egg", name: "Egg", icon: "🥚", kind: "produce", sell: 18, desc: "Fresh from your hens, who eat bugs and weed seeds all day." },
];

const kits: ItemDef[] = [
  { id: "kit_composter", name: "Compost Bin", icon: "🗑️", kind: "kit", price: 80, building: "composter", desc: "Add 5 plant fiber; decomposers turn it into compost in 2 days." },
  { id: "kit_rainBarrel", name: "Rain Barrel", icon: "🛢️", kind: "kit", price: 60, building: "rainBarrel", desc: "Catches rainwater to refill your watering can." },
  { id: "kit_beehive", name: "Beehive", icon: "🐝", kind: "kit", price: 150, building: "beehive", desc: "Bees pollinate nearby crops and make honey when flowers are close." },
  { id: "kit_birdHouse", name: "Bird House", icon: "🐦", kind: "kit", price: 50, building: "birdHouse", desc: "Birds eat caterpillars and other pests nearby." },
  { id: "kit_bugHotel", name: "Bug Hotel", icon: "🏨", kind: "kit", price: 50, building: "bugHotel", desc: "A home for ladybugs and other helpful insects that eat aphids." },
  { id: "kit_scarecrow", name: "Scarecrow", icon: "🧑‍🌾", kind: "kit", price: 40, building: "scarecrow", desc: "Keeps crows from eating seedlings nearby." },
  { id: "kit_greenhouse", name: "Greenhouse", icon: "🏡", kind: "kit", price: 1000, building: "greenhouse", desc: "Glass traps the sun's heat. Grow any crop in any season inside!" },
  { id: "kit_fence", name: "Fence", icon: "🚧", kind: "kit", price: 5, building: "fence", desc: "A wooden fence post." },
  { id: "kit_flowerBed", name: "Flower Bed", icon: "🌼", kind: "kit", price: 25, building: "flowerBed", desc: "Flowers feed bees and butterflies." },
  { id: "kit_pathStone", name: "Stepping Stone", icon: "⬜", kind: "kit", price: 2, building: "pathStone", desc: "A path tile. Walk on it, don't till it." },
  { id: "kit_well", name: "Well", icon: "🪣", kind: "kit", price: 150, building: "well", desc: "Reaches groundwater. Refill your watering can here any time." },
  { id: "kit_chickenCoop", name: "Chicken Coop", icon: "🐔", kind: "kit", price: 400, building: "chickenCoop", desc: "Hens lay eggs every morning, eat pests on nearby crops, and their manure becomes compost." },
  { id: "kit_smallBarn", name: "Small Barn", icon: "🛖", kind: "kit", price: 600, building: "smallBarn", desc: "Stores hay. Old hay becomes straw mulch you can collect each morning." },
];

const SEED_NAME: Record<CropId, string> = {
  clover: "Clover Seeds", beans: "Bean Seeds", buckwheat: "Buckwheat Seeds", carrot: "Carrot Seeds", wheat: "Wheat Seeds",
  potato: "Seed Potatoes", sunflower: "Sunflower Seeds", squash: "Squash Seeds", corn: "Corn Seeds", tomato: "Tomato Seeds",
};

const seeds: ItemDef[] = Object.values(WORLD_CROPS).map((w) => ({
  id: `seed_${w.id}`,
  name: SEED_NAME[w.id],
  icon: CROPS[w.id].icon,
  kind: "seed" as const,
  price: w.seedPrice,
  crop: w.id,
  desc: `${w.type === "cool" ? "Cool" : "Warm"}-season crop, ${w.realDays} days on the seed packet${w.regrowDays ? `, keeps producing` : ""}. Takes: ${CROPS[w.id].takes} Gives back: ${CROPS[w.id].givesText}`,
}));

const produce: ItemDef[] = Object.values(WORLD_CROPS)
  .filter((w) => !w.cover)
  .map((w) => ({
    id: `crop_${w.id}`,
    name: CROPS[w.id].name,
    icon: CROPS[w.id].icon,
    kind: "produce" as const,
    sell: w.sellPrice,
    crop: w.id,
    desc: `Fresh ${CROPS[w.id].name.toLowerCase()} from your garden.`,
  }));

/** Every item has a picture icon in public/icons, rendered from the game's models by `npm run icons`. */
export const ITEMS: Record<string, ItemDef> = Object.fromEntries(
  [...tools, ...amendments, ...materials, ...kits, ...seeds, ...produce].map((i) => [i.id, { ...i, image: `/icons/${i.id}.png` }]),
);

/** What the store or shipping bin pays for one item of a given grade, with the organic bonus. */
export function sellPrice(def: ItemDef, grade: Grade | undefined, organic: boolean): number {
  const g = def.kind === "produce" && grade ? GRADE_PRICE[grade] : 1;
  return Math.round((def.sell ?? 0) * g * (organic && def.kind === "produce" ? 1.25 : 1));
}

/** Price multipliers by grade (also in grades.ts, kept here to avoid an import cycle). */
export const GRADE_PRICE: Record<Grade, number> = { E: 0.5, D: 0.75, C: 1, B: 1.25, A: 1.6, S: 2.2 };

export function item(id: string): ItemDef {
  const i = ITEMS[id];
  if (!i) throw new Error(`Unknown item ${id}`);
  return i;
}

/** Science tools the store only sells after the quest that introduces them (quests.ts). */
export const SHOP_UNLOCKS: Record<string, string> = { shovel: "dig-deeper", labKit: "feed-the-soil", ring: "soak-it-up" };

export const UPGRADES = {
  bigCan: { id: "bigCan", name: "Copper Watering Can", icon: "🚿", image: "/icons/bigCan.png", price: 250, desc: "Holds 40 waterings instead of 20." },
};
