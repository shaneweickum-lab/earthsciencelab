import { describe, expect, it } from "vitest";
import { addItem, applyTool, countItem, LESSONS, loadWorld, newWorld, saveWorld, sellNow, sleep, takeAllFromChest, WORLD_VERSION } from "./engine";
import { idx, PLOTS } from "./map";
import { claimLesson, offers, questState, skipTutorial, tutorialDone, tutorialStep } from "./quests";
import type { Tile, WorldState } from "./types";

const P = PLOTS[0];
const withTile = (s: WorldState, x: number, y: number, patch: Partial<Tile>): WorldState => {
  const tiles = [...s.tiles];
  tiles[idx(x, y)] = { ...tiles[idx(x, y)], ...patch };
  return { ...s, tiles };
};
const holding = (s: WorldState, item: string): WorldState => ({ ...s, selected: Math.max(0, s.inventory.findIndex((x) => x?.item === item)) });
/** Stand above a spot in the first plot, facing it. */
const at = (s: WorldState, x: number, y: number): WorldState => ({ ...s, player: { x, y: y - 1, facing: "down" } });
const lesson = (s: WorldState) => tutorialStep(s)?.number ?? null;

describe("Grandma Rosa's lessons", () => {
  it("start a new farm on the first lesson, with only the scythe in the chest", () => {
    const s = newWorld(4);
    expect(lesson(s)).toBe(1);
    expect(tutorialStep(s)!.progress.done).toBe(false);
    expect(claimLesson(s)).toBe(s);
    expect(tutorialDone(s)).toBe(false);
  });

  it("teach each step and hand over the tools as you go", () => {
    let s = takeAllFromChest(newWorld(4), "chest");
    expect(tutorialStep(s)!.progress.done).toBe(true);
    s = claimLesson(s);
    expect(lesson(s)).toBe(2);

    // Cut weeds with the scythe, for real, in your own plot.
    s = holding(s, "scythe");
    for (let k = 0; k < 5; k++) {
      const x = P.x0 + k;
      s = applyTool(at(withTile(s, x, P.y0 + 1, { weeds: true, obstacle: null, crop: null }), x, P.y0 + 1));
    }
    expect(tutorialStep(s)!.progress).toMatchObject({ have: 5, done: true });
    s = claimLesson(s);
    expect(countItem(s, "hoe")).toBe(1);

    // Till 4 spots.
    s = holding(s, "hoe");
    for (let k = 0; k < 4; k++) s = applyTool(at(withTile(s, P.x0 + k, P.y0 + 1, { weeds: false, obstacle: null, tilled: false }), P.x0 + k, P.y0 + 1));
    s = claimLesson(s);
    expect(countItem(s, "seed_carrot")).toBe(6);

    // Plant them.
    s = holding(s, "seed_carrot");
    for (let k = 0; k < 4; k++) s = applyTool(at(s, P.x0 + k, P.y0 + 1));
    expect(lesson(s)).toBe(4);
    s = claimLesson(s);
    expect(countItem(s, "can")).toBe(1);

    // Water them until they're damp.
    s = holding(s, "can");
    for (let k = 0; k < 4; k++) for (let n = 0; n < 2; n++) s = applyTool(at(s, P.x0 + k, P.y0 + 1));
    s = claimLesson(s);
    expect(lesson(s)).toBe(6);
    expect(countItem(s, "compost")).toBe(3);

    // Feed the soil.
    s = holding(s, "compost");
    for (let k = 0; k < 2; k++) s = applyTool(at(s, P.x0 + k, P.y0 + 1));
    s = claimLesson(s);
    expect(countItem(s, "axe")).toBe(1);

    // Wood and stone: having them is enough, and you keep them.
    s = claimLesson(addItem(s, "wood", 5)!);
    expect(countItem(s, "pickaxe")).toBe(1);
    expect(countItem(s, "wood")).toBe(5);
    const coins = s.coins;
    s = claimLesson(addItem(s, "stone", 5)!);
    expect(s.coins).toBe(coins + 50);

    // A night's sleep, then a sale.
    s = claimLesson(sleep(s));
    expect(lesson(s)).toBe(10);
    s = sellNow(s, s.inventory.findIndex((x) => x?.item === "fiber"), 1);
    s = claimLesson(s);
    expect(tutorialStep(s)).toBeNull();
    expect(tutorialDone(s)).toBe(true);
    expect(s.messages.at(-1)!.text).toMatch(/Love, Grandma Rosa/);
  });

  it("keep the townsfolk's quests for after the lessons", () => {
    const s = newWorld(4);
    expect(offers(s, "luis")).toEqual([]);
    expect(offers(skipTutorial(s), "luis").map((q) => q.id)).toContain("dig-deeper");
  });

  it("can be skipped, handing over every tool still to come", () => {
    const s = skipTutorial(takeAllFromChest(newWorld(4), "chest"));
    for (const t of ["scythe", "hoe", "can", "axe", "pickaxe"]) expect(countItem(s, t)).toBe(1);
    expect(countItem(s, "seed_carrot")).toBe(12);
    expect(s.coins).toBe(300 + 150);
    expect(tutorialDone(s)).toBe(true);
    expect(questState(s).active).toEqual([]);
    expect(skipTutorial(s)).toBe(s);
  });

  it("put rewards in Grandma's chest when your bag is full", () => {
    let s = claimLesson(takeAllFromChest(newWorld(4), "chest"));
    s = { ...s, inventory: s.inventory.map((x) => x ?? { item: "stone", qty: 1 }), tally: { weeds: 5 } };
    s = claimLesson(s);
    expect(countItem(s, "hoe")).toBe(0);
    expect(s.buildings.find((b) => b.id === "chest")!.data.items!.some((x) => x?.item === "hoe")).toBe(true);
  });

  it("count as done on older farms", () => {
    const s = newWorld(4);
    const old = loadWorld(JSON.stringify({ ...s, version: 8, quests: { active: [], done: ["welcome"] } }))!;
    expect(old.version).toBe(WORLD_VERSION);
    expect(tutorialDone(old)).toBe(true);
    expect(questState(old).done).toEqual(["welcome", ...LESSONS]);
    expect(tutorialStep(loadWorld(saveWorld(s))!)!.number).toBe(1);
  });
});
