import { describe, expect, it } from "vitest";
import { hitBoxes, movePlayer, newWorld, PLAYER_R, sleep } from "./engine";
import { idx, W } from "./map";
import type { Building, Obstacle, Tile, WorldState } from "./types";
import { startOfDay } from "./clock";

/** An open patch of grass around (20, 20), with things set down on it. */
function field(things: { x: number; y: number; obstacle?: Obstacle; building?: Omit<Building, "id" | "x" | "y" | "data"> }[] = []): WorldState {
  const s = newWorld(42);
  const tiles = s.tiles.map((t, i): Tile => {
    const x = i % W, y = Math.floor(i / W);
    return Math.abs(x - 20) <= 6 && Math.abs(y - 20) <= 6 ? { ...t, ground: "grass", obstacle: null, weeds: false, crop: null, elev: undefined, ramp: undefined } : t;
  });
  const buildings: Building[] = [];
  for (const [k, t] of things.entries()) {
    if (t.obstacle) tiles[idx(t.x, t.y)] = { ...tiles[idx(t.x, t.y)], obstacle: t.obstacle };
    if (t.building) buildings.push({ id: `b${k}`, x: t.x, y: t.y, data: {}, ...t.building });
  }
  return { ...s, tiles, buildings };
}

/** Walk in small steps, like the game loop does. */
function walk(s: WorldState, x: number, y: number, dx: number, dy: number, steps = 40) {
  let p = { x, y, facing: "down" as const } as WorldState["player"];
  for (let i = 0; i < steps; i++) p = movePlayer({ ...s, player: p }, dx, dy);
  return p;
}

describe("hit boxes", () => {
  it("let you walk right up to a rock, and stop flush against it", () => {
    const s = field([{ x: 20, y: 20, obstacle: "stone" }]);
    const p = walk(s, 17, 20, 0.1, 0);
    expect(p.x).toBeCloseTo(20 - 0.3 - PLAYER_R);
    // Still on the tile in front of it, so you face the rock to break it.
    expect(Math.round(p.x)).toBe(19);
  });

  it("let you brush past a tree's trunk, but not through a row of them", () => {
    const one = field([{ x: 20, y: 20, obstacle: "tree" }]);
    expect(walk(one, 20.6, 18, 0, 0.1, 60).y).toBeGreaterThan(22);
    const row = field([18, 19, 20, 21, 22].map((x) => ({ x, y: 20, obstacle: "tree" as const })));
    for (const x of [19.5, 20, 20.5]) expect(walk(row, x, 18, 0, 0.1, 60).y).toBeLessThan(19.5);
  });

  it("let you walk over sticks and saplings", () => {
    const s = field([{ x: 20, y: 20, obstacle: "stick" }, { x: 21, y: 20, obstacle: "sapling" }]);
    expect(walk(s, 18, 20, 0.1, 0).x).toBeGreaterThan(21.5);
  });

  it("make a fence a rail along its edge, and a row of fences a wall", () => {
    // Facing down (rot 0), the rail runs along the tile's bottom edge.
    const s = field([{ x: 20, y: 20, building: { kind: "fence" } }]);
    expect(walk(s, 20, 18, 0, 0.1).y).toBeCloseTo(20.35 - PLAYER_R);
    expect(walk(s, 20, 22, 0, -0.1).y).toBeCloseTo(20.55 + PLAYER_R);
    // Turned a quarter, it runs down the right edge, so you walk straight through from the top.
    const turned = field([{ x: 20, y: 20, building: { kind: "fence", rot: 1 } }]);
    expect(walk(turned, 20, 18, 0, 0.1).y).toBeGreaterThan(21.5);
    // A column of unturned fences still fences you in.
    const column = field([18, 19, 20, 21, 22].map((y) => ({ x: 20, y, building: { kind: "fence" as const } })));
    expect(walk(column, 18, 20, 0.1, 0).x).toBeLessThan(20);
  });

  it("stop you flush at a building's wall, and slide you along it", () => {
    const s = field([{ x: 20, y: 20, building: { kind: "chickenCoop" } }]);
    const p = walk(s, 18, 20.5, 0.1, 0);
    expect(p.x).toBeCloseTo(19.6 - PLAYER_R);
    const slid = walk(s, p.x, 20.5, 0.1, 0.1, 40);
    expect(slid.y).toBeGreaterThan(22);
  });

  it("keep water and cliffs whole-tile", () => {
    const s = field();
    const tiles = [...s.tiles];
    tiles[idx(20, 20)] = { ...tiles[idx(20, 20)], ground: "water" };
    tiles[idx(20, 22)] = { ...tiles[idx(20, 22)], elev: 1 };
    const w = { ...s, tiles };
    expect(hitBoxes(w, 20, 20, { x: 19, y: 20 })).toEqual([{ x0: 19.5, y0: 19.5, x1: 20.5, y1: 20.5 }]);
    expect(walk(w, 18, 20, 0.1, 0).x).toBeCloseTo(19.5 - PLAYER_R);
    expect(walk(w, 20, 24, 0, -0.1).y).toBeCloseTo(22.5 + PLAYER_R);
  });

  it("never hold you inside something you were set down on", () => {
    const s = field([{ x: 20, y: 20, obstacle: "stone" }]);
    expect(walk(s, 20, 20, 0.1, 0, 10).x).toBeGreaterThan(20.9);
  });
});

describe("weeds", () => {
  it("never sprout where something is planted, in any season", () => {
    let s = newWorld(7);
    const crop = { id: "carrot" as const, growth: 0.2, harvests: 0, dead: false, pests: false };
    s = { ...s, tiles: s.tiles.map((t) => (t.ground === "farm" && !t.obstacle ? { ...t, weeds: false, tilled: true, crop: { ...crop } } : t)) };
    const bare = new Set(s.tiles.flatMap((t, i) => (t.ground === "farm" && !t.obstacle && i % 2 ? [i] : [])));
    s = { ...s, tiles: s.tiles.map((t, i) => (bare.has(i) ? { ...t, crop: null } : t)) };
    let bareWeeds = 0;
    for (let n = 0; n < 4; n++) {
      // Each season: a few nights, then check.
      s = { ...s, minute: startOfDay(1 + n * 5 * 3 * 3) };
      for (let d = 0; d < 6; d++) s = sleep({ ...s, energy: 100 });
      for (const [i, t] of s.tiles.entries()) {
        if (t.crop) expect(t.weeds, `tile ${i}`).toBe(false);
        else if (bare.has(i) && t.weeds) bareWeeds++;
      }
    }
    expect(bareWeeds).toBeGreaterThan(0);
  });
});
