/** The seed bag: crops you can plant, what each takes from the soil, and what it gives back. */

export type CropId = "corn" | "tomato" | "potato" | "beans" | "carrot" | "wheat" | "squash" | "sunflower" | "buckwheat" | "clover";

export type CropFamily = "grass" | "nightshade" | "legume" | "root" | "squash" | "aster" | "knotweed";

export const FAMILY_LABEL: Record<CropFamily, string> = {
  grass: "Grass family",
  nightshade: "Nightshade family",
  legume: "Legume (bean) family",
  root: "Carrot family",
  squash: "Squash family",
  aster: "Sunflower family",
  knotweed: "Buckwheat family",
};

export interface Crop {
  id: CropId;
  name: string;
  icon: string;
  family: CropFamily;
  /** Price of the seed packet. */
  seedCost: number;
  /** Harvest value compared with an average crop (1 = average). */
  value: number;
  /** Nutrients the crop pulls out of the soil over a season (0–100 scale). */
  nutrientUse: number;
  /** What the crop adds back to the soil over a season. */
  gives: { om?: number; nutrients?: number; structure?: number; life?: number };
  /** Big leaves or dense growth that cover the soil like mulch. */
  coversSoil?: boolean;
  takes: string;
  givesText: string;
}

export const CROPS: Record<CropId, Crop> = {
  corn: {
    id: "corn", name: "Corn", icon: "🌽", family: "grass", seedCost: 4, value: 1.2, nutrientUse: 9,
    gives: { om: 1 },
    takes: "A heavy feeder. Pulls lots of nitrogen out of the soil.",
    givesText: "Stalks and roots left behind add a little organic matter.",
  },
  tomato: {
    id: "tomato", name: "Tomatoes", icon: "🍅", family: "nightshade", seedCost: 6, value: 1.5, nutrientUse: 9,
    gives: {},
    takes: "A heavy feeder. Needs lots of nitrogen, phosphorus, potassium, and calcium.",
    givesText: "Not much for the soil, but tomatoes sell for the most.",
  },
  potato: {
    id: "potato", name: "Potatoes", icon: "🥔", family: "nightshade", seedCost: 5, value: 1.2, nutrientUse: 7,
    gives: { structure: -3 },
    takes: "Uses lots of potassium to grow big tubers.",
    givesText: "Nothing. Digging up the potatoes breaks apart soil crumbs.",
  },
  beans: {
    id: "beans", name: "Beans", icon: "🫘", family: "legume", seedCost: 3, value: 0.9, nutrientUse: 2,
    gives: { nutrients: 6, life: 2 },
    takes: "Very little. Beans make their own nitrogen.",
    givesText: "Adds nitrogen! Bacteria in little root bumps (nodules) pull nitrogen from the air into the soil.",
  },
  carrot: {
    id: "carrot", name: "Carrots", icon: "🥕", family: "root", seedCost: 2, value: 1, nutrientUse: 4,
    gives: { structure: 2 },
    takes: "A light feeder. Needs a little potassium.",
    givesText: "Long taproots push through packed soil and leave channels for air and water.",
  },
  wheat: {
    id: "wheat", name: "Wheat", icon: "🌾", family: "grass", seedCost: 2, value: 0.8, nutrientUse: 5,
    gives: { om: 2, structure: 1 },
    takes: "Some nitrogen.",
    givesText: "Straw left on the field adds organic matter, and a mat of fine roots holds soil in place.",
  },
  squash: {
    id: "squash", name: "Squash", icon: "🎃", family: "squash", seedCost: 4, value: 1.1, nutrientUse: 6,
    gives: { life: 1 }, coversSoil: true,
    takes: "A medium feeder.",
    givesText: "Giant leaves shade the ground like a living mulch: fewer weeds and less erosion.",
  },
  sunflower: {
    id: "sunflower", name: "Sunflowers", icon: "🌻", family: "aster", seedCost: 2, value: 0.8, nutrientUse: 4,
    gives: { structure: 3, life: 1 },
    takes: "A light feeder.",
    givesText: "Deep taproots break up hard layers and pull up nutrients from deep down. Bees love them.",
  },
  buckwheat: {
    id: "buckwheat", name: "Buckwheat", icon: "🌸", family: "knotweed", seedCost: 2, value: 0.6, nutrientUse: 2,
    gives: { om: 2, nutrients: 2 }, coversSoil: true,
    takes: "Very little. Grows well in poor soil.",
    givesText: "Grows so fast it smothers weeds, unlocks phosphorus for the next crop, and adds organic matter.",
  },
  clover: {
    id: "clover", name: "Clover (cover crop)", icon: "🍀", family: "legume", seedCost: 1, value: 0, nutrientUse: 1,
    gives: { nutrients: 7, om: 3, life: 3, structure: 2 }, coversSoil: true,
    takes: "Almost nothing. It's grown to feed the soil, not to sell.",
    givesText: "A cover crop: roots hold the soil, root nodules add nitrogen, and digging it in (green manure) adds organic matter.",
  },
};

export const CROP_ORDER: CropId[] = ["clover", "beans", "buckwheat", "carrot", "wheat", "sunflower", "squash", "corn", "potato", "tomato"];
