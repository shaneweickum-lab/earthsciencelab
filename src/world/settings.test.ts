import { readdirSync, readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { dateOf, daysPerYear, formatDate, msPerGameMinute, seasonLabel, seasonOf, seasonStartDay, startOfDay, yearFraction } from "./clock";
import { addItem, applyTool, growthFactor, knownSoil, loadWorld, newWorld, saveWorld, sleep, tick, WORLD_VERSION } from "./engine";
import { expectedGrade } from "./grades";
import { cropDays, tempFactor } from "./items";
import { idx } from "./map";
import {
  DEFAULT_SETTINGS, FEATURE_IDS, normalizeSettings, PRESETS, presetOf, SCIENCE_FEATURES, type FeatureId, type GameSettings,
} from "./settings";
import type { Tile, WorldState } from "./types";
import { weatherFor, type DayWeather } from "./weather";

const X = 15, Y = 20;
const allOn = PRESETS.science.science;

function world(science: Partial<Record<FeatureId, boolean>> = {}, extra: Partial<GameSettings> = {}): WorldState {
  let s = newWorld(7, { ...DEFAULT_SETTINGS, ...extra, science: { ...allOn, ...science } });
  s = withTile(s, X, Y - 1, { obstacle: null, weeds: false });
  return { ...s, player: { x: X, y: Y - 1, facing: "down" } };
}

function withTile(s: WorldState, x: number, y: number, patch: Partial<Tile>): WorldState {
  const tiles = [...s.tiles];
  tiles[idx(x, y)] = { ...tiles[idx(x, y)], ...patch };
  return { ...s, tiles };
}

function holding(s: WorldState, item: string): WorldState {
  const got = addItem(s, item, 3)!;
  return { ...got, selected: got.inventory.findIndex((x) => x?.item === item) };
}

function forceWeather(s: WorldState, w: DayWeather): WorldState {
  const all: WorldState["weather"] = {};
  for (let d = 1; d <= 120; d++) all[d] = w;
  return { ...s, weather: all };
}

const MILD: DayWeather = { kind: "sunny", high: 72, low: 58 };
const at = (s: WorldState) => s.tiles[idx(X, Y)];
const crop = (id: Tile["crop"] extends infer C ? (C extends { id: infer I } ? I : never) : never, extra = {}) =>
  ({ id, growth: 0.3, harvests: 0, dead: false, pests: false, ...extra }) as NonNullable<Tile["crop"]>;

describe("science feature registry", () => {
  it("every feature has text, and ids are unique", () => {
    expect(new Set(FEATURE_IDS).size).toBe(FEATURE_IDS.length);
    for (const f of SCIENCE_FEATURES) for (const k of ["label", "science", "on", "off"] as const) expect(f[k].length).toBeGreaterThan(3);
  });

  it("every feature is checked in the game, and every check names a registered feature", () => {
    const dir = path.join(process.cwd(), "src/world");
    const src = readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts")).map((f) => readFileSync(path.join(dir, f), "utf8")).join("\n")
      .replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""); // ignore examples in comments
    const used = new Set([...src.matchAll(/\bon\(\s*\w+\s*,\s*"(\w+)"\s*\)/g)].map((m) => m[1]));
    for (const id of FEATURE_IDS) expect(used.has(id), `feature "${id}" is never checked with on(state, "${id}")`).toBe(true);
    for (const id of used) expect(FEATURE_IDS as string[], `on(state, "${id}") isn't registered`).toContain(id);
  });

  it("presets match their descriptions", () => {
    expect(Object.values(PRESETS.sandbox.science).every((v) => !v)).toBe(true);
    expect(Object.values(PRESETS.science.science).every(Boolean)).toBe(true);
    expect(presetOf(DEFAULT_SETTINGS.science)).toBe("classic");
    expect(presetOf({ ...allOn, weeds: false })).toBe("custom");
  });

  it("settings are clamped and filled in", () => {
    const s = normalizeSettings({ speed: 999, daysPerMonth: 1, units: "C" });
    expect(s.speed).toBe(60);
    expect(s.daysPerMonth).toBe(5);
    expect(s.units).toBe("C");
    expect(s.science).toEqual(DEFAULT_SETTINGS.science);
  });
});

describe("calendar", () => {
  const cal = (daysPerMonth: number, seasons = true) => ({ daysPerMonth, seasons });
  it("seasons start on the 21st with 30-day months and the 3rd with 5-day months", () => {
    expect(seasonStartDay(30)).toBe(21);
    expect(seasonStartDay(5)).toBe(3);
    expect(seasonStartDay(10)).toBe(7);
    expect(formatDate(1, cal(30))).toBe("March 21");
    expect(formatDate(1, cal(5))).toBe("March 3");
    // 90-day seasons: summer begins June 21, fall September 21, winter December 21.
    expect(seasonOf(91, cal(30))).toBe("Summer");
    expect(formatDate(91, cal(30))).toBe("June 21");
    expect(formatDate(181, cal(30))).toBe("September 21");
    expect(formatDate(271, cal(30))).toBe("December 21");
    expect(seasonOf(271, cal(30))).toBe("Winter");
    expect(formatDate(16, cal(5))).toBe("June 3");
    expect(seasonOf(16, cal(5))).toBe("Summer");
  });
  it("has 12 months a year and rolls the year over in January", () => {
    expect(daysPerYear(cal(30))).toBe(360);
    expect(dateOf(1, cal(30))).toEqual({ year: 1, month: 2, dayOfMonth: 21 });
    const jan1 = 360 - (2 * 30 + 20) + 1;
    expect(dateOf(jan1, cal(30))).toEqual({ year: 2, month: 0, dayOfMonth: 1 });
    expect(yearFraction(1, cal(30))).toBe(0);
  });
  it("seasons off is one endless growing season", () => {
    for (let d = 1; d < 400; d += 37) {
      expect(seasonOf(d, cal(30, false))).toBe("Summer");
      expect(seasonLabel(d, cal(30, false))).toBe("Growing season");
    }
  });
  it("time speed runs from real time to one game hour per real minute", () => {
    expect(msPerGameMinute(1)).toBe(60000);
    expect(msPerGameMinute(60)).toBe(1000);
  });
});

describe("climate", () => {
  const cal = { daysPerMonth: 30, seasons: true };
  const year = Array.from({ length: 360 }, (_, i) => weatherFor(11, i + 2, cal));
  it("winter brings freezing nights and summer brings warm days", () => {
    const winter = year.slice(275, 355);
    const summer = year.slice(100, 140);
    expect(Math.min(...winter.map((w) => w.low))).toBeLessThanOrEqual(25);
    expect(Math.max(...summer.map((w) => w.high))).toBeGreaterThanOrEqual(85);
    expect(winter.some((w) => w.kind === "snow")).toBe(true);
    expect(summer.some((w) => w.kind === "snow" || w.kind === "frost")).toBe(false);
  });
  it("snow only falls when it's near freezing, and frost only on freezing nights", () => {
    for (const w of year) {
      if (w.kind === "snow") expect(w.high).toBeLessThanOrEqual(34);
      if (w.kind === "frost") expect(w.low).toBeLessThanOrEqual(32);
    }
  });
  it("with seasons off it stays mild: no frost or snow", () => {
    for (let d = 2; d < 200; d++) {
      const w = weatherFor(3, d, { daysPerMonth: 30, seasons: false });
      expect(w.low).toBeGreaterThanOrEqual(50);
      expect(w.high).toBeLessThanOrEqual(90);
      expect(["snow", "frost"]).not.toContain(w.kind);
    }
  });
});

describe("crop timing and temperature", () => {
  it("uses seed-packet days at 30-day months and scales down for shorter months", () => {
    expect(cropDays("carrot", 30)).toBe(70);
    expect(cropDays("beans", 30)).toBe(55);
    expect(cropDays("carrot", 5)).toBe(12);
    expect(cropDays("beans", 30, true)).toBe(7);
    // Even the slowest crop fits inside one season.
    for (const L of [5, 10, 20, 30]) expect(cropDays("squash", L)).toBeLessThanOrEqual(3 * L + 10);
  });
  it("cool-season crops grow in chilly weather; warm-season crops don't", () => {
    expect(tempFactor("cool", 50)).toBeGreaterThan(0);
    expect(tempFactor("warm", 50)).toBe(0);
    expect(tempFactor("warm", 80)).toBe(1);
    expect(tempFactor("cool", 95)).toBeLessThan(1);
  });
});

describe("each science feature can be switched off", () => {
  const growth = (s: WorldState) => growthFactor(s, X, Y).factor;

  it("watering: dry soil stalls crops only when on, and soil doesn't dry when off", () => {
    const s = (v: boolean) => forceWeather(withTile(world({ watering: v }), X, Y, { tilled: true, moisture: 5, crop: crop("carrot") }), MILD);
    expect(growth(s(true))).toBeLessThan(growth(s(false)));
    expect(at(tick(withTile(s(false), X, Y, { moisture: 60 }), 600)).moisture).toBe(60);
  });

  it("waterlogging: soggy, packed soil slows growth only when on", () => {
    const s = (v: boolean) => forceWeather(withTile(world({ waterlogging: v }), X, Y, { tilled: true, moisture: 100, crop: crop("carrot"), soil: { ...at(world()).soil, structure: 20 } }), MILD);
    expect(growth(s(true))).toBeLessThan(growth(s(false)));
  });

  it("ph and nutrients only change growth when on", () => {
    const sour = (v: boolean) => forceWeather(withTile(world({ ph: v }), X, Y, { tilled: true, moisture: 60, crop: crop("carrot"), soil: { ...at(world()).soil, ph: 4.5 } }), MILD);
    expect(growth(sour(true))).toBeLessThan(growth(sour(false)));
    const poor = (v: boolean) => forceWeather(withTile(world({ nutrients: v }), X, Y, { tilled: true, moisture: 60, crop: crop("carrot"), soil: { ...at(world()).soil, nutrients: 5, life: 5, structure: 5, water: 5 } }), MILD);
    expect(growth(poor(true))).toBeLessThan(growth(poor(false)));
  });

  it("weeds and pests only slow crops, and only appear, when on", () => {
    const weedy = (v: boolean) => forceWeather(withTile(world({ weeds: v }), X, Y, { tilled: true, moisture: 60, crop: crop("carrot"), weeds: true }), MILD);
    expect(growth(weedy(true))).toBeLessThan(growth(weedy(false)));
    const bugs = (v: boolean) => forceWeather(withTile(world({ pests: v }), X, Y, { tilled: true, moisture: 60, crop: crop("carrot", { pests: true }) }), MILD);
    expect(growth(bugs(true))).toBeLessThan(growth(bugs(false)));
    const clean = (v: boolean) => {
      const s = world({ weeds: v, pests: v });
      return sleep(forceWeather({ ...s, tiles: s.tiles.map((t) => (t.ground === "farm" ? { ...t, weeds: false, obstacle: null, tilled: true, crop: crop("carrot"), familyStreak: 3 } : t)) }, MILD));
    };
    expect(clean(true).tiles.some((t) => t.weeds || t.crop?.pests)).toBe(true);
    expect(clean(false).tiles.some((t) => t.weeds || t.crop?.pests)).toBe(false);
  });

  it("tillage only hurts soil structure when on", () => {
    const till = (v: boolean) => applyTool(holding(withTile(world({ tillage: v }), X, Y, { obstacle: null, weeds: false, tilled: false, ground: "farm" }), "hoe"));
    const before = at(world()).soil.structure;
    expect(at(till(true)).soil.structure).toBeLessThan(before);
    expect(at(till(false)).soil.structure).toBe(before);
  });

  it("frost only kills tender crops when on, and the greenhouse protects them", () => {
    const cold: DayWeather = { kind: "frost", high: 40, low: 26 };
    const s = (v: boolean) => sleep(forceWeather(withTile(world({ frost: v }), X, Y, { tilled: true, moisture: 60, crop: crop("beans") }), cold));
    expect(at(s(true)).crop!.dead).toBe(true);
    expect(at(s(false)).crop!.dead).toBe(false);
    const gh = sleep(forceWeather(withTile(world(), X, Y, { tilled: true, greenhouse: true, crop: crop("beans") }), cold));
    expect(at(gh).crop!.dead).toBe(false);
  });

  it("temperature: warm-season crops stall on a cold day only when on", () => {
    const chilly: DayWeather = { kind: "cloudy", high: 50, low: 40 };
    const s = (v: boolean, id: "beans" | "carrot") => forceWeather(withTile(world({ temperature: v }), X, Y, { tilled: true, moisture: 60, crop: crop(id) }), chilly);
    expect(growth(s(true, "beans"))).toBe(0);
    expect(growth(s(true, "carrot"))).toBeGreaterThan(0);
    expect(growth(s(false, "beans"))).toBeGreaterThan(0);
  });

  it("planting seasons: off lets any crop grow in winter", () => {
    const winter = (v: boolean) => {
      const s = world({ plantingSeasons: v, temperature: false });
      return forceWeather(withTile({ ...s, minute: startOfDay(46) }, X, Y, { tilled: true, moisture: 60, crop: crop("tomato") }), MILD);
    };
    expect(growth(winter(true))).toBe(0);
    expect(growth(winter(false))).toBeGreaterThan(0);
  });

  it("pollinators: a beehive only helps when on", () => {
    const hive = (v: boolean) => {
      const s = forceWeather(withTile(world({ pollinators: v }), X, Y, { tilled: true, moisture: 60, crop: crop("carrot") }), MILD);
      return { ...s, buildings: [...s.buildings, { id: "hive", kind: "beehive" as const, x: X + 2, y: Y, data: {} }] };
    };
    expect(growth(hive(true))).toBeGreaterThan(growth(hive(false)));
  });

  it("hidden soil: off shows every number without testing", () => {
    const s = world({ soilTesting: false });
    expect(knownSoil(s, at(s))).toEqual({ lab: true, shovel: true, water: true });
    const hidden = world({ soilTesting: true });
    expect(knownSoil(hidden, at(hidden)).lab).toBe(false);
  });

  it("energy: tools are free when off", () => {
    const s = holding(withTile(world({ energy: false }), X, Y, { weeds: true, obstacle: null }), "scythe");
    expect(applyTool({ ...s, energy: 0 }).tiles[idx(X, Y)].weeds).toBe(false);
  });

  it("bedtime: off means no fainting at 2 AM", () => {
    const s = tick(world({ bedtime: false }), 21 * 60);
    expect(s.coins).toBe(300);
    expect(s.log).toBeNull();
    expect(tick(world({ bedtime: true }), 21 * 60).log?.notes[0]).toMatch(/fainted/);
  });

  it("erosion, soil life, and rotation have no effect when off", () => {
    const stormy: DayWeather = { kind: "storm", high: 70, low: 60 };
    const bare = (v: boolean) => sleep(forceWeather(withTile(world({ erosion: v, soilLife: false }), X, Y, { tilled: true, crop: null, mulch: false, weeds: false }), stormy));
    expect(at(bare(true)).soil.structure).toBeLessThan(at(bare(false)).soil.structure);
    const overnight = (v: boolean) => sleep(forceWeather(withTile(world({ soilLife: v, erosion: false, weeds: false }), X, Y, { tilled: true, mulch: true }), MILD));
    expect(at(overnight(false)).soil).toEqual(at(world()).soil);
    expect(at(overnight(true)).soil).not.toEqual(at(world()).soil);
    const replant = (v: boolean) => {
      const s = holding(withTile(world({ rotation: v }), X, Y, { tilled: true, weeds: false, obstacle: null, lastFamily: "root" }), "seed_carrot");
      return applyTool(s).messages.at(-1)!.text;
    };
    expect(replant(true)).toMatch(/Same plant family/);
    expect(replant(false)).not.toMatch(/Same plant family/);
  });
});

describe("crop grades feature", () => {
  it("cropGrades: off means soil health no longer sets the grade", () => {
    const rich = (v: boolean) => withTile(world({ cropGrades: v }), X, Y, { tilled: true, crop: crop("carrot", { growth: 1 }), soil: { om: 95, life: 95, structure: 95, water: 95, nutrients: 95, ph: 6.5 } });
    expect(expectedGrade(rich(true), at(rich(true))).grade).toBe("S");
    expect(expectedGrade(rich(false), at(rich(false))).grade).toBe("E");
  });
});

describe("saving", () => {
  it("keeps settings, and upgrades old saves", () => {
    const s = world({ weeds: false }, { speed: 10, daysPerMonth: 20, units: "C" });
    expect(loadWorld(saveWorld(s))!.settings).toEqual(s.settings);
    const old = { ...s, version: 1, settings: undefined, weather: { 1: "sunny", 2: "rain" } };
    const up = loadWorld(JSON.stringify(old))!;
    expect(up.version).toBe(WORLD_VERSION);
    expect(up.settings).toEqual(DEFAULT_SETTINGS);
    expect(up.weather[1].kind).toBe("sunny");
  });
});
