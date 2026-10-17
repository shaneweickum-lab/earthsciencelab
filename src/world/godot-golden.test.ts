// Fixtures for the Godot port. The TS engine is the reference while the port is under way:
// - godot/data/*.json: the game's tables (crops, items, journal, NPCs, quests…), so they're
//   written once, here, and the two versions can't drift apart.
// - godot/tests/golden/*.json: inputs and the TS engine's results. The GDScript tests replay
//   them and must match.
// This test fails when a file is stale; regenerate with GOLDEN=1 npx vitest run godot-golden.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { CROP_ORDER, CROPS, FAMILY_LABEL, type CropId } from "@/game/crops";
import { nextRandom } from "@/game/rng";
import { CROP_LOOKS } from "@/components/world/scene/cropLooks";
import { AVATARS, DEFAULT_AVATAR } from "./avatars";
import { dateOf, dayOfSeason, formatDate, formatTime, seasonOf, startOfDay, timeOfDay, yearFraction, type Calendar } from "./clock";
import {
  act, addItem, applyTool, buy, growthFactor, interact, loadWorld, movePlayer, newWorld, pickUpBuilding, sellNow, ship, sleep,
  swapSlots, tick, STARTER_CHEST, takeAllFromChest, putInChest, takeFromChest,
} from "./engine";
import { expectedGrade, GRADE_INFO, GRADES, harvestAmount, soilHealth } from "./grades";
import { cropDays, ITEMS, sellPrice, SHOP_UNLOCKS, tempFactor, TIERS, UPGRADES, WORLD_CROPS } from "./items";
import { CATEGORY_INFO, JOURNAL, MUSHROOM_SAFETY } from "./journal";
import { BUILDING_SIZE, FARM, H, TOWN, W } from "./map";
import { SPAWNS } from "./nature";
import { previewAction } from "./preview";
import { accept, boardRequests, expireBoard, goalLabel, offers, QUESTS, questState, questStatus, rewardText, turnIn } from "./quests";
import { DEFAULT_SETTINGS, formatTemp, PRESETS, SCIENCE_FEATURES, speedLabel, type GameSettings } from "./settings";
import { giveGift, NPCS, npcInFront, npcPose, route, talk } from "./town";
import type { Dir, Grade, WorldState } from "./types";
import { seasonalMeanF, tempAt, WEATHER, weatherFor } from "./weather";

const ROOT = path.resolve(__dirname, "../../godot");
const WRITE = process.env.GOLDEN === "1";

function emit(file: string, data: unknown) {
  const full = path.join(ROOT, file);
  const text = JSON.stringify(data) + "\n";
  if (WRITE) {
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, text);
    return;
  }
  const hint = "run GOLDEN=1 npx vitest run godot-golden";
  expect(existsSync(full), `godot/${file} is missing: ${hint}`).toBe(true);
  expect(readFileSync(full, "utf8") === text, `godot/${file} is stale: ${hint}`).toBe(true);
}
const golden = (name: string, data: unknown) => emit(`tests/golden/${name}.json`, data);

function stream(seed: number) {
  let s = seed >>> 0;
  return () => {
    const [v, n] = nextRandom(s);
    s = n;
    return v;
  };
}

const CALENDARS: Calendar[] = [
  { seasons: true, daysPerMonth: 5 },
  { seasons: true, daysPerMonth: 30 },
  { seasons: true, daysPerMonth: 13 },
  { seasons: false, daysPerMonth: 5 },
];

describe("Godot data tables", () => {
  it("are exported", () => {
    emit("data/crops.json", { crops: CROPS, order: CROP_ORDER, familyLabel: FAMILY_LABEL, world: WORLD_CROPS });
    emit("data/items.json", { items: ITEMS, upgrades: UPGRADES, gradeInfo: GRADE_INFO, shopUnlocks: SHOP_UNLOCKS, starterChest: STARTER_CHEST, tiers: TIERS });
    emit("data/settings.json", { features: SCIENCE_FEATURES, presets: PRESETS, defaults: DEFAULT_SETTINGS });
    emit("data/weather.json", WEATHER);
    emit("data/journal.json", { entries: JOURNAL, categories: CATEGORY_INFO, mushroomSafety: MUSHROOM_SAFETY });
    emit("data/nature.json", { spawns: SPAWNS });
    emit("data/town.json", { npcs: NPCS, quests: QUESTS });
    emit("data/world.json", { avatars: AVATARS, defaultAvatar: DEFAULT_AVATAR, buildingSize: BUILDING_SIZE });
    emit("data/crop_looks.json", CROP_LOOKS);
  });
});

describe("Godot golden fixtures", () => {
  it("rng", () => {
    const out: Record<string, number[]> = {};
    for (const seed of [0, 1, 42, 123456789, 2147483646, 4294967295]) {
      let s = seed;
      out[seed] = Array.from({ length: 40 }, () => {
        const [v, n] = nextRandom(s);
        s = n;
        return v * 4294967296; // exact as an integer; Godot's JSON parser can be off by an ulp on long decimals
      });
    }
    golden("rng", out);
  });

  it("imul", () => {
    const vals = [0, 1, 7, 40503, 2654435761, 0x9e3779b1, 0x7fffffff, 0x80000000, 0xffffffff, 123456789, 987654321];
    golden("imul", vals.flatMap((a) => vals.map((b) => [a, b, Math.imul(a, b) >>> 0])));
  });

  it("clock", () => {
    const minutes = [0, 359, 360, 361, 719, 1439, 1440, 1559, 1560, 1800, 99999, 123456, 525600 * 3 + 17];
    golden("clock", {
      minutes: minutes.map((m) => [m, timeOfDay(m), formatTime(m)]),
      calendars: CALENDARS.map((cal) => ({
        cal,
        days: [1, 2, 3, 15, 16, 30, 31, 60, 61, 89, 90, 91, 120, 121, 179, 180, 181, 359, 360, 361, 400, 721].map((d) => [
          d, dateOf(d, cal), seasonOf(d, cal), dayOfSeason(d, cal), formatDate(d, cal), formatDate(d, cal, true), yearFraction(d, cal),
        ]),
      })),
    });
  });

  it("weather", () => {
    golden("weather", {
      calendars: CALENDARS.map((cal) => ({
        cal,
        seeds: [7, 99991].map((seed) => ({ seed, days: Array.from({ length: 400 }, (_, i) => weatherFor(seed, i + 1, cal)) })),
      })),
      mean: [0, 0.1, 0.25, 0.5, 0.75, 0.9].map((f) => [f, seasonalMeanF(f)]),
      tempAt: [0, 180, 360, 600, 900, 1000, 1300, 1439, 1500].map((m) => [m, tempAt({ kind: "sunny", high: 81, low: 47 }, m)]),
    });
  });

  it("settings and items", () => {
    golden("formulas", {
      temps: [-40, -2.5, 0, 31.5, 32, 50, 72.4, 99.5].flatMap((f) => [[f, "F", formatTemp(f, "F")], [f, "C", formatTemp(f, "C")]]),
      speeds: [1, 2, 3, 7, 10, 30, 60].map((s) => [s, speedLabel(s)]),
      cropDays: CROP_ORDER.flatMap((c) => [5, 13, 30].flatMap((m) => [[c, m, false, cropDays(c, m, false)], [c, m, true, cropDays(c, m, true)]])),
      tempFactor: (["cool", "warm"] as const).flatMap((t) => [20, 40, 45, 55, 60, 75, 80, 95, 120].map((f) => [t, f, tempFactor(t, f)])),
      sellPrice: Object.keys(ITEMS).flatMap((id) => [undefined, ...GRADES].flatMap((g) => [true, false].map((o) => [id, g ?? null, o, sellPrice(ITEMS[id], g, o)]))),
    });
  });

  it("maps", () => {
    const G = ["grass", "farm", "path", "water", "sand", "forest"];
    const O = [null, "stone", "stick", "stump", "tree", "log"];
    golden("maps", [3, 42, 2024].map((seed) => {
      const s = newWorld(seed);
      return {
        seed,
        tiles: s.tiles.map((t) => [G.indexOf(t.ground), O.indexOf(t.obstacle), +t.weeds, t.soil.om, t.soil.life, t.soil.structure, t.soil.water, t.soil.nutrients, t.soil.ph]),
        buildings: s.buildings,
        weather: s.weather,
      };
    }));
  });

  it("grades", () => {
    const s = newWorld(11);
    const out = [];
    for (let i = 0; i < 300; i++) {
      const r = stream(i * 977 + 5);
      const tile = { ...s.tiles[0], soil: { om: r() * 100, life: r() * 100, structure: r() * 100, water: r() * 100, nutrients: r() * 100, ph: 4.5 + r() * 4 } };
      const crop = CROP_ORDER[i % CROP_ORDER.length];
      const t = { ...tile, boost: i % 4 === 0 ? 0 : Math.floor(r() * 11), crop: { id: crop, growth: 1, harvests: i % 3, dead: false, pests: false, stress: Math.floor(r() * 200) } };
      const w = { ...s, minute: 360 + i * 37, settings: { ...s.settings, daysPerMonth: [5, 13, 30][i % 3], science: { ...s.settings.science, cropGrades: i % 5 !== 0 } } };
      const g = expectedGrade(w, t);
      out.push({ i, tile: t, minute: w.minute, daysPerMonth: w.settings.daysPerMonth, cropGrades: w.settings.science.cropGrades, health: soilHealth(t), grade: g, amount: harvestAmount(w, i * 13, crop, g.grade) });
    }
    golden("grades", out);
  });

  it("nature", () => {
    let s = newWorld(8);
    const out = [];
    for (let d = 2; d <= 60; d++) {
      s = sleep(s);
      out.push({ day: d, critters: s.critters, weather: s.weather[d] });
    }
    golden("nature", out);
  });

  it("town", () => {
    const s = newWorld(3);
    const routes = NPCS.flatMap((n) => n.schedule.map((b, i) => {
      const a = n.schedule[(i - 1 + n.schedule.length) % n.schedule.length];
      return { from: [a.x, a.y], to: [b.x, b.y], path: route(s, [a.x, a.y], [b.x, b.y]) };
    }));
    const poses = NPCS.map((n) => ({ id: n.id, poses: Array.from({ length: 160 }, (_, i) => {
      const m = startOfDay(2) + i * 9.25;
      return [m, npcPose(s, n, m)];
    }) }));
    const boards = [3, 77].flatMap((seed) => [true, false].map((seasons) => {
      const w = newWorld(seed, { seasons });
      return { seed, seasons, days: Array.from({ length: 40 }, (_, d) => boardRequests({ ...w, minute: startOfDay(d + 1) })) };
    }));
    const texts = {
      rewards: [...QUESTS.map((q) => q.reward), ...boards.flatMap((b) => b.days.flatMap((d) => d.map((r) => r.board.reward)))].map((r) => [r, rewardText(r)]),
      labels: [...QUESTS.flatMap((q) => q.steps.map((st) => st.goal)), ...boards.flatMap((b) => b.days.flatMap((d) => d.map((r) => r.board.goal)))].map((g) => [g, goalLabel(g)]),
    };
    golden("town", { routes, poses, boards, texts });
  });
});

// ───────────────────────── playthroughs ─────────────────────────
//
// A seeded "bot" plays the game: it teleports around the field, picks hotbar slots, uses
// tools, plants, sleeps, shops, ships, talks, gifts, and does quests. The ops are recorded
// with a summary of the world after each one; Godot replays the same ops and must match.

type Op = Record<string, unknown> & { op: string };

function apply(s: WorldState, op: Op): { state: WorldState; text?: string } {
  switch (op.op) {
    case "player": return { state: { ...s, player: { x: op.x as number, y: op.y as number, facing: op.facing as Dir } } };
    case "tile": {
      const tiles = [...s.tiles];
      tiles[op.i as number] = { ...tiles[op.i as number], ...(op.patch as object) };
      return { state: { ...s, tiles } };
    }
    case "weather": return { state: { ...s, weather: { ...s.weather, [op.day as number]: op.w as WorldState["weather"][number] } } };
    case "select": return { state: { ...s, selected: op.i as number } };
    case "selectItem": return { state: { ...s, selected: Math.max(0, s.inventory.findIndex((x) => x?.item === op.item)) } };
    case "give": return { state: addItem(s, op.item as string, op.qty as number, (op.grade as Grade) ?? undefined) ?? s };
    case "act": return { state: act(s) };
    case "applyTool": return { state: applyTool(s) };
    case "interact": return { state: interact(s) };
    case "tick": return { state: tick(s, op.n as number) };
    case "sleep": return { state: sleep(s) };
    case "buy": return { state: buy(s, op.id as string, op.qty as number) };
    case "sellNow": return { state: sellNow(s, op.slot as number, op.qty as number) };
    case "ship": return { state: ship(s, op.slot as number) };
    case "move": return { state: { ...s, player: movePlayer(s, op.dx as number, op.dy as number) } };
    case "swap": return { state: swapSlots(s, op.a as number, op.b as number) };
    case "take": return { state: takeFromChest(s, op.id as string, op.slot as number) };
    case "takeAll": return { state: takeAllFromChest(s, op.id as string) };
    case "put": return { state: putInChest(s, op.id as string, op.slot as number) };
    case "pickUp": return { state: pickUpBuilding(s, op.id as string) };
    case "talk": return talk(s, op.id as string);
    case "gift": return giveGift(s, op.id as string);
    case "accept": {
      if (op.board === undefined) return { state: accept(s, op.id as string) };
      const r = boardRequests(s)[op.board as number];
      return { state: accept(s, r.id, r.board) };
    }
    case "turnIn": {
      const r = turnIn(s, op.id as string);
      return { state: r.state, text: `${r.finished}|${r.text}` };
    }
    case "expireBoard": return { state: expireBoard(s) };
  }
  throw new Error(`unknown op ${op.op}`);
}

const compactInv = (s: WorldState) => s.inventory.flatMap((x, i) => (x ? [[i, x.item, x.qty, x.grade ?? null]] : []));

function summary(s: WorldState, text?: string) {
  const f = { x: Math.round(s.player.x) + ({ up: 0, down: 0, left: -1, right: 1 }[s.player.facing]), y: Math.round(s.player.y) + ({ up: -1, down: 1, left: 0, right: 0 }[s.player.facing]) };
  const inside = f.x >= 0 && f.y >= 0 && f.x < W && f.y < H;
  const t = inside ? s.tiles[f.y * W + f.x] : null;
  return {
    minute: s.minute, coins: s.coins, energy: s.energy, water: s.water, canSize: s.canSize, organic: s.organic, selected: s.selected,
    harvests: s.harvests, player: s.player, msg: s.messages.at(-1)?.text ?? null, nMsg: s.messages.length, text: text ?? null,
    inv: compactInv(s), journal: s.journal, shipping: s.shipping, nBuildings: s.buildings.length,
    preview: previewAction(s), tile: t, growth: t ? growthFactor(s, f.x, f.y) : null, grade: t ? expectedGrade(s, t) : null,
    npc: npcInFront(s)?.id ?? null, quests: s.quests ?? null, friends: s.friends ?? null,
  };
}

/** The end state, with only the tiles that can change (garden and greenhouse). */
function finalState(s: WorldState) {
  return { ...s, tiles: s.tiles.flatMap((t, i) => (t.ground === "farm" || t.greenhouse ? [[i, t]] : [])) };
}

const GIVE = ["seed_carrot", "seed_beans", "seed_tomato", "seed_corn", "seed_clover", "seed_squash", "seed_sunflower", "seed_potato", "seed_wheat", "seed_buckwheat",
  "compost", "mulch", "lime", "biochar", "synthFert", "labKit", "fiber", "kit_composter", "kit_rainBarrel", "kit_beehive", "kit_bugHotel", "kit_flowerBed", "kit_greenhouse", "kit_fence",
  "kit_well", "kit_chickenCoop", "kit_smallBarn", "kit_well", "crop_carrot", "crop_tomato", "axe_copper", "pickaxe_gold"];
const BUY = ["seed_carrot", "seed_beans", "compost", "labKit", "kit_fence", "bigCan", "kit_scarecrow", "honey", "shovel", "ring"];
const DIRS: Dir[] = ["up", "down", "left", "right"];
const WEATHERS = [
  { kind: "storm", high: 70, low: 55 }, { kind: "rain", high: 62, low: 50 }, { kind: "frost", high: 45, low: 26 },
  { kind: "snow", high: 30, low: 18 }, { kind: "heat", high: 97, low: 74 }, { kind: "sunny", high: 80, low: 60 }, { kind: "fog", high: 58, low: 49 },
  // Exactly at crops' frost limits.
  { kind: "frost", high: 44, low: 32 }, { kind: "frost", high: 46, low: 30 }, { kind: "cloudy", high: 47, low: 25 }, { kind: "frost", high: 40, low: 22 },
];

/** A scripted start: clear a patch north of the field, build a coop, well, and small barn, and use them. */
function farmstead(): Op[] {
  const ops: Op[] = [];
  for (let y = 6; y <= 10; y++) for (let x = 22; x <= 27; x++) ops.push({ op: "tile", i: y * W + x, patch: { obstacle: null, weeds: false, crop: null } });
  for (const item of ["kit_chickenCoop", "kit_well", "kit_smallBarn"]) ops.push({ op: "give", item, qty: 1, grade: null });
  const build = (x: number, y: number, item: number) => [{ op: "player", x, y, facing: "down" }, { op: "select", i: item }, { op: "applyTool" }];
  ops.push(...build(22, 6, 8), ...build(25, 6, 9), ...build(23, 8, 10));
  for (let d = 0; d < 4; d++) ops.push({ op: "sleep" });
  ops.push({ op: "select", i: 13 });
  ops.push({ op: "player", x: 22, y: 6, facing: "down" }, { op: "interact" }, { op: "player", x: 23, y: 8, facing: "down" }, { op: "interact" });
  ops.push({ op: "select", i: 1 }, { op: "player", x: 25, y: 6, facing: "down" }, { op: "act" }, { op: "interact" });
  // Fell a tree outside the field with a mithril axe, then watch the stump sprout and grow back.
  ops.push({ op: "give", item: "axe_mithril", qty: 1, grade: null }, { op: "selectItem", item: "axe_mithril" });
  ops.push({ op: "tile", i: 7 * W + 30, patch: { obstacle: "tree", weeds: false, crop: null } }, { op: "tile", i: 6 * W + 30, patch: { obstacle: null, weeds: false } });
  ops.push({ op: "player", x: 30, y: 6, facing: "down" }, { op: "applyTool" });
  // And chop a log with the basic axe, swing by swing.
  ops.push({ op: "tile", i: 7 * W + 29, patch: { obstacle: "log", weeds: false, crop: null } }, { op: "player", x: 29, y: 6, facing: "down" }, { op: "selectItem", item: "axe" });
  for (let k = 0; k < 4; k++) ops.push({ op: "applyTool" });
  // Look at the stump after each night, so its sprouting is in the summaries.
  for (let d = 0; d < 14; d++) ops.push({ op: "sleep" }, { op: "player", x: 30, y: 6, facing: "down" });
  return ops;
}

function playthrough(seed: number, settings: Partial<GameSettings>, steps: number, prelude: Op[] = []) {
  const r = stream(seed * 31 + 7);
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
  let s = newWorld(seed, settings);
  const ops: Op[] = [];
  // Each step stores only the summary fields that changed since the step before.
  const results: Record<string, unknown>[] = [];
  let prev: Record<string, string> = {};
  const run = (op: Op) => {
    const res = apply(s, op);
    s = res.state;
    ops.push(op);
    const full = summary(s, res.text) as Record<string, unknown>;
    const json = Object.fromEntries(Object.entries(full).map(([k, v]) => [k, JSON.stringify(v)]));
    results.push(Object.fromEntries(Object.entries(full).filter(([k]) => json[k] !== prev[k])));
    prev = json;
  };
  // Grandma Rosa's chest holds the starting tools.
  run({ op: "takeAll", id: "chest" });
  for (const op of prelude) run(op);
  for (let n = 0; n < steps; n++) {
    const k = r();
    if (k < 0.3) {
      // Stand next to a garden tile and use the selected item on it.
      const g = r() < 0.85 ? FARM : TOWN.garden;
      const x = g.x0 + Math.floor(r() * (g.x1 - g.x0 + 1)), y = g.y0 + Math.floor(r() * (g.y1 - g.y0 + 1));
      run({ op: "player", x, y: y - 1, facing: "down" });
      run({ op: "select", i: Math.floor(r() * (r() < 0.7 ? 10 : 30)) });
      run({ op: pick(["act", "act", "applyTool", "interact"]) });
      if (r() < 0.5) run({ op: "act" });
    } else if (k < 0.38) run({ op: "give", item: pick(GIVE), qty: 1 + Math.floor(r() * 6), grade: r() < 0.3 ? pick(GRADES) : null });
    else if (k < 0.48) run({ op: "tick", n: 1 + Math.floor(r() * 240) });
    else if (k < 0.53) run({ op: "sleep" });
    else if (k < 0.57) run({ op: "buy", id: pick(BUY), qty: 1 + Math.floor(r() * 3) });
    else if (k < 0.6) run({ op: "ship", slot: Math.floor(r() * 30) });
    else if (k < 0.63) run({ op: "sellNow", slot: Math.floor(r() * 30), qty: 1 + Math.floor(r() * 4) });
    else if (k < 0.66) {
      const c = r();
      if (c < 0.5) run({ op: "swap", a: Math.floor(r() * 30), b: Math.floor(r() * 10) });
      else if (c < 0.8) run({ op: "put", id: "chest", slot: Math.floor(r() * 30) });
      else run({ op: "take", id: "chest", slot: Math.floor(r() * 20) });
    }
    else if (k < 0.7) {
      // Walk around, sliding along walls.
      run({ op: "player", x: 3 + Math.floor(r() * 70), y: 3 + Math.floor(r() * 30), facing: pick(DIRS) });
      for (let m = 0; m < 6; m++) run({ op: "move", dx: pick([-0.35, 0, 0.35, 0.07]), dy: pick([-0.35, 0, 0.35, -0.07]) });
      run({ op: "interact" });
    } else if (k < 0.74) run({ op: "weather", day: Math.floor((s.minute - 360) / 1440) + 1 + Math.floor(r() * 2), w: pick(WEATHERS) });
    else if (k < 0.82) {
      // Visit someone in town.
      const npc = pick(NPCS);
      const pose = npcPose(s, npc, s.minute);
      run({ op: "player", x: Math.round(pose.x), y: Math.round(pose.y) - 1, facing: "down" });
      run({ op: "talk", id: npc.id });
      if (r() < 0.4) run({ op: "gift", id: npc.id });
      const offered = offers(s, npc.id);
      if (offered.length) run({ op: "accept", id: offered[0].id });
      for (const a of questState(s).active) if (questStatus(s, a).progress.done && r() < 0.8) run({ op: "turnIn", id: a.id });
    } else if (k < 0.86) {
      run({ op: "accept", board: Math.floor(r() * 2) });
      run({ op: "expireBoard" });
    } else if (k < 0.9) {
      const mine = s.buildings.filter((b) => b.x < 38 && !["house", "shippingBin"].includes(b.kind));
      if (mine.length) run({ op: "pickUp", id: pick(mine).id });
    } else if (k < 0.93) {
      // A planted plot: crops at all stages, so nights have plenty to grow, kill, and infest.
      const x0 = FARM.x0 + Math.floor(r() * (FARM.x1 - FARM.x0 - 4)), y0 = FARM.y0 + Math.floor(r() * (FARM.y1 - FARM.y0 - 3));
      for (let y = y0; y < y0 + 3; y++) for (let x = x0; x < x0 + 5; x++) {
        run({ op: "tile", i: y * W + x, patch: {
          tilled: true, obstacle: null, weeds: r() < 0.2, mulch: r() < 0.3, moisture: Math.round(r() * 100), familyStreak: Math.floor(r() * 3),
          crop: { id: pick(CROP_ORDER as CropId[]), growth: Math.round(r() * 100) / 100, harvests: Math.floor(r() * 2), dead: false, pests: r() < 0.2 },
        } });
      }
      if (r() < 0.6) run({ op: "sleep" });
    } else if (k < 0.96) {
      // Make a spot interesting: a ripe or dying crop, weeds, or a dry or soaked tile.
      const x = FARM.x0 + Math.floor(r() * (FARM.x1 - FARM.x0 + 1)), y = FARM.y0 + Math.floor(r() * (FARM.y1 - FARM.y0 + 1));
      const crop = pick(CROP_ORDER as CropId[]);
      run({ op: "tile", i: y * W + x, patch: pick([
        { tilled: true, obstacle: null, weeds: false, crop: { id: crop, growth: 1, harvests: 0, dead: false, pests: r() < 0.3 } },
        { tilled: true, obstacle: null, crop: { id: crop, growth: r(), harvests: 0, dead: false, pests: false, stress: Math.floor(r() * 50) } },
        { weeds: true, crop: null },
        { moisture: Math.round(r() * 100), tilled: true },
        { crop: { id: crop, growth: 0.4, harvests: 1, dead: true, pests: false } },
      ]) });
    } else {
      run({ op: "player", x: 10, y: 10, facing: "up" });
      run({ op: pick(["interact", "act"]) });
    }
  }
  return { seed, settings, ops, results, final: finalState(s) };
}

describe("Godot playthroughs", () => {
  const cases: [string, number, Partial<GameSettings>][] = [
    ["classic", 42, {}],
    ["science", 7, { science: PRESETS.science.science, daysPerMonth: 13 }],
    ["sandbox", 2024, { science: PRESETS.sandbox.science, seasons: false, speed: 10 }],
    ["winter", 5, { science: PRESETS.science.science, daysPerMonth: 5, units: "C" }],
  ];
  for (const [name, seed, settings] of cases) {
    it(name, () => golden(`play-${name}`, playthrough(seed, settings, name === "winter" ? 500 : 350, name === "classic" || name === "science" ? farmstead() : [])));
  }

  it("old saves", () => {
    // The GDScript test builds the same old save itself, so only the results are stored here.
    const s = sleep(newWorld(5));
    const oldW = 40;
    const oldTiles = Array.from({ length: oldW * H }, (_, i) => ({ ...s.tiles[Math.floor(i / oldW) * W + (i % oldW)], mulch: i % oldW === 20 && Math.floor(i / oldW) === 20 }));
    const v3 = { ...s, version: 3, tiles: oldTiles, buildings: [...s.buildings.filter((b) => b.x < 38 && b.kind !== "chest"), { id: "store", kind: "store" as const, x: 30, y: 5, data: {} }] };
    const v1: Record<string, unknown> = { ...v3, version: 1, weather: "sunny" };
    delete v1.settings;
    golden("migrations", [v3, v1].map((old) => finalState(loadWorld(JSON.stringify(old))!)));
    expect(loadWorld(JSON.stringify(v1))).not.toBeNull();
  });
});
