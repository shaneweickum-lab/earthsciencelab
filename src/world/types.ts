import type { CropFamily, CropId } from "@/game/crops";
import type { GameSettings } from "./settings";
import type { DayWeather } from "./weather";

export type Season = "Spring" | "Summer" | "Fall" | "Winter";
export type WeatherId = "sunny" | "cloudy" | "rain" | "storm" | "heat" | "fog" | "frost" | "snow";
export type Ground = "grass" | "farm" | "path" | "water" | "sand" | "forest" | "cave" | "caveWall"
  // The valley: the river and sea (water too), mountain rock, and wooden planks on bridges and the dock.
  | "river" | "sea" | "rock" | "dock";
/** Rocks with ore in them, found in the mine. */
export type OreRock = "copperOre" | "tinOre" | "ironOre" | "goldOre" | "mithrilOre";
export type Obstacle = "stone" | "stick" | "stump" | "tree" | "log" | "sapling" | OreRock | null;
export type Dir = "up" | "down" | "left" | "right";

export interface SoilState {
  /** 0–100 scores, same scale as the classroom curriculum's soil model. */
  om: number;
  life: number;
  structure: number;
  /** Water-holding capacity (a soil property, not today's moisture). */
  water: number;
  nutrients: number;
  ph: number;
}

export interface CropInstance {
  id: CropId;
  /** 0–1 progress to harvest. */
  growth: number;
  /** Harvests already taken from a regrowing crop. */
  harvests: number;
  /** True once a crop has died (frost, drought, out of season). */
  dead: boolean;
  pests: boolean;
  /** Hours spent stressed (thirsty, waterlogged, weedy, or with pests), which lowers its grade. */
  stress?: number;
}

export interface Tile {
  ground: Ground;
  obstacle: Obstacle;
  weeds: boolean;
  tilled: boolean;
  /** Today's soil moisture, 0–100. */
  moisture: number;
  mulch: boolean;
  soil: SoilState;
  known: { lab: boolean; shovel: boolean; water: boolean };
  crop: CropInstance | null;
  lastFamily: CropFamily | null;
  familyStreak: number;
  /** Inside a greenhouse: no season limits, no frost, no rain. */
  greenhouse: boolean;
  /** Amendment points (compost, mulch, lime…) that raise the next harvest's grade. Used up at harvest. */
  boost?: number;
  /** Damage done so far to the obstacle here (see OBSTACLE_HP). */
  hits?: number;
  /** How high it stands: mountain terraces are 1 to 3 (missing means 0). */
  elev?: number;
  /** A trail step that climbs one terrace (you can walk up or down it). */
  ramp?: boolean;
  /** The day a felled tree's stump sprouts (or its sapling grows back into a tree). */
  regrow?: number;
}

export type BuildingKind =
  | "house" | "store" | "shippingBin"
  | "composter" | "rainBarrel" | "beehive" | "birdHouse" | "bugHotel" | "scarecrow"
  | "greenhouse" | "fence" | "flowerBed" | "pathStone" | "well" | "chickenCoop" | "smallBarn" | "chest"
  // Crafting stations.
  | "workbench" | "grinder" | "spinningWheel" | "furnace"
  // The kitchen: cook food on the stove, bake it in the oven.
  | "stove" | "oven"
  // Town buildings, landmarks, and props (not buildable by the player).
  | "extension" | "cottage" | "fountain" | "noticeBoard" | "field" | "lamp" | "prop" | "barn" | "silo" | "windmill" | "waterTower"
  // The mine: its entrance in town, and the ladders on each floor.
  | "mineEntrance" | "ladderUp" | "ladderDown"
  // The gates along Garden Lane, the market stalls, signposts, and Kai's fishing hut.
  | "gardenGate" | "marketStall" | "signpost" | "fishingHut";

/** Town buildings the player can't build, pick up, or build over. */
export const TOWN_KINDS: BuildingKind[] = [
  "house", "store", "shippingBin", "extension", "cottage", "fountain", "noticeBoard", "field", "lamp", "prop", "barn", "silo", "windmill", "waterTower",
  "mineEntrance", "ladderUp", "ladderDown", "gardenGate", "marketStall", "signpost", "fishingHut",
];

export interface Building {
  id: string;
  kind: BuildingKind;
  x: number;
  y: number;
  /** Quarter turns (0–3). On odd turns a building's width and depth swap. */
  rot?: number;
  /** Building-specific data: compost contents, water stored, honey ready, etc. */
  data: {
    fiber?: number; startedDay?: number; ready?: number; water?: number; honeyDay?: number;
    /** Chicken coop: eggs waiting, and the day manure was last composted. */
    eggs?: number; manureDay?: number;
    /** The garden a Garden Lane gate or market stall belongs to (yours is 0). */
    garden?: number;
    /** Town buildings: who lives or works here, and the sign over the door. */
    owner?: string; sign?: string;
    /** Props: which model to draw ("pack/name"). */
    model?: string;
    /** Storage chest: what's inside. */
    items?: (Slot | null)[];
  };
}

export type Grade = "E" | "D" | "C" | "B" | "A" | "S";

export interface Slot {
  item: string;
  qty: number;
  /** Quality grade of harvested produce. */
  grade?: Grade;
  /** Tools: uses left before it wears out (full when missing). */
  dur?: number;
}

export interface Critter {
  id: string;
  /** Journal entry id. */
  kind: string;
  x: number;
  y: number;
  /** Absolute game minute when it wanders off. */
  until: number;
}

export interface DayLog {
  day: number;
  earned: number;
  notes: string[];
}

export interface WorldState {
  version: number;
  seed: number;
  /** Absolute game minutes since the start (day 1 begins at minute 0). */
  minute: number;
  coins: number;
  organic: boolean;
  energy: number;
  maxEnergy: number;
  /** Watering can charges left. */
  water: number;
  canSize: number;
  player: { x: number; y: number; facing: Dir };
  inventory: (Slot | null)[];
  selected: number;
  tiles: Tile[];
  buildings: Building[];
  shipping: Slot[];
  critters: Critter[];
  journal: string[];
  /** Crops harvested so far (for badges). */
  harvests: number;
  /** Weather for each day, keyed by day number, generated as days arrive. */
  weather: Record<number, DayWeather>;
  log: DayLog | null;
  /** Short messages for the HUD feed. */
  messages: { text: string; at: number }[];
  introSeen: boolean;
  settings: GameSettings;
  /** Quests you've accepted and finished (see quests.ts). */
  quests?: import("./quests").QuestState;
  /** While you're underground: the mine floor you're on. The farm keeps growing up above. */
  mine?: MineFloor;
  /** The deepest mine floor reached, for the mine cart at the entrance. */
  deepest?: number;
  /** The farm plots you own (see PLOTS in map.ts). */
  plots?: number[];
  /** How many times you've done things the lessons count (weeds cut, spots tilled, nights slept, sales). */
  tally?: Record<string, number>;
  /** My Homestead: the furniture and garden decorations you've bought and where they stand. */
  homestead?: Homestead;
  /** Grandma Rosa's workbench has been found in the barn. */
  foundWorkbench?: boolean;
  /** Friendship with townsfolk, by NPC id. */
  friends?: Record<string, { points: number; talked?: number; gifted?: number; met?: boolean; stories?: number[] }>;
  /** Which farmer model you picked (see avatars.ts). Older saves don't have one. */
  avatar?: string;
  /** How far the next thing you build is turned (quarter turns). */
  placeRot?: number;
  /** What's for sale on your market stall in the town square. */
  stall?: Listing[];
}

/** Something for sale on a market stall: how many, and the price for each. */
export interface Listing {
  item: string;
  qty: number;
  grade?: Grade;
  price: number;
}

/** One floor of the mine: a small cave (MINE_W × MINE_H tiles), made fresh each time you go down. */
export interface MineFloor {
  floor: number;
  tiles: Tile[];
  /** The ladders: up (back to town, or the floor above) and, once found, down. */
  buildings: Building[];
  /** The rock hiding the ladder down (an index into tiles). */
  ladderAt: number;
}

/** Where a homestead decoration goes: inside the farmhouse or out in the front yard. */
export type DecorArea = "room" | "yard";

/** A decoration standing in the room or yard. `x, y` is its top-left cell; `rot` is quarter turns. */
export interface Placed {
  uid: number;
  item: string;
  x: number;
  y: number;
  rot: number;
}

export interface Homestead {
  room: Placed[];
  yard: Placed[];
  /** Decorations bought but not set out, by id. */
  stored: Record<string, number>;
  /** The next uid to hand out. */
  next: number;
}
