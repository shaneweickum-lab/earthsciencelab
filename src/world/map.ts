import { nextRandom } from "@/game/rng";
import type { Building, Ground, Obstacle, SoilState, Tile } from "./types";

export const W = 40;
export const H = 36;

export const idx = (x: number, y: number) => y * W + x;
export const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;

/** The farm field the player clears and plants. */
export const FARM = { x0: 10, y0: 13, x1: 27, y1: 28 };

export const BUILDING_SIZE: Record<Building["kind"], [number, number]> = {
  house: [5, 4], store: [5, 4], shippingBin: [1, 1],
  composter: [1, 1], rainBarrel: [1, 1], beehive: [1, 1], birdHouse: [1, 1], bugHotel: [1, 1], scarecrow: [1, 1],
  greenhouse: [5, 5], fence: [1, 1], flowerBed: [1, 1], pathStone: [1, 1],
};

/** Buildings you can walk over. */
export const WALKABLE_BUILDINGS: Building["kind"][] = ["pathStone", "flowerBed"];

/** Door tile for buildings you enter or use from the front (bottom center). */
export function doorOf(b: Building): { x: number; y: number } | null {
  const [w, h] = BUILDING_SIZE[b.kind];
  if (b.kind === "house" || b.kind === "store" || b.kind === "greenhouse") return { x: b.x + Math.floor(w / 2), y: b.y + h - 1 };
  return null;
}

/** Inner tiles of a greenhouse (plantable, sheltered). */
export function greenhouseInterior(b: Building): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let y = b.y + 1; y < b.y + 4; y++) for (let x = b.x + 1; x < b.x + 4; x++) out.push({ x, y });
  return out;
}

function degradedSoil(rand: () => number): SoilState {
  return {
    om: Math.round(16 + rand() * 10),
    life: Math.round(14 + rand() * 10),
    structure: Math.round(18 + rand() * 10),
    water: Math.round(26 + rand() * 8),
    nutrients: Math.round(30 + rand() * 14),
    ph: Math.round((5.5 + rand() * 0.6) * 10) / 10,
  };
}

function tile(ground: Ground, soil: SoilState, obstacle: Obstacle = null, weeds = false): Tile {
  return {
    ground, obstacle, weeds, tilled: false, moisture: 30, mulch: false, soil,
    known: { lab: false, shovel: false, water: false },
    crop: null, lastFamily: null, familyStreak: 0, greenhouse: false,
  };
}

export function createMap(seed: number): { tiles: Tile[]; buildings: Building[] } {
  let s = seed;
  const rand = () => {
    const [v, n] = nextRandom(s);
    s = n;
    return v;
  };
  const tiles: Tile[] = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const soil = degradedSoil(rand);
      const forest = y < 3 || x < 2 || x > W - 3 || y > H - 3 || (x < 7 && y > 26);
      if (forest) {
        const t = tile("forest", { ...soil, om: 55 + Math.round(rand() * 15), life: 60 }, rand() < 0.55 ? "tree" : rand() < 0.15 ? "log" : null);
        tiles.push(t);
        continue;
      }
      const inFarm = x >= FARM.x0 && x <= FARM.x1 && y >= FARM.y0 && y <= FARM.y1;
      if (inFarm) {
        const r = rand();
        const obstacle: Obstacle = r < 0.06 ? "stone" : r < 0.13 ? "stick" : r < 0.15 ? "stump" : null;
        tiles.push(tile("farm", soil, obstacle, obstacle === null && rand() < 0.75));
        continue;
      }
      const pond = (x - 33) ** 2 / 16 + (y - 27) ** 2 / 9 < 1;
      if (pond) {
        tiles.push(tile("water", soil));
        continue;
      }
      const shore = (x - 33) ** 2 / 25 + (y - 27) ** 2 / 14 < 1;
      tiles.push(tile(shore ? "sand" : "grass", soil, !shore && rand() < 0.04 ? "tree" : null));
    }
  }

  // Paths: from the house door down to the farm, and across to the store.
  const path = (x: number, y: number) => {
    const t = tiles[idx(x, y)];
    t.ground = "path";
    t.obstacle = null;
    t.weeds = false;
  };
  for (let y = 9; y <= 12; y++) path(10, y);
  for (let x = 10; x <= 32; x++) path(x, 11);
  for (let y = 9; y <= 11; y++) path(32, y);

  const buildings: Building[] = [
    { id: "house", kind: "house", x: 8, y: 5, data: {} },
    { id: "store", kind: "store", x: 30, y: 5, data: {} },
    { id: "bin", kind: "shippingBin", x: 13, y: 9, data: {} },
  ];
  // Clear land under the starting buildings.
  for (const b of buildings) {
    const [w, h] = BUILDING_SIZE[b.kind];
    for (let y = b.y; y < b.y + h; y++) for (let x = b.x; x < b.x + w; x++) {
      const t = tiles[idx(x, y)];
      t.obstacle = null;
      t.weeds = false;
      if (t.ground === "forest") t.ground = "grass";
    }
  }
  return { tiles, buildings };
}
