import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dayOf, formatTime, seasonOf, startOfDay, timeOfDay } from "./clock";
import { DEFAULT_SETTINGS } from "./settings";
import {
  act, addItem, buy, countItem, day, discover, growthFactor, loadWorld, movePlayer, newWorld, placeBuilding, saveWorld,
  sellNow, ship, sleep, tick, tileAt, applyTool, interact, pickUpBuilding, lockedInShop, putInChest, takeAllFromChest, takeFromChest,
  WORLD_VERSION, enterMine, leaveMine, isWalkable, buildingAt, cartFloors, craft, recipeStatus, canPickUp,
  plotLocked, buyPlot, nextPlotPrice, grantPlots, interactTarget,
} from "./engine";
import { ITEMS, RECIPES, UPGRADES } from "./items";
import { H, idx, MINE_ENTRANCE, MINE_START, MINE_W, mineFloor, OLD_H, PLOTS, W } from "./map";
import { spawnCritters } from "./nature";
import { previewAction } from "./preview";
import { skipTutorial } from "./quests";
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
  // Tests farm anywhere in the field, so own every plot.
  let s: WorldState = { ...newWorld(42), plots: PLOTS.map((p) => p.id) };
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

  const back = (w: WorldState): WorldState => ({ ...w, player: { x: X, y: Y - 1, facing: "down" } });
  const clearArea = (s: WorldState) => {
    for (let y = Y; y < Y + 3; y++) for (let x = X - 1; x < X + 3; x++) s = withTile(s, x, y, { obstacle: null, weeds: false, crop: null });
    return s;
  };

  it("a well refills the watering can and teaches about groundwater", () => {
    let s = select(setup(), "kit_well");
    s = placeBuilding(s, s.selected, X, Y);
    s = select({ ...s, water: 0 }, "can");
    s = applyTool(s);
    expect(s.water).toBe(s.canSize);
    expect(s.journal).toContain("groundwater");
    expect(previewAction({ ...s, water: 0 }).label).toBe("Refill");
  });

  it("hens lay two eggs every morning and their manure composts every 3 days", () => {
    let s = select(clearArea(setup()), "kit_chickenCoop");
    s = placeBuilding(s, s.selected, X, Y);
    expect(s.buildings.some((b) => b.kind === "chickenCoop")).toBe(true);
    s = { ...s, selected: s.inventory.findIndex((x) => x === null) };
    s = interact(back(s));
    expect(s.journal).toContain("hen");
    s = interact(back(sleep(s)));
    expect(countItem(s, "egg")).toBe(2);
    for (let d = 0; d < 3; d++) s = sleep(s);
    s = interact(back(s));
    expect(countItem(s, "egg")).toBe(2 + 6);
    expect(countItem(s, "compost")).toBe(1);
  });

  it("hens guard nearby crops from pests", () => {
    const pestDays = (withCoop: boolean) => {
      let s = setup({ tilled: true, crop: { id: "beans", growth: 0.2, harvests: 0, dead: false, pests: false } });
      s = { ...s, settings: { ...s.settings, science: { ...s.settings.science, rotation: false } } };
      if (withCoop) s = { ...s, buildings: [...s.buildings, { id: "coop", kind: "chickenCoop", x: X + 2, y: Y + 2, data: {} }] };
      let n = 0;
      for (let d = 0; d < 40; d++) {
        s = sleep(withTile(s, X, Y, { crop: { id: "beans", growth: 0.2, harvests: 0, dead: false, pests: false } }));
        if (at(s).crop?.pests) n++;
      }
      return n;
    };
    expect(pestDays(true)).toBeLessThan(pestDays(false));
  });

  it("a small barn turns old hay into straw mulch", () => {
    let s = select(clearArea(setup()), "kit_smallBarn");
    s = placeBuilding(s, s.selected, X, Y);
    expect(s.buildings.some((b) => b.kind === "smallBarn")).toBe(true);
    s = { ...s, selected: s.inventory.findIndex((x) => x === null) };
    for (let d = 0; d < 5; d++) s = sleep(s);
    s = interact(back(s));
    expect(countItem(s, "mulch")).toBe(3);
  });

  it("landmarks can't be picked up", () => {
    const s = newWorld(42);
    const barn = s.buildings.find((b) => b.id === "farm-barn")!;
    expect(pickUpBuilding(s, barn.id)).toBe(s);
  });
});

describe("saves from before the landmarks", () => {
  it("gain the barns, silos, windmill, and water tower where the ground is free", () => {
    const s = newWorld(42);
    const landmarks = ["farm-barn", "farm-silo", "ortega-barn", "ortega-silo", "town-windmill", "water-tower"];
    const old = { ...s, version: 4, buildings: s.buildings.filter((b) => !landmarks.includes(b.id)) };
    // The player built a fence where the farm silo goes.
    const fenced = { ...old, buildings: [...old.buildings, { id: "fence-1", kind: "fence" as const, x: 19, y: 5, data: {} }] };
    const up = loadWorld(JSON.stringify(fenced))!;
    expect(up.version).toBe(WORLD_VERSION);
    for (const id of landmarks.filter((id) => id !== "farm-silo")) expect(up.buildings.some((b) => b.id === id), id).toBe(true);
    expect(up.buildings.some((b) => b.id === "farm-silo")).toBe(false);
    expect(up.buildings.some((b) => b.id === "fence-1")).toBe(true);
  });
});

describe("tools", () => {
  const swing = (s: WorldState, n: number) => {
    for (let i = 0; i < n; i++) s = applyTool(s);
    return s;
  };

  it("take more swings for bigger obstacles, and fewer with a better tier", () => {
    let s = setup({ obstacle: "log" }, "axe");
    s = swing(s, 3);
    expect(tileAt(s, X, Y)!.obstacle).toBe("log");
    expect(tileAt(s, X, Y)!.hits).toBe(3);
    s = applyTool(s);
    expect(tileAt(s, X, Y)!.obstacle).toBeNull();
    expect(tileAt(s, X, Y)!.hits).toBeUndefined();
    expect(countItem(s, "wood")).toBe(4);
    const iron = applyTool(setup({ obstacle: "log" }, "axe_iron"));
    expect(tileAt(iron, X, Y)!.obstacle).toBeNull();
  });

  it("wear out and break", () => {
    let s = setup({ obstacle: "stone" }, "pickaxe");
    const i = s.selected;
    s = { ...s, inventory: s.inventory.map((x, k) => (k === i ? { ...x!, dur: 2 } : x)) };
    s = applyTool(s);
    expect(s.inventory[i]?.dur).toBe(1);
    s = applyTool(s); // the stone breaks, and so does the pickaxe
    expect(countItem(s, "stone")).toBe(1);
    expect(countItem(s, "pickaxe")).toBe(4); // select() handed out 5
    expect(s.messages.some((m) => /wore out/.test(m.text))).toBe(true);
    // Using a tool on nothing doesn't wear it.
    let t = setup({ obstacle: null }, "axe");
    t = applyTool(t);
    expect(t.inventory[t.selected]?.dur).toBeUndefined();
  });

  it("fell trees, which sprout again from the stump outside the garden field", () => {
    const x = 33, y = 4; // north of the field, near the forest
    let s = newWorld(42);
    s = withTile(s, x, y, { obstacle: "tree", ground: "grass", weeds: false });
    s = withTile(s, x, y - 1, { obstacle: null, weeds: false });
    s = select({ ...s, player: { x, y: y - 1, facing: "down" } }, "axe_mithril");
    s = applyTool(s);
    expect(tileAt(s, x, y)!.obstacle).toBe("stump");
    expect(countItem(s, "wood")).toBe(6);
    expect(s.journal).toContain("forest-regrowth");
    for (let d = 0; d < 7; d++) s = sleep(s);
    expect(tileAt(s, x, y)!.obstacle).toBe("sapling");
    for (let d = 0; d < 7; d++) s = sleep(s);
    expect(tileAt(s, x, y)!.obstacle).toBe("tree");
    expect(tileAt(s, x, y)!.regrow).toBeUndefined();
  });

  it("keep their wear in a chest", () => {
    let s = takeAllFromChest(skipTutorial(newWorld(42)), "chest");
    const i = s.inventory.findIndex((x) => x?.item === "axe");
    s = { ...s, inventory: s.inventory.map((x, k) => (k === i ? { ...x!, dur: 7 } : x)) };
    s = putInChest(s, "chest", i);
    s = takeAllFromChest(s, "chest");
    expect(s.inventory.find((x) => x?.item === "axe")?.dur).toBe(7);
  });
});

describe("the mine", () => {
  const open = (s: WorldState): WorldState => ({ ...s, quests: { active: [], done: ["reopen-mine"] } });
  const atEntrance = (s: WorldState): WorldState => ({ ...s, player: { x: MINE_ENTRANCE.x + 1, y: MINE_ENTRANCE.y + 2, facing: "up" } });

  it("is boarded up until Luis's quest is done", () => {
    const s = atEntrance(newWorld(42));
    const r = interact(s);
    expect(r.mine).toBeUndefined();
    expect(r.messages.at(-1)!.text).toMatch(/boards/);
    const inside = interact(open(s));
    expect(inside.mine?.floor).toBe(1);
    expect(inside.deepest).toBe(1);
    expect(isWalkable(inside, inside.player.x, inside.player.y)).toBe(true);
  });

  it("makes floors with deeper ores the deeper you go, the same for the same day", () => {
    const ores = (floor: number) => new Set(mineFloor(42, floor, 1).tiles.map((t) => t.obstacle).filter((o) => o && o !== "stone"));
    expect([...ores(1)].every((o) => o === "copperOre" || o === "tinOre")).toBe(true);
    const deep = new Set([25, 26, 27, 28, 29].flatMap((f) => [...ores(f)]));
    expect(deep.has("mithrilOre") || deep.has("goldOre")).toBe(true);
    expect(mineFloor(42, 3, 1)).toEqual(mineFloor(42, 3, 1));
    expect(mineFloor(42, 3, 1)).not.toEqual(mineFloor(42, 3, 2));
    const f = mineFloor(42, 3, 1);
    expect(f.tiles[f.ladderAt].obstacle).not.toBeNull();
  });

  it("hides the ladder down under a rock, and climbing out returns you to town", () => {
    let s = interact(open(atEntrance(newWorld(42))));
    const m = s.mine!;
    const lx = m.ladderAt % MINE_W, ly = Math.floor(m.ladderAt / MINE_W);
    // Stand above the ladder rock (clearing the spot) and break it with a mithril pickaxe.
    const tiles = [...m.tiles];
    tiles[(ly - 1) * MINE_W + lx] = { ...tiles[m.ladderAt], ground: "cave", obstacle: null };
    s = select({ ...s, mine: { ...m, tiles }, player: { x: lx, y: ly - 1, facing: "down" } }, "pickaxe_mithril");
    s = applyTool(s);
    expect(buildingAt(s, lx, ly)?.kind).toBe("ladderDown");
    s = interact(s);
    expect(s.mine?.floor).toBe(2);
    expect(s.deepest).toBe(2);
    s = { ...s, player: { x: MINE_START.x, y: MINE_START.y + 1, facing: "up" } };
    s = interact(s); // the ladder up
    expect(s.mine).toBeUndefined();
    expect(s.player).toMatchObject({ x: MINE_ENTRANCE.x + 1, y: MINE_ENTRANCE.y + 2 });
    expect(leaveMine(s)).toBe(s);
  });

  it("gives ore and a journal page, and the farm keeps growing above", () => {
    let s = enterMine(open(newWorld(42)), 12);
    const m = s.mine!;
    const tiles = [...m.tiles];
    const at = (MINE_START.y + 2) * MINE_W + MINE_START.x;
    tiles[at] = { ...tiles[at], ground: "cave", obstacle: "ironOre" };
    s = select({ ...s, mine: { ...m, ladderAt: -1, tiles } }, "pickaxe_mithril");
    s = applyTool(s);
    expect(countItem(s, "ironOre")).toBeGreaterThan(0);
    expect(s.journal).toContain("ironOre");
    const before = s.tiles;
    s = tick(s, 120);
    expect(s.tiles).not.toBe(before); // hourly farm updates still run
    expect(sleep(s).mine).toBeUndefined();
  });

  it("remembers every fifth floor for the mine cart", () => {
    const s = enterMine(open(newWorld(42)), 11);
    expect(cartFloors(s)).toEqual([1, 5, 10]);
  });
});

describe("crafting", () => {
  it("starts with Grandma's workbench, found in the barn", () => {
    let s = newWorld(42);
    const barn = s.buildings.find((b) => b.id === "farm-barn")!;
    s = { ...s, player: { x: barn.x + 1, y: barn.y + 4, facing: "up" } };
    s = act(s);
    expect(countItem(s, "kit_workbench")).toBe(1);
    expect(s.foundWorkbench).toBe(true);
    expect(countItem(interact(s), "kit_workbench")).toBe(1); // only once
  });

  it("turns fiber into rope and wood into sticks", () => {
    let s = addItem(newWorld(42), "fiber", 24)!;
    for (let i = 0; i < 8; i++) s = craft(s, "refinedFiber");
    expect(countItem(s, "fiber")).toBe(0);
    s = craft(s, "rope");
    expect(countItem(s, "rope")).toBe(1);
    expect(countItem(s, "refinedFiber")).toBe(0);
    s = craft(addItem(s, "wood", 1)!, "sticks");
    expect(countItem(s, "sticks")).toBe(2);
    // Not enough: nothing changes.
    expect(countItem(craft(s, "rope"), "rope")).toBe(1);
  });

  it("smelts bronze from copper and tin, and makes a bronze axe at the grinder", () => {
    let s = newWorld(42);
    for (const [item, n] of [["copperOre", 9], ["tinOre", 6], ["wood", 3], ["sticks", 2], ["rope", 1]] as const) s = addItem(s, item, n)!;
    for (let i = 0; i < 3; i++) s = craft(s, "bronzeBar");
    expect(countItem(s, "bronzeBar")).toBe(3);
    expect(s.journal).toContain("alloy");
    expect(recipeStatus(s, RECIPES.find((r) => r.id === "axe_bronze")!).ok).toBe(true);
    s = craft(s, "axe_bronze");
    expect(countItem(s, "axe_bronze")).toBe(1);
    expect(countItem(s, "bronzeBar")).toBe(0);
  });

  it("has every recipe's ingredients and products as real items, and a tool recipe for every tier", () => {
    for (const r of RECIPES) for (const id of [r.id, ...r.inputs.map((i) => i.item)]) expect(ITEMS[id], id).toBeDefined();
    for (const t of ["copper", "bronze", "iron", "gold", "mithril"]) expect(RECIPES.some((r) => r.id === `pickaxe_${t}`)).toBe(true);
  });

  it("lets you pick up a crafted chest, but not Grandma's", () => {
    const s = newWorld(42);
    expect(canPickUp(s.buildings.find((b) => b.id === "chest")!)).toBe(false);
    expect(canPickUp({ id: "chest-9", kind: "chest", x: 3, y: 3, data: {} })).toBe(true);
  });
});

describe("farm plots", () => {
  const fieldTile = (s: WorldState, plot: number) => ({ x: PLOTS[plot].x0 + 2, y: PLOTS[plot].y0 + 1 });

  it("start with one plot by the house; the rest are locked", () => {
    const s = newWorld(42);
    expect(s.plots).toEqual([0]);
    expect(plotLocked(s, 12, 14)).toBe(false);
    expect(plotLocked(s, 20, 20)).toBe(true);
    expect(plotLocked(s, 40, 20)).toBe(false); // not farmland
    expect(PLOTS).toHaveLength(42); // 36 on the farm, 6 allotments in the park
    const { x, y } = fieldTile(s, 4);
    let t = withTile(s, x, y, { obstacle: null, weeds: false, tilled: false });
    t = select({ ...t, player: { x, y: y - 1, facing: "down" } }, "hoe");
    const r = applyTool(t);
    expect(tileAt(r, x, y)!.tilled).toBe(false);
    expect(r.messages.at(-1)!.text).toMatch(/isn't yours/);
    expect(interactTarget({ ...t, player: { x, y: y - 1, facing: "down" } })).toBe("plot");
  });

  it("can be bought, each one costing more", () => {
    let s = { ...newWorld(42), coins: 1000 };
    expect(nextPlotPrice(s)).toBe(143);
    s = buyPlot(s, 5);
    expect(s.plots).toEqual([0, 5]);
    expect(s.coins).toBe(1000 - 143);
    expect(nextPlotPrice(s)).toBeGreaterThan(143);
    expect(buyPlot(s, 5)).toBe(s);
    const poor = buyPlot({ ...s, coins: 10 }, 6);
    expect(poor.plots).toEqual([0, 5]);
  });

  it("are quest rewards too", () => {
    const s = grantPlots(newWorld(42), 2);
    expect(s.plots).toEqual([0, 1, 2]);
  });

  it("grow the farm south, and older farms keep the field plots they've used", () => {
    const s = newWorld(42);
    expect(s.tiles).toHaveLength(W * H);
    expect(tileAt(s, 20, 45)!.ground).toBe("farm");
    expect(tileAt(s, 9, 34)!.ground).toBe("path"); // through the forest belt
    // An old farm with crops growing in plot 4.
    const used = fieldTile(s, 4);
    const old = {
      ...s, version: 7,
      tiles: s.tiles.slice(0, W * OLD_H).map((t, i) => (
        i === idx(9, 34) ? { ...t, ground: "forest" as const, obstacle: "tree" as const } : i === idx(used.x, used.y) ? { ...t, tilled: true } : t
      )),
    } as WorldState;
    delete old.plots;
    const up = loadWorld(JSON.stringify(old))!;
    expect(up.version).toBe(WORLD_VERSION);
    expect(up.tiles).toHaveLength(W * H);
    expect(up.plots).toEqual([0, 4]);
    expect(tileAt(up, 9, 34)!.ground).toBe("path");
    expect(plotLocked(up, used.x, used.y)).toBe(false);
    expect(plotLocked(up, fieldTile(s, 7).x, fieldTile(s, 7).y)).toBe(true);
    expect(plotLocked(up, 20, 45)).toBe(true);
  });
});

describe("item icons", () => {
  it("exist for every item", () => {
    for (const i of [...Object.values(ITEMS), UPGRADES.bigCan]) expect(existsSync(`public${i.image}`), i.id).toBe(true);
  });
});

describe("the starter chest", () => {
  const chestOf = (s: WorldState) => s.buildings.find((b) => b.kind === "chest")!;

  it("holds Grandma's scythe while the bag starts empty", () => {
    const s = newWorld(42);
    expect(s.inventory.every((x) => x === null)).toBe(true);
    expect(chestOf(s).data.items!.filter(Boolean).map((x) => x!.item)).toEqual(["scythe"]);
  });

  it("moves stacks between the chest and the bag", () => {
    let s = takeAllFromChest(skipTutorial(newWorld(42)), "chest");
    expect(countItem(s, "hoe")).toBe(1);
    expect(countItem(s, "seed_carrot")).toBe(12);
    expect(chestOf(s).data.items!.every((x) => x === null)).toBe(true);
    const slot = s.inventory.findIndex((x) => x?.item === "lime");
    s = putInChest(s, "chest", slot);
    expect(countItem(s, "lime")).toBe(0);
    expect(chestOf(s).data.items!.find((x) => x?.item === "lime")?.qty).toBe(2);
    s = takeFromChest(s, "chest", chestOf(s).data.items!.findIndex((x) => x?.item === "lime"));
    expect(countItem(s, "lime")).toBe(2);
  });

  it("can't be picked up", () => {
    const s = newWorld(42);
    expect(pickUpBuilding(s, "chest")).toBe(s);
  });

  it("is added, empty, to older saves, which keep their science tools unlocked", () => {
    const s = newWorld(42);
    const old = { ...s, version: 5, buildings: s.buildings.filter((b) => b.kind !== "chest") };
    const up = loadWorld(JSON.stringify(old))!;
    expect(up.version).toBe(WORLD_VERSION);
    expect(chestOf(up).data.items!.every((x) => x === null)).toBe(true);
    for (const id of ["shovel", "ring", "labKit"]) expect(lockedInShop(up, id), id).toBe(false);
  });
});

describe("science tools in the store", () => {
  it("stay locked until their quest is done, which pays for them", () => {
    let s = { ...newWorld(42), coins: 1000 };
    expect(lockedInShop(s, "shovel")).toBe(true);
    expect(buy(s, "shovel")).toMatchObject({ coins: 1000 });
    s = { ...s, quests: { active: [], done: ["dig-deeper"] } };
    s = buy(s, "shovel", 3);
    expect(countItem(s, "shovel")).toBe(1);
    expect(s.coins).toBe(940);
    expect(buy(s, "shovel").coins).toBe(940); // one is enough
    expect(lockedInShop(s, "ring")).toBe(true);
    expect(lockedInShop(s, "labKit")).toBe(true);
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
