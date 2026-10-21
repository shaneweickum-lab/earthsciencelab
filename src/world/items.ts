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

export type ItemKind = "tool" | "seed" | "produce" | "amendment" | "material" | "kit" | "food" | "utensil" | "fish";

/** What a tool does when you use it. Axes and pickaxes come in tiers; the rest have one kind. */
export type ToolUse = "hoe" | "can" | "scythe" | "axe" | "pickaxe" | "shovel" | "ring" | "rod";
export type Tier = "base" | "copper" | "bronze" | "iron" | "gold" | "mithril";

/**
 * Tool tiers: power is how much each swing breaks (so how fast you clear land), durability how
 * many uses before it wears out. Gold is soft: fast but quick to wear out.
 */
export const TIERS: Record<Tier, { name: string; power: number; durability: number; color: string }> = {
  base: { name: "", power: 1, durability: 80, color: "#9aa0a6" },
  copper: { name: "Copper", power: 2, durability: 120, color: "#c8753d" },
  bronze: { name: "Bronze", power: 3, durability: 180, color: "#b8893a" },
  iron: { name: "Iron", power: 4, durability: 260, color: "#d4d8dc" },
  gold: { name: "Gold", power: 6, durability: 90, color: "#f2c230" },
  mithril: { name: "Mithril", power: 8, durability: 500, color: "#7fd6e8" },
};
export const TIER_ORDER: Tier[] = ["base", "copper", "bronze", "iron", "gold", "mithril"];

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
  /** Tools: what it does, its tier, and how many uses it lasts. */
  tool?: { use: ToolUse; tier: Tier; durability: number };
  /** Food: how much energy eating it gives back. */
  energy?: number;
}

const tool = (use: ToolUse, durability: number, tier: Tier = "base") => ({ use, tier, durability });

/** A tiered axe or pickaxe, made at the grinder from metal bars. */
function tiered(use: "axe" | "pickaxe", tier: Tier): ItemDef {
  const t = TIERS[tier];
  const base = use === "axe" ? "Axe" : "Pickaxe";
  const what = use === "axe" ? "trees, logs, and stumps" : "stones and ore";
  return {
    id: `${use}_${tier}`, name: `${t.name} ${base}`, icon: use === "axe" ? "🪓" : "⛏️", kind: "tool", tool: tool(use, t.durability, tier),
    desc: `Breaks ${what} ${t.power}× as fast as a basic ${base.toLowerCase()}. Lasts about ${t.durability} uses.${tier === "gold" ? " Gold is soft, so it wears out fast." : ""}`,
  };
}

const tools: ItemDef[] = [
  { id: "hoe", name: "Hoe", icon: "⛏️", kind: "tool", price: 40, tool: tool("hoe", 150), desc: "Till soil so seeds can be planted. Tilling breaks up soil crumbs, so till only where you'll plant." },
  { id: "can", name: "Watering Can", icon: "🚿", kind: "tool", price: 40, tool: tool("can", 200), desc: "Water tilled soil. Refill at the pond or a rain barrel." },
  { id: "scythe", name: "Scythe", icon: "🌾", kind: "tool", price: 30, tool: tool("scythe", 150), desc: "Cut weeds. You get plant fiber for the compost bin." },
  { id: "axe", name: "Axe", icon: "🪓", kind: "tool", price: 50, tool: tool("axe", TIERS.base.durability), desc: "Chop sticks, logs, stumps, and trees into wood. Bigger things take more swings." },
  { id: "pickaxe", name: "Pickaxe", icon: "🔨", kind: "tool", price: 50, tool: tool("pickaxe", TIERS.base.durability), desc: "Break stones. Also un-tills a tile." },
  { id: "shovel", name: "Shovel", icon: "🕳️", kind: "tool", price: 60, tool: tool("shovel", 100), desc: "Dig a test hole: reveals soil life and structure (the shovel test)." },
  { id: "ring", name: "Infiltration Ring", icon: "💧", kind: "tool", price: 45, tool: tool("ring", 100), desc: "Time how fast water soaks in: reveals water holding." },
  { id: "rod", name: "Fishing Rod", icon: "🎣", kind: "tool", price: 120, tool: tool("rod", 120), desc: "Cast it into the river, a pond, or the sea. Different fish bite in different places, seasons, and times of day. Kai sells them at the fishing hut." },
  ...TIER_ORDER.slice(1).flatMap((t) => [tiered("axe", t), tiered("pickaxe", t)]),
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
  // Crafting materials.
  { id: "sticks", name: "Sticks", icon: "🥢", kind: "material", sell: 1, desc: "Split from wood at a workbench. Handles for tools." },
  { id: "refinedFiber", name: "Refined Fiber", icon: "🧶", kind: "material", sell: 2, desc: "Plant fiber spun smooth and strong on a spinning wheel." },
  { id: "rope", name: "Rope", icon: "🪢", kind: "material", sell: 12, desc: "Refined fiber twisted into rope. Lashes tool heads to handles." },
  { id: "copperBar", name: "Copper Bar", icon: "🟧", kind: "material", sell: 30, desc: "Smelted from copper ore. Makes copper tools." },
  { id: "bronzeBar", name: "Bronze Bar", icon: "🟫", kind: "material", sell: 40, desc: "An alloy of copper and tin, harder than either one alone." },
  { id: "ironBar", name: "Iron Bar", icon: "⬜", kind: "material", sell: 60, desc: "Smelted from iron ore. Tough and long-lasting." },
  { id: "goldBar", name: "Gold Bar", icon: "🟨", kind: "material", sell: 140, desc: "Pure gold. Beautiful, valuable, and soft." },
  { id: "mithrilBar", name: "Mithril Bar", icon: "🟦", kind: "material", sell: 320, desc: "Glows faintly blue. The best tools are made from it." },
  // Ores from the mine. Smelt them into bars at a furnace.
  { id: "copperOre", name: "Copper Ore", icon: "🟠", kind: "material", sell: 5, desc: "Green-streaked rock with copper in it. Found near the top of the mine." },
  { id: "tinOre", name: "Tin Ore", icon: "⚪", kind: "material", sell: 5, desc: "Heavy, dark rock with tin in it. Melt it with copper to make bronze." },
  { id: "ironOre", name: "Iron Ore", icon: "🟤", kind: "material", sell: 10, desc: "Rusty red rock full of iron. Found from floor 5 down." },
  { id: "goldOre", name: "Gold Ore", icon: "🟡", kind: "material", sell: 25, desc: "Quartz with flecks of real gold. Found from floor 10 down." },
  { id: "mithrilOre", name: "Mithril Ore", icon: "🔷", kind: "material", sell: 60, desc: "A glowing blue ore from the deepest floors. (Mithril comes from stories, not real geology.)" },
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
  { id: "kit_workbench", name: "Workbench", icon: "🪚", kind: "kit", building: "workbench", desc: "Craft sticks, chests, and the other workstations." },
  { id: "kit_grinder", name: "Grinder", icon: "⚙️", kind: "kit", building: "grinder", desc: "Sharpen and fit tool heads: makes axes, pickaxes, and other tools." },
  { id: "kit_spinningWheel", name: "Spinning Wheel", icon: "🧵", kind: "kit", building: "spinningWheel", desc: "Spin plant fiber into refined fiber, and refined fiber into rope." },
  { id: "kit_furnace", name: "Furnace", icon: "🔥", kind: "kit", building: "furnace", desc: "Smelts ore into metal bars, burning wood for heat." },
  { id: "kit_chest", name: "Storage Chest", icon: "🧰", kind: "kit", building: "chest", desc: "Twenty slots of storage. Put it anywhere on your farm." },
  { id: "kit_stove", name: "Stove", icon: "🍳", kind: "kit", price: 300, building: "stove", desc: "Cook on it: fry with a pan, boil and stew with a pot." },
  { id: "kit_oven", name: "Oven", icon: "🥖", kind: "kit", price: 450, building: "oven", desc: "Bakes bread, potatoes, pizza, and pie. Set it beside a stove for a full kitchen." },
  { id: "kit_smallBarn", name: "Small Barn", icon: "🛖", kind: "kit", price: 600, building: "smallBarn", desc: "Stores hay. Old hay becomes straw mulch you can collect each morning." },
];

/** Kitchen utensils: carry them in your bag, and recipes that need them can use them. */
const utensils: ItemDef[] = [
  { id: "knife", name: "Kitchen Knife", icon: "🔪", kind: "utensil", price: 60, desc: "Chops vegetables. Many recipes start with a knife." },
  { id: "pan", name: "Frying Pan", icon: "🍳", kind: "utensil", price: 80, desc: "Fry and toast on a stove." },
  { id: "pot", name: "Cooking Pot", icon: "🍲", kind: "utensil", price: 100, desc: "Boil and simmer soups and stews on a stove." },
];

/** Food you cook from your harvest. Eat it (select it and use it) to get energy back. */
const foods: ItemDef[] = [
  { id: "flour", name: "Flour", icon: "🌾", kind: "material", sell: 40, desc: "Wheat ground fine at a grinder. Bread, pizza, and pie start here." },
  { id: "carrotSticks", name: "Carrot Sticks", icon: "🥕", kind: "food", energy: 15, sell: 40, desc: "Crunchy, sweet, and full of vitamin A." },
  { id: "salad", name: "Garden Salad", icon: "🥗", kind: "food", energy: 30, sell: 85, desc: "Tomatoes and carrots, fresh from the garden." },
  { id: "toastedSeeds", name: "Toasted Sunflower Seeds", icon: "🌻", kind: "food", energy: 20, sell: 60, desc: "A handful of seeds, toasted in a pan. Packed with healthy fats." },
  { id: "friedEgg", name: "Fried Egg", icon: "🍳", kind: "food", energy: 25, sell: 30, desc: "Heat turns the clear egg white solid: the proteins unfold and tangle." },
  { id: "cornOnCob", name: "Corn on the Cob", icon: "🌽", kind: "food", energy: 25, sell: 55, desc: "Boiled sweet corn. Each kernel is a seed." },
  { id: "bakedPotato", name: "Baked Potato", icon: "🥔", kind: "food", energy: 35, sell: 80, desc: "Potatoes store the plant's energy as starch. Now it's yours." },
  { id: "fries", name: "Fries", icon: "🍟", kind: "food", energy: 35, sell: 85, desc: "Potatoes cut into sticks and fried golden." },
  { id: "tomatoSoup", name: "Tomato Soup", icon: "🍅", kind: "food", energy: 40, sell: 95, desc: "Warm and tangy. Simmered slowly in a pot." },
  { id: "pancakes", name: "Buckwheat Pancakes", icon: "🥞", kind: "food", energy: 45, sell: 45, desc: "Buckwheat isn't wheat at all; it's related to rhubarb." },
  { id: "beanStew", name: "Bean Stew", icon: "🫘", kind: "food", energy: 60, sell: 160, desc: "Beans, carrots, and potatoes. Beans are full of protein, thanks to the nitrogen their roots fix." },
  { id: "bread", name: "Bread", icon: "🍞", kind: "food", energy: 40, sell: 100, desc: "Yeast eats sugar in the dough and breathes out bubbles that make it rise." },
  { id: "sandwich", name: "Tomato Sandwich", icon: "🥪", kind: "food", energy: 55, sell: 150, desc: "Fresh bread and sliced tomato. Simple and perfect." },
  { id: "pizza", name: "Garden Pizza", icon: "🍕", kind: "food", energy: 70, sell: 170, desc: "Flour, tomato, and sweet corn, baked hot." },
  { id: "panFish", name: "Pan-Fried Fish", icon: "🐟", kind: "food", energy: 45, sell: 110, desc: "Fish is full of protein and healthy oils. Pan-fried with a little salt." },
  { id: "fishStew", name: "Fish Stew", icon: "🍲", kind: "food", energy: 70, sell: 170, desc: "Fish, potatoes, and carrots, simmered slowly. Kai's favorite." },
  { id: "bakedFish", name: "Baked Fish", icon: "🐟", kind: "food", energy: 40, sell: 95, desc: "Baked whole in the oven, the way Kai's grandmother made it." },
  { id: "fishTacos", name: "Fish Tacos", icon: "🌮", kind: "food", energy: 65, sell: 160, desc: "Crispy fish with corn and fresh tomato." },
  { id: "pie", name: "Squash Pie", icon: "🥧", kind: "food", energy: 80, sell: 230, desc: "Squash, flour, an egg, and honey. A harvest feast." },
];

export type Water = "river" | "pond" | "sea";

/** A fish (or other catch): where it lives, when it bites, and how often. */
export interface Catch {
  id: string;
  water: Water;
  /** Seasons it bites (all, when missing). */
  seasons?: Season[];
  /** Hours it bites, as [from, to) on a 24-hour clock (to may wrap past midnight). All day when missing. */
  hours?: [number, number];
  /** How likely it is compared with the others that could bite. */
  weight: number;
}

/** What you can catch, from Kai's notes. */
export const CATCHES: Catch[] = [
  { id: "brookTrout", water: "river", seasons: ["Spring", "Fall", "Winter"], weight: 3 },
  { id: "rainbowTrout", water: "river", seasons: ["Spring", "Summer", "Fall"], weight: 3 },
  { id: "catfish", water: "river", hours: [19, 5], weight: 3 },
  { id: "salmon", water: "river", seasons: ["Fall"], weight: 2 },
  { id: "bluegill", water: "pond", weight: 4 },
  { id: "perch", water: "pond", seasons: ["Fall", "Winter", "Spring"], weight: 3 },
  { id: "bass", water: "pond", seasons: ["Spring", "Summer", "Fall"], hours: [5, 10], weight: 2 },
  { id: "flounder", water: "sea", weight: 3 },
  { id: "mackerel", water: "sea", seasons: ["Summer", "Fall"], weight: 3 },
  { id: "stripedBass", water: "sea", seasons: ["Spring", "Fall"], weight: 2 },
  { id: "crab", water: "sea", seasons: ["Summer", "Fall"], weight: 2 },
  { id: "kelp", water: "sea", weight: 2 },
];

const fish: ItemDef[] = [
  { id: "brookTrout", name: "Brook Trout", icon: "🐟", kind: "fish", sell: 45, desc: "A speckled trout of cold, clear streams. It needs lots of oxygen, so it's a sign of a healthy river." },
  { id: "rainbowTrout", name: "Rainbow Trout", icon: "🐟", kind: "fish", sell: 55, desc: "Named for the pink stripe along its side. It eats insects that land on the water." },
  { id: "catfish", name: "Channel Catfish", icon: "🐟", kind: "fish", sell: 60, desc: "Its whiskers (barbels) taste the water, so it hunts in the dark. Bites at night." },
  { id: "salmon", name: "Chinook Salmon", icon: "🐟", kind: "fish", sell: 120, desc: "Swims up the river from the sea each fall to lay its eggs where it hatched." },
  { id: "bluegill", name: "Bluegill", icon: "🐟", kind: "fish", sell: 25, desc: "A little sunfish of warm ponds, with a dark blue patch on its gill cover." },
  { id: "perch", name: "Yellow Perch", icon: "🐟", kind: "fish", sell: 35, desc: "Swims in schools in cool water, striped like a little tiger." },
  { id: "bass", name: "Largemouth Bass", icon: "🐟", kind: "fish", sell: 80, desc: "The pond's top predator. It ambushes smaller fish from the weeds at dawn." },
  { id: "flounder", name: "Flounder", icon: "🐟", kind: "fish", sell: 50, desc: "A flatfish that lies on the sandy bottom. Both its eyes are on one side of its head!" },
  { id: "mackerel", name: "Mackerel", icon: "🐟", kind: "fish", sell: 40, desc: "A fast, shiny ocean fish that swims in huge schools in summer." },
  { id: "stripedBass", name: "Striped Bass", icon: "🐟", kind: "fish", sell: 90, desc: "Lives in the sea but swims into rivers to spawn in spring." },
  { id: "crab", name: "Blue Crab", icon: "🦀", kind: "fish", sell: 70, desc: "Walks sideways on the sea floor. Its back legs are shaped like paddles for swimming." },
  { id: "kelp", name: "Kelp", icon: "🌿", kind: "material", sell: 12, desc: "A giant seaweed. Dug into the soil, it adds potassium and trace minerals, like a natural fertilizer." },
  // In recipes, "any fish" means any fish you've caught.
  { id: "anyFish", name: "Any fish", icon: "🐟", kind: "material", desc: "Any fish you've caught works in this recipe." },
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
  [...tools, ...amendments, ...materials, ...kits, ...utensils, ...foods, ...fish, ...seeds, ...produce].map((i) => [i.id, { ...i, image: `/icons/${i.id}.png` }]),
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

export type Station = "workbench" | "grinder" | "spinningWheel" | "furnace" | "stove" | "oven";

export interface Recipe {
  /** The item made (and the recipe's id). */
  id: string;
  qty: number;
  /** Where it's made. Cooking can need a stove, an oven, or both side by side; knife-only food is made anywhere. */
  station?: Station;
  inputs: { item: string; qty: number }[];
  /** Food: the kitchen stations it needs (all within reach of the one you're at). */
  stations?: Station[];
  /** Food: utensils that must be in your bag. They aren't used up. */
  tools?: string[];
}

const r = (station: Station, id: string, inputs: [string, number][], qty = 1): Recipe => ({ id, qty, station, inputs: inputs.map(([item, n]) => ({ item, qty: n })) });
/** Furnaces burn wood for heat: more for metals that melt hotter. */
const smelt = (bar: string, ores: [string, number][], wood: number) => r("furnace", bar, [...ores, ["wood", wood]]);
const toolHead = (tier: Tier) => (tier === "base" ? ["stone", 3] : [`${tier}Bar`, 3]) as [string, number];

/** A dish: its ingredients, the utensils you need with you, and the stations it cooks on. */
const cook = (id: string, inputs: [string, number][], tools: string[], stations: Station[] = []): Recipe => ({
  id, qty: 1, inputs: inputs.map(([item, n]) => ({ item, qty: n })), tools, stations,
  ...(stations.length ? { station: stations[0] } : {}),
});

/** What you can cook, from the simplest (a knife and a carrot) to a full kitchen. */
export const COOKING: Recipe[] = [
  cook("carrotSticks", [["crop_carrot", 1]], ["knife"]),
  cook("salad", [["crop_tomato", 1], ["crop_carrot", 1]], ["knife"]),
  cook("toastedSeeds", [["crop_sunflower", 1]], ["pan"], ["stove"]),
  cook("friedEgg", [["egg", 1]], ["pan"], ["stove"]),
  cook("cornOnCob", [["crop_corn", 1]], ["pot"], ["stove"]),
  cook("bakedPotato", [["crop_potato", 1]], [], ["oven"]),
  cook("fries", [["crop_potato", 1]], ["knife", "pan"], ["stove"]),
  cook("tomatoSoup", [["crop_tomato", 2]], ["knife", "pot"], ["stove"]),
  cook("pancakes", [["crop_buckwheat", 1], ["egg", 1]], ["pan"], ["stove"]),
  cook("beanStew", [["crop_beans", 2], ["crop_carrot", 1], ["crop_potato", 1]], ["knife", "pot"], ["stove"]),
  cook("bread", [["flour", 2]], [], ["oven"]),
  cook("sandwich", [["bread", 1], ["crop_tomato", 1]], ["knife"]),
  cook("pizza", [["flour", 1], ["crop_tomato", 1], ["crop_corn", 1]], ["knife"], ["oven"]),
  cook("pie", [["crop_squash", 1], ["flour", 1], ["egg", 1], ["honey", 1]], ["knife"], ["stove", "oven"]),
  cook("panFish", [["anyFish", 1]], ["knife", "pan"], ["stove"]),
  cook("fishStew", [["anyFish", 1], ["crop_potato", 1], ["crop_carrot", 1]], ["knife", "pot"], ["stove"]),
  cook("bakedFish", [["anyFish", 1]], [], ["oven"]),
  cook("fishTacos", [["anyFish", 1], ["crop_corn", 1], ["crop_tomato", 1]], ["knife", "pan"], ["stove"]),
];

/** What each station makes. */
export const RECIPES: Recipe[] = [
  r("workbench", "sticks", [["wood", 1]], 2),
  r("workbench", "kit_chest", [["wood", 25]]),
  r("workbench", "kit_grinder", [["stone", 15], ["wood", 10]]),
  r("workbench", "kit_spinningWheel", [["wood", 20], ["sticks", 4]]),
  r("workbench", "kit_furnace", [["stone", 25], ["copperOre", 5]]),
  r("spinningWheel", "refinedFiber", [["fiber", 3]]),
  r("spinningWheel", "rope", [["refinedFiber", 8]]),
  smelt("copperBar", [["copperOre", 5]], 1),
  // Bronze is an alloy: copper and tin melted together.
  smelt("bronzeBar", [["copperOre", 3], ["tinOre", 2]], 1),
  smelt("ironBar", [["ironOre", 5]], 2),
  smelt("goldBar", [["goldOre", 5]], 2),
  smelt("mithrilBar", [["mithrilOre", 5]], 3),
  r("grinder", "hoe", [["sticks", 2], ["stone", 3]]),
  r("grinder", "scythe", [["sticks", 2], ["stone", 2], ["rope", 1]]),
  r("grinder", "can", [["copperBar", 2]]),
  r("grinder", "flour", [["crop_wheat", 2]]),
  ...TIER_ORDER.flatMap((tier) => (["axe", "pickaxe"] as const).map((use) => r(
    "grinder", tier === "base" ? use : `${use}_${tier}`,
    [toolHead(tier), ["sticks", 2], ["rope", tier === "mithril" ? 2 : 1]],
  ))),
  ...COOKING,
];

/** Science tools the store only sells after the quest that introduces them (quests.ts). */
export const SHOP_UNLOCKS: Record<string, string> = {
  shovel: "dig-deeper", labKit: "feed-the-soil", ring: "soak-it-up",
  // Grandma's recipe card opens the kitchen; the oven comes once you're growing more.
  kit_stove: "recipe-card", kit_oven: "soak-it-up",
};

export const UPGRADES = {
  bigCan: { id: "bigCan", name: "Copper Watering Can", icon: "🚿", image: "/icons/bigCan.png", price: 250, desc: "Holds 40 waterings instead of 20." },
};
