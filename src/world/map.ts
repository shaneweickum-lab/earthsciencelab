import { nextRandom } from "@/game/rng";
import type { Building, Ground, MineFloor, Obstacle, OreRock, SoilState, Tile } from "./types";

/** The farm is the west part of the map (x < 38); the town is east of the forest strip. */
export const W = 76;
export const H = 64;
export const FARM_W = 38;
/** The map was 36 rows tall before the South Fields were added below the forest belt. */
export const OLD_H = 36;

export const idx = (x: number, y: number) => y * W + x;
export const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;

/** Garden Lane runs north-south just inside the town's west edge, with a gate to each garden. */
export const LANE_X = 40;
export const GATE_X = 39;
export const GATE_ROWS = [4, 6, 8, 14, 16, 18, 20, 22];
/** Where you come out on your farm through its gate, and the tile on its road that leads back to town. */
export const GARDEN_ENTRY = { x: 36, y: 11, facing: "left" as const };
export const GARDEN_EXIT_X = 37;
/** Market stalls stand in a row across the town square; the first one is yours. */
export const STALL_ROW = 18;
export const STALL_X0 = 53;
export const STALL_SIZE = 6;

/** True when a farmer on their farm has walked to the end of its road. */
export const atGardenExit = (p: { x: number; y: number }) => Math.round(p.x) >= GARDEN_EXIT_X && Math.round(p.x) < FARM_W && Math.abs(Math.round(p.y) - GARDEN_ENTRY.y) <= 1;

/** The farm field the player clears and plants. */
export const FARM = { x0: 10, y0: 13, x1: 27, y1: 28 };
/** More farmland south of the forest belt, opened plot by plot. */
export const SOUTH = { x0: 10, y0: 37, x1: 33, y1: 60 };

export interface Plot {
  id: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * The farmland in 6×4-tile plots: 12 in the field by the house, 24 in the South Fields. A new
 * farm owns only plot 0 (nearest the house); the rest are bought or earned from quests.
 */
export const PLOTS: Plot[] = [FARM, SOUTH].flatMap((a) => {
  const out: Omit<Plot, "id">[] = [];
  for (let y = a.y0; y + 3 <= a.y1; y += 4) for (let x = a.x0; x + 5 <= a.x1; x += 6) out.push({ x0: x, y0: y, x1: x + 5, y1: y + 3 });
  return out;
}).map((p, id) => ({ id, ...p }));

/** The plot a tile is in, or null outside the farmland. */
export function plotAt(x: number, y: number): number | null {
  for (const p of PLOTS) if (x >= p.x0 && x <= p.x1 && y >= p.y0 && y <= p.y1) return p.id;
  return null;
}

/** The price of the next plot, rising with how many you own. */
export const plotPrice = (owned: number) => 100 + 40 * owned + 3 * owned * owned;

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
  well: [1, 1], chickenCoop: [2, 2], smallBarn: [3, 3], chest: [1, 1],
  extension: [5, 4], cottage: [4, 4], fountain: [2, 2], noticeBoard: [1, 1], field: [5, 3], lamp: [1, 1], prop: [1, 1],
  barn: [4, 4], silo: [2, 2], windmill: [3, 2], waterTower: [2, 2],
  mineEntrance: [2, 2], ladderUp: [1, 1], ladderDown: [1, 1],
  workbench: [1, 1], grinder: [1, 1], spinningWheel: [1, 1], furnace: [1, 1], stove: [1, 1], oven: [1, 1],
  gardenGate: [1, 1], marketStall: [1, 1],
};

/** The mine entrance (2×2, opening south onto the road), and the size of each mine floor. */
export const MINE_ENTRANCE = { x: 71, y: 8 };
export const MINE_W = 24;
export const MINE_H = 18;

/** The path from beside the field, through the forest belt, and along the top of the South Fields. */
export const SOUTH_PATH: [number, number][] = [
  ...Array.from({ length: SOUTH.y0 - 29 }, (_, i) => [9, 29 + i] as [number, number]),
  ...Array.from({ length: SOUTH.x1 - 9 }, (_, i) => [10 + i, SOUTH.y0 - 1] as [number, number]),
];

/** Slots in a storage chest. */
export const CHEST_SIZE = 20;

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
    // Grandma Rosa's tool chest, on the other side of the front door from the shipping bin.
    { id: "chest", kind: "chest", x: 7, y: 9, data: { items: Array(CHEST_SIZE).fill(null) } },
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
    // The old mine, past the town at the east end of the road.
    { id: "mine-entrance", kind: "mineEntrance", x: MINE_ENTRANCE.x, y: MINE_ENTRANCE.y, data: {} },
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
      // The old south edge is now a forest belt between the field and the South Fields.
      const belt = y > OLD_H - 3 && y < OLD_H;
      const south = y >= OLD_H;
      const forest = y < 3 || x < 2 || x > W - 3 || y > H - 3 || belt || (x < 7 && y > 26 && !south) || strip || (south && x >= FARM_W);
      if (south && !forest) {
        const inSouth = x >= SOUTH.x0 && x <= SOUTH.x1 && y >= SOUTH.y0 && y <= SOUTH.y1;
        if (inSouth) {
          const r = rand();
          const obstacle: Obstacle = r < 0.07 ? "stone" : r < 0.13 ? "stick" : r < 0.17 ? "stump" : r < 0.19 ? "log" : null;
          tiles.push(tile("farm", soil, obstacle, obstacle === null && rand() < 0.8));
        } else tiles.push(tile("grass", soil, rand() < 0.08 ? "tree" : null));
        continue;
      }
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
  for (const [x, y0, y1] of [[45, 10, 10], [52, 10, 10], [63, 10, 10], [47, 13, 26], [64, 13, 20], [72, 10, 10]] as const)
    for (let y = y0; y <= y1; y++) path(x, y);
  for (let x = 45; x <= 47; x++) path(x, 26);
  addGardenLane(tiles);
  // Down past the field and through the forest belt to the South Fields.
  for (const [x, y] of SOUTH_PATH) path(x, y);
  for (let x = 48; x < sq.x0; x++) path(x, 16);
  for (let x = sq.x1 + 1; x <= 64; x++) path(x, 16);

  const buildings: Building[] = [...farmBuildings(), ...townBuildings(), ...laneBuildings()];
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

/**
 * The forest strip between farm and town becomes a hedge with Garden Lane running through it,
 * joined to the road. Every farm, yours included, is reached through its gate on the lane.
 */
export function addGardenLane(tiles: Tile[]) {
  const set = (x: number, y: number, patch: Partial<Tile>) => (tiles[idx(x, y)] = { ...tiles[idx(x, y)], ...patch });
  for (let y = 3; y < H - 2; y++) for (let x = FARM_W; x < TOWN.x0; x++) set(x, y, { ground: "forest", obstacle: "tree", weeds: false });
  for (let y = GATE_ROWS[0]; y <= GATE_ROWS[GATE_ROWS.length - 1]; y++) set(LANE_X, y, { ground: "path", obstacle: null, weeds: false });
  for (let y = TOWN.road - 1; y <= TOWN.road + 1; y++) set(LANE_X + 1, y, { ground: "path", obstacle: null, weeds: false });
}

/** The gates along Garden Lane, and your market stall in the square. */
export function laneBuildings(): Building[] {
  return [
    ...GATE_ROWS.map((y, k): Building => ({ id: `gate-${k}`, kind: "gardenGate", x: GATE_X, y, data: { garden: k } })),
    { id: "stall-0", kind: "marketStall", x: STALL_X0, y: STALL_ROW, data: { garden: 0 } },
  ];
}

// ───────────────────────── the mine ─────────────────────────

const CAVE_SOIL: SoilState = { om: 0, life: 0, structure: 0, water: 0, nutrients: 0, ph: 7 };

/** Which ores show up how often, by depth: copper and tin near the top, gold and mithril deep down. */
export function oreChances(floor: number): [OreRock, number][] {
  if (floor < 5) return [["copperOre", 0.12], ["tinOre", 0.08]];
  if (floor < 10) return [["copperOre", 0.1], ["tinOre", 0.08], ["ironOre", 0.06]];
  if (floor < 20) return [["copperOre", 0.05], ["tinOre", 0.05], ["ironOre", 0.1], ["goldOre", 0.04]];
  if (floor < 30) return [["ironOre", 0.1], ["goldOre", 0.06], ["mithrilOre", 0.03]];
  return [["ironOre", 0.08], ["goldOre", 0.08], ["mithrilOre", 0.07]];
}

/** Where you arrive on a floor: the ladder up is here, and you stand just south of it. */
export const MINE_START = { x: 12, y: 8 };

/**
 * A fresh floor of the mine: a winding cave carved by random walkers, full of rocks, some with
 * ore. The ladder down hides under one rock far from the start. Floors differ each day.
 */
export function mineFloor(seed: number, floor: number, day: number): MineFloor {
  let s = (seed ^ Math.imul(floor, 0x9e3779b1) ^ Math.imul(day, 0x85ebca6b)) >>> 0;
  const rand = () => {
    const [v, n] = nextRandom(s);
    s = n;
    return v;
  };
  const at = (x: number, y: number) => y * MINE_W + x;
  const tiles: Tile[] = Array.from({ length: MINE_W * MINE_H }, () => tile("caveWall", CAVE_SOIL));
  const carve = (x: number, y: number) => (tiles[at(x, y)] = tile("cave", CAVE_SOIL));
  const { x: sx, y: sy } = MINE_START;
  for (const [dx, dy] of [[0, 0], [0, 1], [0, 2], [-1, 1], [1, 1]]) carve(sx + dx, sy + dy);
  for (let w = 0; w < 5; w++) {
    let x = sx, y = sy + 1;
    for (let step = 0; step < 90; step++) {
      const d = Math.floor(rand() * 4);
      x = Math.min(MINE_W - 2, Math.max(1, x + [1, -1, 0, 0][d]));
      y = Math.min(MINE_H - 2, Math.max(1, y + [0, 0, 1, -1][d]));
      carve(x, y);
    }
  }
  const chances = oreChances(floor);
  const rocks: number[] = [];
  for (let y = 1; y < MINE_H - 1; y++) for (let x = 1; x < MINE_W - 1; x++) {
    const i = at(x, y);
    if (tiles[i].ground !== "cave" || (Math.abs(x - sx) <= 1 && y >= sy - 1 && y <= sy + 2)) continue;
    if (rand() >= 0.42) continue;
    let r = rand();
    let rock: Obstacle = "stone";
    for (const [ore, p] of chances) {
      if (r < p) {
        rock = ore;
        break;
      }
      r -= p;
    }
    tiles[i].obstacle = rock;
    rocks.push(i);
  }
  // The ladder down hides under a rock well away from the start.
  const far = rocks.filter((i) => Math.abs((i % MINE_W) - sx) + Math.abs(Math.floor(i / MINE_W) - sy) >= 6);
  const pool = far.length ? far : rocks;
  let ladderAt = pool.length ? pool[Math.floor(rand() * pool.length)] : -1;
  if (ladderAt < 0) {
    ladderAt = at(sx, sy + 2);
    tiles[ladderAt].obstacle = "stone";
  }
  return { floor, tiles, ladderAt, buildings: [{ id: "ladder-up", kind: "ladderUp", x: sx, y: sy, data: {} }] };
}
