import { describe, expect, it } from "vitest";
import { addItem, applyTool, countItem, harvest, loadWorld, newWorld, saveWorld, sellNow, ship, sleep, WORLD_VERSION } from "./engine";
import { expectedGrade, GRADE_INFO, GRADES, harvestAmount } from "./grades";
import { idx, OLD_H, PLOTS, W } from "./map";
import { DEFAULT_SETTINGS, PRESETS, type FeatureId } from "./settings";
import type { Grade, Tile, WorldState } from "./types";

const X = 15, Y = 20;

function world(cropGrades: boolean, extra: Partial<Record<FeatureId, boolean>> = {}): WorldState {
  const s = newWorld(5, { ...DEFAULT_SETTINGS, science: { ...PRESETS.classic.science, cropGrades, ...extra } });
  return withTile({ ...s, plots: PLOTS.map((p) => p.id), player: { x: X, y: Y - 1, facing: "down" } }, X, Y, { obstacle: null, weeds: false, tilled: true, crop: null, boost: 0 });
}

function withTile(s: WorldState, x: number, y: number, patch: Partial<Tile>): WorldState {
  const tiles = [...s.tiles];
  tiles[idx(x, y)] = { ...tiles[idx(x, y)], ...patch };
  return { ...s, tiles };
}

const at = (s: WorldState) => s.tiles[idx(X, Y)];
const soil = (v: number) => ({ om: v, life: v, structure: v, water: v, nutrients: v, ph: 6.5 });
const ripe = (id: "beans" | "carrot" = "beans", stress = 0) => ({ id, growth: 1, harvests: 0, dead: false, pests: false, stress });

function compost(s: WorldState, times: number): WorldState {
  let w = addItem(s, "compost", times)!;
  w = { ...w, selected: w.inventory.findIndex((x) => x?.item === "compost") };
  for (let i = 0; i < times; i++) w = applyTool(w);
  return w;
}

describe("crop grades", () => {
  it("go from E (lowest) to S (highest), and higher grades sell for more", () => {
    expect(GRADES).toEqual(["E", "D", "C", "B", "A", "S"]);
    for (let i = 1; i < GRADES.length; i++) expect(GRADE_INFO[GRADES[i]].price).toBeGreaterThan(GRADE_INFO[GRADES[i - 1]].price);
  });

  it("with grading on, healthier soil grows a higher grade", () => {
    const poor = withTile(world(true), X, Y, { soil: { ...soil(5), ph: 4.5 }, crop: ripe() });
    const rich = withTile(world(true), X, Y, { soil: soil(90), crop: ripe() });
    expect(expectedGrade(poor, at(poor)).grade).toBe("E");
    expect(expectedGrade(rich, at(rich)).grade).toBe("S");
  });

  it("with grading on, a stressed crop gets a lower grade and amendments add a bonus", () => {
    const calm = withTile(world(true), X, Y, { soil: soil(60), crop: ripe("beans", 0) });
    const stressed = withTile(world(true), X, Y, { soil: soil(60), crop: ripe("beans", 500) });
    const grade = (s: WorldState) => GRADES.indexOf(expectedGrade(s, at(s)).grade);
    expect(grade(stressed)).toBeLessThan(grade(calm));
    const boosted = withTile(calm, X, Y, { boost: 6 });
    expect(grade(boosted)).toBeGreaterThan(grade(calm));
  });

  it("with grading off, soil health doesn't matter and compost raises the grade", () => {
    const rich = withTile(world(false), X, Y, { soil: soil(95), crop: ripe() });
    expect(expectedGrade(rich, at(rich)).grade).toBe("E");
    const expectAfter = (times: number, grade: Grade) => {
      const s = compost(world(false), times);
      expect(expectedGrade(s, at(s)).grade).toBe(grade);
    };
    expectAfter(1, "C");
    expectAfter(2, "A");
    expectAfter(3, "S");
  });

  it("harvest amounts roll within the crop's range and scale with grade, up to triple at S", () => {
    const s = world(true);
    const roll = (grade: Grade, n = 400) => Array.from({ length: n }, (_, i) => harvestAmount({ ...s, minute: s.minute + i * 7 }, i, "beans", grade));
    const c = roll("C");
    expect(Math.min(...c)).toBe(2);
    expect(Math.max(...c)).toBe(5);
    const e = roll("E");
    expect(Math.max(...e)).toBeLessThanOrEqual(3);
    const sGrade = roll("S");
    expect(Math.max(...sGrade)).toBeLessThanOrEqual(15);
    expect(Math.max(...sGrade)).toBeGreaterThanOrEqual(12);
    expect(sGrade.reduce((a, b) => a + b) / sGrade.length).toBeGreaterThan(c.reduce((a, b) => a + b) / c.length * 1.8);
  });

  it("harvesting stores the grade, says it, and uses up the amendments", () => {
    let s = compost(withTile(world(false), X, Y, { crop: null }), 3);
    s = withTile(s, X, Y, { crop: ripe("carrot") });
    s = harvest(s, X, Y);
    expect(countItem(s, "crop_carrot", "S")).toBeGreaterThanOrEqual(5);
    expect(s.messages.at(-1)!.text).toMatch(/Grade S!/);
    expect(at(s).boost).toBe(0);
  });

  it("keeps grades in separate stacks and prices sales and shipping by grade", () => {
    let s = addItem(world(true), "crop_tomato", 2, "S")!;
    s = addItem(s, "crop_tomato", 2, "E")!;
    const slots = s.inventory.filter((x) => x?.item === "crop_tomato");
    expect(slots.map((x) => x!.grade)).toEqual(["S", "E"]);
    const sIdx = s.inventory.findIndex((x) => x?.grade === "S");
    const eIdx = s.inventory.findIndex((x) => x?.grade === "E");
    const sellS = sellNow(s, sIdx, 1).coins - s.coins;
    const sellE = sellNow(s, eIdx, 1).coins - s.coins;
    expect(sellS).toBeGreaterThan(sellE * 4);
    const shipped = sleep(ship(s, sIdx));
    expect(shipped.coins - s.coins).toBe(sellS * 2);
  });

  it("older saves load with no amendment points or stress", () => {
    const s = world(true);
    const old = { ...s, version: 2, tiles: s.tiles.slice(0, W * OLD_H).map((t) => ({ ...t, boost: undefined })) };
    const up = loadWorld(JSON.stringify(old))!;
    expect(up.version).toBe(WORLD_VERSION);
    expect(expectedGrade(up, up.tiles[idx(X, Y)]).grade).toBeDefined();
    expect(loadWorld(saveWorld(up))).not.toBeNull();
  });
});
