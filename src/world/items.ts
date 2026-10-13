import { CROPS, type CropId } from "@/game/crops";
import type { BuildingKind, Season } from "./types";

/** How each crop behaves in the world: seasons, days to grow, prices. */
export interface WorldCrop {
  id: CropId;
  seasons: Season[];
  days: number;
  /** Days to regrow after harvest, for crops that keep producing. */
  regrow?: number;
  seedPrice: number;
  sellPrice: number;
  /** Survives frost outdoors. */
  hardy?: boolean;
  /** Cover crop: dug into the soil instead of sold. */
  cover?: boolean;
}

export const WORLD_CROPS: Record<CropId, WorldCrop> = {
  clover: { id: "clover", seasons: ["Spring", "Summer", "Fall"], days: 4, seedPrice: 8, sellPrice: 0, hardy: true, cover: true },
  beans: { id: "beans", seasons: ["Spring", "Summer"], days: 5, regrow: 3, seedPrice: 25, sellPrice: 20 },
  buckwheat: { id: "buckwheat", seasons: ["Spring", "Summer", "Fall"], days: 3, seedPrice: 10, sellPrice: 14 },
  carrot: { id: "carrot", seasons: ["Spring", "Fall"], days: 4, seedPrice: 15, sellPrice: 32, hardy: true },
  wheat: { id: "wheat", seasons: ["Spring", "Fall"], days: 4, seedPrice: 10, sellPrice: 24, hardy: true },
  potato: { id: "potato", seasons: ["Spring"], days: 5, seedPrice: 30, sellPrice: 62 },
  sunflower: { id: "sunflower", seasons: ["Summer", "Fall"], days: 6, seedPrice: 20, sellPrice: 48 },
  squash: { id: "squash", seasons: ["Summer", "Fall"], days: 6, seedPrice: 30, sellPrice: 72 },
  corn: { id: "corn", seasons: ["Summer"], days: 7, regrow: 4, seedPrice: 35, sellPrice: 45 },
  tomato: { id: "tomato", seasons: ["Summer"], days: 7, regrow: 3, seedPrice: 45, sellPrice: 38 },
};

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
  /** Breaks organic certification when used. */
  notOrganic?: boolean;
}

const tools: ItemDef[] = [
  { id: "hoe", name: "Hoe", icon: "⛏️", kind: "tool", desc: "Till soil so seeds can be planted. Tilling breaks up soil crumbs, so till only where you'll plant." },
  { id: "can", name: "Watering Can", icon: "🚿", kind: "tool", desc: "Water tilled soil. Refill at the pond or a rain barrel." },
  { id: "scythe", name: "Scythe", icon: "🌾", kind: "tool", desc: "Cut weeds. You get plant fiber for the compost bin." },
  { id: "axe", name: "Axe", icon: "🪓", kind: "tool", desc: "Chop sticks and stumps into wood." },
  { id: "pickaxe", name: "Pickaxe", icon: "🔨", kind: "tool", desc: "Break stones. Also un-tills a tile." },
  { id: "shovel", name: "Shovel", icon: "🕳️", kind: "tool", desc: "Dig a test hole: reveals soil life and structure (the shovel test)." },
  { id: "ring", name: "Infiltration Ring", icon: "💧", kind: "tool", desc: "Time how fast water soaks in: reveals water holding." },
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
  desc: `${w.seasons.join(", ")} · ${w.days} days${w.regrow ? `, regrows every ${w.regrow}` : ""}. Takes: ${CROPS[w.id].takes} Gives back: ${CROPS[w.id].givesText}`,
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

export const ITEMS: Record<string, ItemDef> = Object.fromEntries(
  [...tools, ...amendments, ...materials, ...kits, ...seeds, ...produce].map((i) => [i.id, i]),
);

export function item(id: string): ItemDef {
  const i = ITEMS[id];
  if (!i) throw new Error(`Unknown item ${id}`);
  return i;
}

export const UPGRADES = {
  bigCan: { id: "bigCan", name: "Copper Watering Can", icon: "🚿", price: 250, desc: "Holds 40 waterings instead of 20." },
};
