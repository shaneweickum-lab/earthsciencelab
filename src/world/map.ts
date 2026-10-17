import { nextRandom } from "@/game/rng";
import type { Building, Ground, Obstacle, SoilState, Tile } from "./types";

/** The farm is the west part of the map (x < 38); the town is east of the forest strip. */
export const W = 76;
export const H = 36;
export const FARM_W = 38;

export const idx = (x: number, y: number) => y * W + x;
export const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;

/** The farm field the player clears and plants. */
export const FARM = { x0: 10, y0: 13, x1: 27, y1: 28 };

/** The town: its square, the community garden, and where the road runs. */
export const TOWN = {
  x0: 42,
  road: 11,
  square: { x0: 52, y0: 13, x1: 60, y1: 19 },
  garden: { x0: 63, y0: 21, x1: 69, y1: 27 },
};

export const BUILDING_SIZE: Record<Building["kind"], [number, number]> = {
  house: [5, 4], store: [5, 4], shippingBin: [1, 1],
  composter: [1, 1], rainBarrel: [1, 1], beehive: [1, 1], birdHouse: [1, 1], bugHotel: [1, 1], scarecrow: [1, 1],
  greenhouse: [5, 5], fence: [1, 1], flowerBed: [1, 1], pathStone: [1, 1],
  well: [1, 1], chickenCoop: [2, 2], smallBarn: [3, 3],
  extension: [5, 4], cottage: [4, 4], fountain: [2, 2], noticeBoard: [1, 1], field: [5, 3], lamp: [1, 1], prop: [1, 1],
  barn: [4, 4], silo: [2, 2], windmill: [3, 2], waterTower: [2, 2],
};

/** Buildings you can walk over. */
export const WALKABLE_BUILDINGS: Building["kind"][] = ["pathStone", "flowerBed"];

/** Door tile for buildings you enter or use from the front (bottom center). */
export function doorOf(b: Building): { x: number; y: number } | null {
  const [w, h] = BUILDING_SIZE[b.kind];
  if (["house", "store", "greenhouse", "extension", "cottage"].includes(b.kind)) return { x: b.x + Math.floor(w / 2), y: b.y + h - 1 };
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

export function farmBuildings(): Building[] {
  return [
    { id: "house", kind: "house", x: 8, y: 5, data: {} },
    { id: "bin", kind: "shippingBin", x: 13, y: 9, data: {} },
    // Grandma Rosa's old barn and silo, east of the house.
    { id: "farm-barn", kind: "barn", x: 15, y: 4, data: {} },
    { id: "farm-silo", kind: "silo", x: 19, y: 5, data: {} },
  ];
}

/** Everything in town. Ids are fixed so old saves can be upgraded by adding what's missing. */
export function townBuildings(): Building[] {
  const lamp = (id: string, x: number, y: number): Building => ({ id, kind: "lamp", x, y, data: {} });
  const prop = (id: string, x: number, y: number, model: string): Building => ({ id, kind: "prop", x, y, data: { model } });
  return [
    { id: "store", kind: "store", x: 43, y: 6, data: { owner: "mei", sign: "Seed & Soil Co." } },
    { id: "extension", kind: "extension", x: 50, y: 6, data: { owner: "amara", sign: "County Extension Office" } },
    { id: "june-cottage", kind: "cottage", x: 61, y: 6, data: { owner: "june" } },
    { id: "ortega-cottage", kind: "cottage", x: 43, y: 22, data: { owner: "luis" } },
    { id: "ortega-field", kind: "field", x: 49, y: 23, data: { owner: "luis" } },
    { id: "fountain", kind: "fountain", x: 55, y: 15, data: {} },
    { id: "notice-board", kind: "noticeBoard", x: 58, y: 13, data: {} },
    lamp("lamp-1", 52, 13), lamp("lamp-2", 60, 13), lamp("lamp-3", 52, 19), lamp("lamp-4", 60, 19), lamp("lamp-5", 41, 10),
    prop("cart", 47, 9, "town/cart"),
    { id: "june-flowers-1", kind: "flowerBed", x: 60, y: 9, data: {} },
    { id: "june-flowers-2", kind: "flowerBed", x: 65, y: 9, data: {} },
    { id: "square-flowers-1", kind: "flowerBed", x: 53, y: 19, data: {} },
    { id: "square-flowers-2", kind: "flowerBed", x: 59, y: 19, data: {} },
    { id: "garden-hive", kind: "beehive", x: 70, y: 22, data: { owner: "june" } },
    { id: "ortega-barn", kind: "barn", x: 55, y: 22, data: { owner: "luis" } },
    { id: "ortega-silo", kind: "silo", x: 59, y: 22, data: { owner: "luis" } },
    { id: "town-windmill", kind: "windmill", x: 67, y: 14, data: {} },
    { id: "water-tower", kind: "waterTower", x: 43, y: 14, data: {} },
  ];
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
      // Forest around the edges, and a strip between the farm and town with a gap for the road.
      const strip = x >= FARM_W && x < TOWN.x0 && (y < TOWN.road - 1 || y > TOWN.road + 1);
      const forest = y < 3 || x < 2 || x > W - 3 || y > H - 3 || (x < 7 && y > 26) || strip;
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
      const inGarden = x >= TOWN.garden.x0 && x <= TOWN.garden.x1 && y >= TOWN.garden.y0 && y <= TOWN.garden.y1;
      if (inGarden) {
        // The town's neglected community garden: overgrown, waiting to be restored.
        const r = rand();
        tiles.push(tile("farm", soil, r < 0.08 ? "stick" : r < 0.12 ? "stone" : null, r >= 0.12 && rand() < 0.85));
        continue;
      }
      // Town land is kept clear for buildings and paths; the farm side has a few trees.
      const scatterTrees = x < FARM_W && !shore && rand() < 0.04;
      tiles.push(tile(shore ? "sand" : "grass", soil, scatterTrees ? "tree" : null));
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
  // The road runs east from the farm through the forest gap into town.
  for (let x = 10; x <= W - 4; x++) path(x, TOWN.road);
  for (let x = TOWN.x0; x <= W - 4; x++) path(x, TOWN.road + 1);
  // Town square.
  const sq = TOWN.square;
  for (let y = sq.y0; y <= sq.y1; y++) for (let x = sq.x0; x <= sq.x1; x++) path(x, y);
  // Walkways to doors and the garden.
  // (Doors face south, so the Ortegas' walkway wraps around to the front of their cottage.)
  for (const [x, y0, y1] of [[45, 10, 10], [52, 10, 10], [63, 10, 10], [47, 13, 26], [64, 13, 20]] as const)
    for (let y = y0; y <= y1; y++) path(x, y);
  for (let x = 45; x <= 47; x++) path(x, 26);
  for (let x = 48; x < sq.x0; x++) path(x, 16);
  for (let x = sq.x1 + 1; x <= 64; x++) path(x, 16);

  const buildings: Building[] = [...farmBuildings(), ...townBuildings()];
  // Clear land under the buildings.
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
