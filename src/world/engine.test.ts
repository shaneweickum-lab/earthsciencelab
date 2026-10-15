import { describe, expect, it } from "vitest";
import { dayOf, formatTime, seasonOf, startOfDay, timeOfDay } from "./clock";
import { DEFAULT_SETTINGS } from "./settings";
import {
  act, addItem, buy, countItem, day, discover, growthFactor, loadWorld, movePlayer, newWorld, placeBuilding, saveWorld,
  sellNow, ship, sleep, tick, tileAt, applyTool,
} from "./engine";
import { idx } from "./map";
import { spawnCritters } from "./nature";
import { previewAction } from "./preview";
import type { Tile, WeatherId, WorldState } from "./types";
import { weatherFor, type DayWeather } from "./weather";

const CAL = DEFAULT_SETTINGS;

/** Typical temperatures for a forced weather type. */
const TEMPS: Partial<Record<WeatherId, [number, number]>> = { frost: [45, 28], snow: [30, 20], heat: [96, 72] };
const dayWeather = (kind: WeatherId): DayWeather => {
  const [high, low] = TEMPS[kind] ?? [75, 58];
  return { kind, high, low };
};

const X = 15, Y = 20;

/** A world with the player standing above (X, Y) and facing it. */
function setup(patch: Partial<Tile> = {}, item?: string): WorldState {
  let s = newWorld(42);
  s = withTile(s, X, Y, { obstacle: null, weeds: false, ...patch });
  s = withTile(s, X, Y - 1, { obstacle: null, weeds: false });
  s = { ...s, player: { x: X, y: Y - 1, facing: "down" } };
  if (item) s = select(s, item);
  return s;
}

function withTile(s: WorldState, x: number, y: number, patch: Partial<Tile>): WorldState {
  const tiles = [...s.tiles];
  tiles[idx(x, y)] = { ...tiles[idx(x, y)], ...patch };
  return { ...s, tiles };
}

function select(s: WorldState, item: string): WorldState {
  let i = s.inventory.findIndex((x) => x?.item === item);
  if (i < 0) {
    s = addItem(s, item, 5)!;
    i = s.inventory.findIndex((x) => x?.item === item);
  }
  return { ...s, selected: i };
}

const at = (s: WorldState) => s.tiles[idx(X, Y)];

/** Force every day's weather. */
function weather(s: WorldState, kind: WeatherId, days = 60): WorldState {
  const all: WorldState["weather"] = {};
  for (let d = 1; d <= days; d++) all[d] = dayWeather(kind);
  return { ...s, weather: all };
}

describe("clock", () => {
  it("days start at 6 AM and roll over at 6 AM", () => {
    expect(dayOf(startOfDay(1))).toBe(1);
    expect(dayOf(startOfDay(2) - 1)).toBe(1);
    expect(dayOf(startOfDay(2))).toBe(2);
    expect(formatTime(startOfDay(1))).toBe("6:00 AM");
    expect(formatTime(startOfDay(1) + 18 * 60 + 30)).toBe("12:30 AM");
    expect(timeOfDay(startOfDay(3) + 60)).toBe(7 * 60);
  });
  it("cycles through four seasons of three months each", () => {
    expect(seasonOf(1, CAL)).toBe("Spring");
    expect(seasonOf(16, CAL)).toBe("Summer");
    expect(seasonOf(46, CAL)).toBe("Winter");
    expect(seasonOf(61, CAL)).toBe("Spring");
  });
});

describe("weather", () => {
  it("is deterministic per seed and day, and day 1 is sunny", () => {
    expect(weatherFor(1, 1, CAL).kind).toBe("sunny");
    for (let d = 2; d < 40; d++) expect(weatherFor(7, d, CAL)).toEqual(weatherFor(7, d, CAL));
  });
  it("only snows when it's cold enough", () => {
    for (let d = 1; d <= 240; d++) {
      const w = weatherFor(99, d, CAL);
      if (w.kind === "snow") expect(w.high).toBeLessThanOrEqual(34);
      if (w.kind === "frost") expect(w.low).toBeLessThanOrEqual(32);
    }
  });
  it("rain waters outdoor soil but not greenhouse soil", () => {
    let s = weather(setup({ tilled: true, moisture: 20 }), "rain");
    s = withTile(s, X + 1, Y, { tilled: true, moisture: 20, greenhouse: true, obstacle: null, weeds: false });
    s = sleep(s);
    expect(at(s).moisture).toBeGreaterThan(80);
    expect(s.tiles[idx(X + 1, Y)].moisture).toBeLessThan(20);
  });
});

describe("farming", () => {
  it("clears weeds, tills, plants, and waters", () => {
    let s = setup({ weeds: true }, "scythe");
    s = applyTool(s);
    expect(at(s).weeds).toBe(false);
    expect(countItem(s, "fiber")).toBe(1);
    s = applyTool(select(s, "hoe"));
    expect(at(s).tilled).toBe(true);
    s = applyTool(select(s, "seed_beans"));
    expect(at(s).crop?.id).toBe("beans");
    expect(countItem(s, "seed_beans")).toBe(4);
    s = applyTool(select(s, "can"));
    expect(at(s).moisture).toBe(Math.min(100, at(setup()).moisture + 45));
    expect(s.water).toBe(19);
  });

  it("previews actions before you take them", () => {
    const s = setup({ weeds: true }, "hoe");
    expect(previewAction(s)).toMatchObject({ label: "Till", ok: false });
    expect(previewAction(select(s, "scythe"))).toMatchObject({ label: "Cut", ok: true });
  });

  it("crops grow faster with water than without", () => {
    const base = weather(setup({ tilled: true, crop: { id: "beans", growth: 0, harvests: 0, dead: false, pests: false } }), "sunny");
    const wet = tick(withTile(base, X, Y, { moisture: 100 }), 6 * 60);
    const dry = tick(withTile(base, X, Y, { moisture: 5 }), 6 * 60);
    expect(at(wet).crop!.growth).toBeGreaterThan(at(dry).crop!.growth * 2);
  });

  it("crops ripen over several days and can be harvested", () => {
    let s = weather(setup({ tilled: true, crop: { id: "carrot", growth: 0, harvests: 0, dead: false, pests: false } }), "rain");
    for (let d = 0; d < 20; d++) s = withTile(sleep(s), X, Y, { weeds: false });
    s = { ...s, player: { x: X, y: Y - 1, facing: "down" } };
    expect(at(s).crop!.growth).toBe(1);
    s = act(s);
    expect(countItem(s, "crop_carrot")).toBeGreaterThan(0);
    expect(at(s).crop).toBeNull();
  });

  it("won't plant out of season outdoors, but will in a greenhouse", () => {
    let s = setup({ tilled: true }, "seed_tomato");
    s = { ...s, minute: startOfDay(46) }; // winter
    expect(seasonOf(day(s), CAL)).toBe("Winter");
    s = applyTool(s);
    expect(at(s).crop).toBeNull();
    s = applyTool(withTile(s, X, Y, { greenhouse: true }));
    expect(at(s).crop?.id).toBe("tomato");
    expect(growthFactor(withTile(s, X, Y, { moisture: 100 }), X, Y).factor).toBeGreaterThan(0);
  });

  it("frost kills tender crops outside but not hardy ones or greenhouse crops", () => {
    let s = setup({ tilled: true, crop: { id: "beans", growth: 0.2, harvests: 0, dead: false, pests: false } });
    s = withTile(s, X + 1, Y, { tilled: true, obstacle: null, crop: { id: "carrot", growth: 0.2, harvests: 0, dead: false, pests: false } });
    s = withTile(s, X + 2, Y, { tilled: true, obstacle: null, greenhouse: true, crop: { id: "beans", growth: 0.2, harvests: 0, dead: false, pests: false } });
    s = sleep(weather(s, "frost"));
    expect(at(s).crop!.dead).toBe(true);
    expect(s.tiles[idx(X + 1, Y)].crop!.dead).toBe(false);
    expect(s.tiles[idx(X + 2, Y)].crop!.dead).toBe(false);
  });

  it("weeds come back on bare soil", () => {
    let s = newWorld(3);
    s = { ...s, tiles: s.tiles.map((t) => (t.ground === "farm" ? { ...t, weeds: false, obstacle: null } : t)) };
    s = sleep(weather(s, "sunny"));
    expect(s.tiles.filter((t) => t.weeds).length).toBeGreaterThan(5);
  });

  it("soil tests reveal hidden soil numbers", () => {
    let s = setup({}, "labKit");
    expect(at(s).known).toEqual({ lab: false, shovel: false, water: false });
    s = applyTool(s);
    s = applyTool(select(s, "shovel"));
    s = applyTool(select(s, "ring"));
    expect(at(s).known).toEqual({ lab: true, shovel: true, water: true });
  });
});

describe("time and energy", () => {
  it("you faint at 2 AM, lose some coins, and wake up the next day", () => {
    const s = tick(newWorld(5), 20 * 60 + 5);
    expect(day(s)).toBe(2);
    expect(s.coins).toBeLessThan(300);
    expect(s.energy).toBe(50);
    expect(s.log?.notes[0]).toMatch(/fainted/);
  });
  it("sleeping restores energy and starts a new morning", () => {
    let s = { ...newWorld(5), energy: 10 };
    s = sleep(s);
    expect(day(s)).toBe(2);
    expect(timeOfDay(s.minute)).toBe(6 * 60);
    expect(s.energy).toBe(100);
  });
  it("using tools costs energy", () => {
    const s = setup({ weeds: true }, "scythe");
    expect(applyTool(s).energy).toBe(99);
    expect(at(applyTool({ ...s, energy: 0 })).weeds).toBe(true);
  });
});

describe("money", () => {
  it("buys only what you can afford", () => {
    let s = newWorld(1);
    s = buy(s, "seed_corn", 2);
    expect(s.coins).toBe(300 - 70);
    expect(countItem(s, "seed_corn")).toBe(2);
    const broke = buy({ ...s, coins: 5 }, "kit_greenhouse");
    expect(broke.coins).toBe(5);
    expect(countItem(broke, "kit_greenhouse")).toBe(0);
  });
  it("sells now, or ships for payment overnight with the organic bonus", () => {
    let s = addItem(newWorld(1), "crop_tomato", 4)!;
    const slot = s.inventory.findIndex((x) => x?.item === "crop_tomato");
    const sold = sellNow(s, slot, 2);
    expect(sold.coins).toBe(300 + 2 * Math.round(38 * 1.25));
    s = ship(s, slot);
    expect(countItem(s, "crop_tomato")).toBe(0);
    s = sleep(s);
    expect(s.coins).toBe(300 + 4 * Math.round(38 * 1.25));
    expect(s.shipping).toEqual([]);
  });
});

describe("buildings", () => {
  it("a compost bin turns fiber into compost after 2 days", () => {
    let s = select(setup({ tilled: false }), "kit_composter");
    s = placeBuilding(s, s.selected, X, Y);
    expect(s.buildings.some((b) => b.kind === "composter")).toBe(true);
    s = addItem({ ...s, selected: 29 }, "fiber", 10)!;
    s = { ...s, selected: s.inventory.findIndex((x) => x === null) };
    s = applyTool(s);
    expect(countItem(s, "fiber")).toBe(0);
    const back = (w: WorldState): WorldState => ({ ...w, player: { x: X, y: Y - 1, facing: "down" } });
    s = act(back(sleep(s)));
    expect(countItem(s, "compost")).toBe(0);
    s = act(back(sleep(s)));
    expect(countItem(s, "compost")).toBe(2);
    expect(s.journal).toContain("decomposers");
  });
});

describe("nature", () => {
  it("records each discovery in the journal once", () => {
    let s = discover(newWorld(1), "ladybug");
    s = discover(s, "ladybug");
    expect(s.journal).toEqual(["ladybug"]);
  });
  it("spawns critters each morning on their habitats", () => {
    const s = spawnCritters(newWorld(8), 2);
    expect(s.critters.length).toBeGreaterThan(0);
    for (const c of s.critters) expect(tileAt(s, c.x, c.y)).not.toBeNull();
  });
});

describe("movement and saving", () => {
  it("can't walk through trees or water", () => {
    const s = newWorld(1);
    let p = s.player;
    for (let i = 0; i < 200; i++) p = movePlayer({ ...s, player: p }, 0, -0.1);
    expect(p.y).toBeGreaterThan(2);
    expect(p.facing).toBe("up");
  });
  it("save and load round-trip", () => {
    const s = sleep(newWorld(11));
    const back = loadWorld(saveWorld(s))!;
    expect(back).toEqual(s);
    expect(loadWorld("not json")).toBeNull();
    expect(loadWorld(JSON.stringify({ ...s, version: 0 }))).toBeNull();
  });
});

describe("journal", () => {
  it("has a page for every critter that can spawn and every discovery in the engine", async () => {
    const { SPAWNS } = await import("./nature");
    const { JOURNAL_BY_ID, JOURNAL } = await import("./journal");
    const fs = await import("node:fs");
    for (const s of SPAWNS) expect(JOURNAL_BY_ID[s.kind], s.kind).toBeDefined();
    const src = fs.readFileSync(new URL("./engine.ts", import.meta.url), "utf8");
    const ids = [...src.matchAll(/discover(?:If)?\([^)]*"([a-z-]+)"\)/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(5);
    for (const id of ids) expect(JOURNAL_BY_ID[id], id).toBeDefined();
    expect(new Set(JOURNAL.map((e) => e.id)).size).toBe(JOURNAL.length);
    for (const e of JOURNAL) for (const l of ["elementary", "middle", "high"] as const) expect(e.fact[l].length).toBeGreaterThan(30);
  });
});
