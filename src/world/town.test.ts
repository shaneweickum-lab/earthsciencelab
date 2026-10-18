import { describe, expect, it } from "vitest";
import { startOfDay } from "./clock";
import { addItem, buildingAt, countItem, isWalkable, LESSONS, loadWorld, newWorld as freshFarm, saveWorld, sleep, WORLD_VERSION } from "./engine";
import { FARM_W, H, idx, OLD_H, TOWN, W } from "./map";
import { accept, boardRequests, expireBoard, goalProgress, offers, QUEST_BY_ID, questState, questStatus, turnIn } from "./quests";
import { ITEMS } from "./items";
import { friendship, giveGift, hearts, NPC_BY_ID, NPCS, npcInFront, npcPose, route, talk } from "./town";
import type { WorldState } from "./types";

/** A farm that's done Grandma Rosa's lessons, so the townsfolk offer their quests. */
const newWorld = (seed?: number): WorldState => ({ ...freshFarm(seed), quests: { active: [], done: [...LESSONS] } });

const at = (s: WorldState, hour: number, day = 1) => ({ ...s, minute: startOfDay(day) + (hour - 6) * 60 });

describe("the town", () => {
  const s = newWorld(3);
  it("sits east of the farm, joined by a road through the forest", () => {
    expect(buildingAt(s, 45, 7)?.kind).toBe("store");
    expect(buildingAt(s, 30, 6)).toBeNull(); // the store moved off the farm
    const road = route(s, [10, 11], [56, 18]);
    expect(road.at(-1)).toEqual([56, 18]);
    expect(road.length).toBeGreaterThan(40);
    for (const [x, y] of road) expect(isWalkable(s, x, y)).toBe(true);
  });
  it("has the community garden overgrown and waiting", () => {
    const g = TOWN.garden;
    const tile = s.tiles[idx(g.x0 + 2, g.y0 + 2)];
    expect(tile.ground).toBe("farm");
    expect(goalProgress(s, { kind: "gardenCleared", percent: 80 }).done).toBe(false);
  });
  it("doesn't let you build in town", async () => {
    const { canPlace } = await import("./engine");
    expect(canPlace(s, "composter", 50, 14)).toMatch(/your own farm/);
    expect(canPlace(s, "composter", 20, 20) ?? "").not.toMatch(/your own farm/);
  });
});

describe("townsfolk", () => {
  const s = newWorld(3);
  it("can walk every part of their daily route", () => {
    for (const npc of NPCS) {
      for (let i = 0; i < npc.schedule.length; i++) {
        const a = npc.schedule[(i - 1 + npc.schedule.length) % npc.schedule.length];
        const b = npc.schedule[i];
        const path = route(s, [a.x, a.y], [b.x, b.y]);
        expect(path.at(-1), `${npc.id} → ${b.doing}`).toEqual([b.x, b.y]);
        expect(path.length, `${npc.id} can't reach ${b.doing}`).toBeGreaterThan(Math.abs(a.x - b.x) + Math.abs(a.y - b.y));
      }
    }
  });
  it("follow their schedules, walking between stops and going indoors at night", () => {
    const mei = NPC_BY_ID.mei;
    const noonish = npcPose(s, mei, startOfDay(1) + (12 - 6) * 60 + 1);
    expect(noonish.moving).toBe(true);
    const settled = npcPose(s, mei, startOfDay(1) + (12 - 6) * 60 + 59);
    expect([settled.x, settled.y]).toEqual([54, 18]);
    expect(npcPose(s, mei, startOfDay(1) + (23 - 6) * 60).visible).toBe(false);
  });
  it("can be talked to when you face them", () => {
    const june = NPC_BY_ID.june.schedule[0];
    const w = { ...at(s, 7), player: { x: june.x, y: june.y + 1, facing: "up" as const } };
    expect(npcInFront(w)?.id).toBe("june");
  });
  it("become friends: one chat and one gift a day count", () => {
    let w = at(s, 9);
    w = talk(w, "luis").state;
    expect(friendship(w, "luis").met).toBe(true);
    const after1 = friendship(w, "luis").points;
    w = talk(w, "luis").state;
    expect(friendship(w, "luis").points).toBe(after1);
    w = addItem(w, "crop_corn", 3)!;
    w = { ...w, selected: w.inventory.findIndex((x) => x?.item === "crop_corn") };
    const loved = giveGift(w, "luis");
    expect(friendship(loved.state, "luis").points).toBe(after1 + 80);
    expect(giveGift(loved.state, "luis").text).toMatch(/already/);
    expect(countItem(loved.state, "crop_corn")).toBe(2);
  });
  it("share a story when you reach a new heart level", () => {
    let w = at(s, 9);
    w = { ...w, friends: { pip: { points: 320, met: true } } };
    const r = talk(w, "pip");
    expect(r.text).toMatch(/Gerald/);
    expect(friendship(r.state, "pip").stories).toContain(3);
    expect(hearts(r.state, "pip")).toBe(3);
  });
});

describe("quests", () => {
  it("are offered when their needs are met", () => {
    const s = newWorld(3);
    expect(offers(s, "amara").map((q) => q.id)).toEqual(["feed-the-soil"]);
    expect(offers(s, "luis").map((q) => q.id)).toEqual(["dig-deeper", "first-carrots"]);
    expect(offers(s, "pip").map((q) => q.id)).toEqual([]); // worms need a shovel; the rainbow needs 2 hearts
    const tools = { ...s, quests: { active: [], done: [...LESSONS, "dig-deeper", "feed-the-soil", "soak-it-up"] } };
    expect(offers(tools, "amara").map((q) => q.id)).toEqual(["soil-check"]);
    expect(offers(tools, "pip").map((q) => q.id)).toEqual(["pip-worms"]);
    const done = { ...s, quests: { active: [], done: [...LESSONS, "dig-deeper", "feed-the-soil", "soak-it-up", "soil-check"] } };
    expect(offers(done, "amara").map((q) => q.id)).toEqual(["sour-soil", "community-garden"]);
  });

  it("the science-tool quests read progress from your own garden", () => {
    let s = newWorld(3);
    const garden = s.tiles.map((t, i) => ({ t, i })).filter(({ t, i }) => t.ground === "farm" && i % W < FARM_W).slice(0, 6);
    const tiles = [...s.tiles];
    for (const { i } of garden) tiles[i] = { ...tiles[i], tilled: true, crop: { id: "carrot", growth: 0, harvests: 0, dead: false, pests: false }, moisture: 70, boost: 2 };
    s = { ...s, tiles };
    const goal = (id: string) => goalProgress(s, QUEST_BY_ID[id].steps[0].goal);
    expect(goal("dig-deeper")).toMatchObject({ have: 6, done: true });
    expect(goal("feed-the-soil")).toMatchObject({ have: 3, done: true });
    expect(goal("soak-it-up")).toMatchObject({ have: 6, done: true });
    s = accept(s, "dig-deeper");
    const r = turnIn(s, "dig-deeper");
    expect(r.finished).toBe(true);
    expect(r.state.coins - s.coins).toBe(ITEMS.shovel.price);
  });

  it("deliveries take the lowest qualifying grade and pay the reward", () => {
    let s = accept(newWorld(3), "first-carrots");
    s = addItem(s, "crop_carrot", 3, "S")!;
    s = addItem(s, "crop_carrot", 3, "D")!;
    expect(questStatus(s, questState(s).active[0]).progress).toMatchObject({ have: 5, need: 5, done: true });
    const coins = s.coins;
    const r = turnIn(s, "first-carrots");
    expect(r.finished).toBe(true);
    expect(countItem(r.state, "crop_carrot", "D")).toBe(0);
    expect(countItem(r.state, "crop_carrot", "S")).toBe(1);
    expect(r.state.coins).toBe(coins + 120);
    expect(countItem(r.state, "seed_corn")).toBe(4);
    expect(questState(r.state).done).toContain("first-carrots");
  });

  it("grade requirements are checked", () => {
    let s = accept(newWorld(3), "best-tomato");
    s = addItem(s, "crop_tomato", 4, "B")!;
    expect(questStatus(s, questState(s).active[0]).progress.done).toBe(false);
    s = addItem(s, "crop_tomato", 1, "S")!;
    expect(questStatus(s, questState(s).active[0]).progress.done).toBe(true);
  });

  it("the community garden project goes step by step", () => {
    let s = accept(newWorld(3), "community-garden");
    const g = TOWN.garden;
    const tiles = s.tiles.map((t, i) => {
      const x = i % W, y = Math.floor(i / W);
      return x >= g.x0 && x <= g.x1 && y >= g.y0 && y <= g.y1 ? { ...t, weeds: false, obstacle: null } : t;
    });
    s = { ...s, tiles };
    let r = turnIn(s, "community-garden");
    expect(r.finished).toBe(false);
    expect(questState(r.state).active[0].step).toBe(1);
    s = addItem(r.state, "compost", 6)!;
    r = turnIn(s, "community-garden");
    expect(countItem(r.state, "compost")).toBe(0);
    s = { ...r.state, tiles: r.state.tiles.map((t, i) => {
      const x = i % W, y = Math.floor(i / W);
      return x >= g.x0 && x < g.x0 + 6 && y === g.y0 ? { ...t, tilled: true, crop: { id: "clover", growth: 0.2, harvests: 0, dead: false, pests: false } } : t;
    }) };
    r = turnIn(s, "community-garden");
    expect(r.finished).toBe(true);
    for (const n of NPCS) expect(friendship(r.state, n.id).points).toBeGreaterThanOrEqual(100);
  });

  it("the notice board posts two requests a day that pay well and expire after 3 days", () => {
    const s = newWorld(9);
    const reqs = boardRequests(s);
    expect(reqs).toHaveLength(2);
    expect(boardRequests(s)).toEqual(reqs);
    const r0 = reqs[0];
    const goal = r0.board.goal;
    if (goal.kind !== "deliver") throw new Error("expected a delivery");
    let w = accept(s, r0.id, r0.board);
    w = addItem(w, goal.items[0].item, goal.items[0].qty, "S")!;
    const done = turnIn(w, r0.id);
    expect(done.state.coins).toBe(w.coins + r0.board.reward.coins!);
    expect(friendship(done.state, r0.board.npc).points).toBe(30);
    const later = expireBoard({ ...accept(s, r0.id, r0.board), minute: startOfDay(6) });
    expect(questState(later).active).toHaveLength(0);
  });
});

describe("saves from before the town", () => {
  it("keep the farm and gain the town", () => {
    const s = sleep(newWorld(5));
    const oldW = 40;
    const oldTiles = Array.from({ length: oldW * OLD_H }, (_, i) => {
      const x = i % oldW, y = Math.floor(i / oldW);
      return { ...s.tiles[y * W + x], mulch: x === 20 && y === 20 };
    });
    const old = { ...s, version: 3, tiles: oldTiles, buildings: [...s.buildings.filter((b) => b.x < FARM_W), { id: "store", kind: "store" as const, x: 30, y: 5, data: {} }] };
    const up = loadWorld(JSON.stringify(old))!;
    expect(up.version).toBe(WORLD_VERSION);
    expect(up.tiles).toHaveLength(W * H);
    expect(up.tiles[idx(20, 20)].mulch).toBe(true);
    expect(up.buildings.filter((b) => b.kind === "store")).toHaveLength(1);
    expect(up.buildings.find((b) => b.kind === "store")!.x).toBeGreaterThan(FARM_W);
    expect(loadWorld(saveWorld(up))).not.toBeNull();
  });

  it("including the very first saves, which had no settings either", () => {
    const s = newWorld(5);
    const oldW = 40;
    const tiles = Array.from({ length: oldW * OLD_H }, (_, i) => s.tiles[Math.floor(i / oldW) * W + (i % oldW)]);
    const v1: Record<string, unknown> = { ...s, version: 1, weather: "sunny", tiles, buildings: s.buildings.filter((b) => b.x < FARM_W) };
    delete v1.settings;
    const up = loadWorld(JSON.stringify(v1))!;
    expect(up).not.toBeNull();
    expect(up.version).toBe(WORLD_VERSION);
    expect(up.tiles).toHaveLength(W * H);
    expect(up.settings.daysPerMonth).toBeGreaterThan(0);
    expect(up.weather[1].kind).toBeTruthy();
  });
});
