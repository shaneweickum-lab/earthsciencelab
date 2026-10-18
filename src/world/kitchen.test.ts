import { describe, expect, it } from "vitest";
import {
  addItem, applyTool, buildingAt, countItem, craft, eat, enterGate, interactTarget, isWalkable, leaveFarm, loadWorld, newWorld, placeBuilding,
  fairPrice, recipeStatus, rotateBuilding, stallChance, stockStall, tick, turnPlacing, unstockStall, WORLD_VERSION,
} from "./engine";
import { COOKING, ITEMS, RECIPES, SHOP_UNLOCKS } from "./items";
import { GARDEN_ENTRY, GATE_ROWS, GATE_X, LANE_X, PLOTS, STALL_ROW, STALL_X0, TOWN } from "./map";
import { multiTown } from "./multi";
import { applyOp } from "./ops";
import { QUEST_BY_ID } from "./quests";
import type { Building, WorldState } from "./types";

/** A farm with every plot, standing on clear ground at (15, 19) facing down. */
function farm(): WorldState {
  const s = newWorld(42);
  const tiles = s.tiles.map((t, i) => {
    const x = i % 76, y = Math.floor(i / 76);
    return x >= 13 && x <= 19 && y >= 17 && y <= 23 ? { ...t, obstacle: null, weeds: false } : t;
  });
  return { ...s, tiles, plots: PLOTS.map((p) => p.id), player: { x: 15, y: 19, facing: "down" } };
}

const give = (s: WorldState, items: [string, number][]) => items.reduce((w, [id, n]) => addItem(w, id, n)!, s);
const recipe = (id: string) => RECIPES.find((r) => r.id === id)!;
const station = (kind: "stove" | "oven", x: number, y: number): Building => ({ id: `${kind}-${x}-${y}`, kind, x, y, data: {} });
const last = (s: WorldState) => s.messages.at(-1)!.text;

describe("rotating what you build", () => {
  it("turns the next thing you place, and things already built", () => {
    let s = give(farm(), [["kit_fence", 2]]);
    s = { ...s, selected: s.inventory.findIndex((x) => x?.item === "kit_fence") };
    s = turnPlacing(s);
    expect(s.placeRot).toBe(1);
    s = placeBuilding(s, s.selected, 15, 20);
    const fence = buildingAt(s, 15, 20)!;
    expect(fence.rot).toBe(1);
    s = rotateBuilding(rotateBuilding(rotateBuilding(s)));
    expect(buildingAt(s, 15, 20)!.rot).toBe(0);
  });

  it("leaves town buildings and Grandma's chest alone", () => {
    const s = newWorld(42);
    const chest = s.buildings.find((b) => b.id === "chest")!;
    const at = { ...s, player: { x: chest.x, y: chest.y + 1, facing: "up" as const } };
    expect(rotateBuilding(at)).toBe(at);
  });
});

describe("cooking", () => {
  it("makes knife-only food anywhere, and needs the utensil", () => {
    let s = give(farm(), [["crop_carrot", 2]]);
    expect(last(craft(s, "carrotSticks"))).toMatch(/kitchen knife/);
    s = craft(give(s, [["knife", 1]]), "carrotSticks");
    expect(countItem(s, "carrotSticks")).toBe(1);
    expect(countItem(s, "knife")).toBe(1); // utensils aren't used up
    expect(s.journal).toContain("sun-to-supper");
  });

  it("cooks on a stove with a pan, and needs a stove and oven side by side for pie", () => {
    let s = give(farm(), [["egg", 2], ["pan", 1], ["knife", 1], ["crop_squash", 1], ["flour", 1], ["honey", 1]]);
    s = { ...s, buildings: [...s.buildings, station("stove", 14, 20), station("oven", 22, 22)] };
    expect(last(craft(s, "friedEgg"))).toMatch(/stove/);
    expect(countItem(craft(s, "friedEgg", "stove-14-20"), "friedEgg")).toBe(1);
    // The oven is too far from the stove to count as one kitchen.
    expect(recipeStatus(s, recipe("pie"), "stove-14-20").missingStations).toEqual(["oven"]);
    s = { ...s, buildings: [...s.buildings, station("oven", 16, 20)] };
    expect(recipeStatus(s, recipe("pie"), "stove-14-20").ok).toBe(true);
    s = craft(s, "pie", "oven-16-20");
    expect(countItem(s, "pie")).toBe(1);
    expect(countItem(s, "honey")).toBe(0);
  });

  it("uses real items, and only ones the game has", () => {
    for (const r of COOKING) {
      expect(ITEMS[r.id].kind).toBe("food");
      for (const t of r.tools ?? []) expect(ITEMS[t].kind).toBe("utensil");
      for (const i of r.inputs) expect(ITEMS[i.item], i.item).toBeDefined();
      // Cooking pays: a dish sells for more than what went into it.
      const worth = r.inputs.reduce((n, i) => n + (ITEMS[i.item].sell ?? 0) * i.qty, 0);
      expect(ITEMS[r.id].sell!, r.id).toBeGreaterThanOrEqual(worth);
    }
    expect(recipe("flour").station).toBe("grinder");
  });

  it("opens the kitchen from a stove", () => {
    let s = farm();
    s = { ...s, buildings: [...s.buildings, station("stove", 15, 20)] };
    expect(interactTarget(s)).toBe("craft");
  });
});

describe("eating", () => {
  it("gives back energy, up to full", () => {
    let s = give({ ...farm(), energy: 50 }, [["beanStew", 1], ["carrotSticks", 2]]);
    s = { ...s, selected: s.inventory.findIndex((x) => x?.item === "beanStew") };
    s = applyTool(s);
    expect(s.energy).toBe(100);
    expect(countItem(s, "beanStew")).toBe(0);
    const full = eat(s, s.inventory.findIndex((x) => x?.item === "carrotSticks"));
    expect(countItem(full, "carrotSticks")).toBe(2);
    expect(last(full)).toMatch(/full of energy/);
  });

  it("works from the bag by slot", () => {
    const s = give({ ...farm(), energy: 10 }, [["carrotSticks", 1]]);
    const ate = applyOp(s, "eat", [s.inventory.findIndex((x) => x?.item === "carrotSticks")]);
    expect(ate.energy).toBe(10 + ITEMS.carrotSticks.energy!);
  });
});

describe("the kitchen in the store", () => {
  it("opens with Grandma's recipe card from Mei", () => {
    expect(SHOP_UNLOCKS.kit_stove).toBe("recipe-card");
    const q = QUEST_BY_ID["recipe-card"];
    expect(q.reward.items!.map((i) => i.item)).toEqual(expect.arrayContaining(["knife", "pan"]));
    expect(ITEMS.pot.price).toBeGreaterThan(0);
  });
});

describe("Garden Lane", () => {
  it("separates the farm from town, with your gate on the lane", () => {
    const s = newWorld(42);
    expect(isWalkable(s, 39, TOWN.road)).toBe(false); // the hedge
    expect(isWalkable(s, LANE_X, 10)).toBe(true);
    const gate = buildingAt(s, GATE_X, GATE_ROWS[0])!;
    expect(gate.kind).toBe("gardenGate");
    expect(gate.data.garden).toBe(0);
    expect(interactTarget({ ...s, player: { x: LANE_X, y: GATE_ROWS[0], facing: "left" } })).toBe("gate");
  });

  it("takes you home through your gate, and out along the farm road", () => {
    const s = newWorld(42);
    const home = enterGate({ ...s, player: { x: LANE_X, y: GATE_ROWS[0], facing: "left" } }, 0);
    expect(home.player).toEqual(GARDEN_ENTRY);
    expect(last(enterGate(s, 3))).toMatch(/Brambles/);
    const out = leaveFarm({ ...s, player: { x: 37, y: TOWN.road, facing: "right" } });
    expect(out.player).toEqual({ x: LANE_X, y: GATE_ROWS[0], facing: "right" });
    expect(leaveFarm(s)).toBe(s); // nowhere near the road's end
  });

  it("is the same lane multiplayer uses, with a stall for each garden", () => {
    const town = multiTown(42);
    expect(town.buildings.filter((b) => b.kind === "gardenGate")).toHaveLength(8);
    expect(town.buildings.filter((b) => b.kind === "marketStall").map((b) => b.x)).toEqual([0, 1, 2, 3, 4, 5, 6, 7].map((k) => STALL_X0 + k));
  });

  it("comes to older farms, which keep what they've built", () => {
    const s = newWorld(42);
    const old = { ...s, version: 9, buildings: s.buildings.filter((b) => b.kind !== "gardenGate" && b.kind !== "marketStall"), player: { x: 39, y: TOWN.road, facing: "right" as const } };
    const up = loadWorld(JSON.stringify(old))!;
    expect(up.version).toBe(WORLD_VERSION);
    expect(up.buildings.filter((b) => b.kind === "gardenGate")).toHaveLength(8);
    expect(up.buildings.some((b) => b.id === "stall-0")).toBe(true);
    expect(isWalkable(up, Math.round(up.player.x), Math.round(up.player.y))).toBe(true);
    // A version 9 farm bought its plots, so it keeps them.
    expect(up.plots).toEqual([0]);
  });
});

describe("your market stall", () => {
  const stocked = (price: number) => {
    let s = give(farm(), [["crop_tomato", 4]]);
    s = stockStall(s, s.inventory.findIndex((x) => x?.item === "crop_tomato"), 3, price);
    return s;
  };

  it("takes things from your bag, and gives them back", () => {
    let s = stocked(40);
    expect(s.stall).toEqual([{ item: "crop_tomato", qty: 3, price: 40 }]);
    expect(countItem(s, "crop_tomato")).toBe(1);
    s = unstockStall(s, 0);
    expect(s.stall).toEqual([]);
    expect(countItem(s, "crop_tomato")).toBe(4);
    expect(last(stockStall(give(farm(), [["knife", 1]]), 0, 1, 10))).toMatch(/can't sell/);
  });

  it("sells to townsfolk during the day, faster at a fair price", () => {
    const fair = stocked(fairPrice(farm(), { item: "crop_tomato" }));
    expect(stallChance(fair, fair.stall![0])).toBeCloseTo(0.35, 2);
    expect(stallChance(fair, { ...fair.stall![0], price: 1000 })).toBe(0);
    const bargain = stocked(10);
    // Townsfolk shop from 8 AM; the day starts at 6.
    const later = tick(bargain, 5 * 60);
    expect(later.stall).toEqual([]);
    expect(later.coins).toBe(bargain.coins + 30);
    expect(later.messages.some((m) => /from your stall/.test(m.text))).toBe(true);
    const greedy = tick(stocked(1000), 5 * 60);
    expect(greedy.stall![0].qty).toBe(3);
  });

  it("stands in the square and opens from there", () => {
    const s = newWorld(42);
    expect(interactTarget({ ...s, player: { x: STALL_X0, y: STALL_ROW - 1, facing: "down" } })).toBe("stall");
  });
});
