import type { CropFamily, CropId } from "@/game/crops";
import type { GameSettings } from "./settings";
import type { DayWeather } from "./weather";

export type Season = "Spring" | "Summer" | "Fall" | "Winter";
export type WeatherId = "sunny" | "cloudy" | "rain" | "storm" | "heat" | "fog" | "frost" | "snow";
export type Ground = "grass" | "farm" | "path" | "water" | "sand" | "forest";
export type Obstacle = "stone" | "stick" | "stump" | "tree" | "log" | null;
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
}

export type BuildingKind =
  | "house" | "store" | "shippingBin"
  | "composter" | "rainBarrel" | "beehive" | "birdHouse" | "bugHotel" | "scarecrow"
  | "greenhouse" | "fence" | "flowerBed" | "pathStone";

export interface Building {
  id: string;
  kind: BuildingKind;
  x: number;
  y: number;
  /** Building-specific data: compost contents, water stored, honey ready, etc. */
  data: { fiber?: number; startedDay?: number; ready?: number; water?: number; honeyDay?: number };
}

export interface Slot {
  item: string;
  qty: number;
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
  /** Which farmer model you picked (see avatars.ts). Older saves don't have one. */
  avatar?: string;
}
