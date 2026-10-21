import { describe, expect, it } from "vitest";
import { startOfDay } from "./clock";
import {
  addItem, applyTool, bitingNow, buildingAt, buyPlot, canStep, countItem, craft, interactTarget, isWalkable, loadWorld, movePlayer, newWorld,
  nextPlotPrice, plotLocked, saveWorld, tileAt, WORLD_VERSION,
} from "./engine";
import { ALLOTMENT0, ALLOTMENT_RENT, DESTINATIONS, FARM_W, H, idx, MINE_ENTRANCE, OLD_ROWS, OLD_W, PLOTS, POND, RIVER, SEA_Y, TOWN, TRAIL, W } from "./map";
import { addPlayer, newMultiWorld, packMultiWorld, unpackMultiWorld, viewFor, type MultiWorld } from "./multi";
import { applyOp } from "./ops";
import { NPC_BY_ID, route, talk } from "./town";
import type { Tile, WorldState } from "./types";

const at = (s: WorldState, x: number, y: number, facing: WorldState["player"]["facing"] = "down"): WorldState => ({ ...s, player: { x, y, facing } });

describe("the valley", () => {
  const s = newWorld(42);

  it("puts a long country road between the farm and town", () => {
    expect(s.tiles).toHaveLength(W * H);
    const walk = route(s, [41, 11], [TOWN.square.x0, 16]);
    expect(walk.at(-1)).toEqual([TOWN.square.x0, 16]);
    expect(walk.length).toBeGreaterThan(30);
    expect(buildingAt(s, 42, 10)?.kind).toBe("signpost");
  });

  it("has the river with bridges, the beach with a dock, and the forest pond", () => {
    expect(tileAt(s, RIVER.x0, 30)!.ground).toBe("river");
    expect(tileAt(s, RIVER.x0, TOWN.road)!.ground).toBe("dock");
    expect(isWalkable(s, RIVER.x0 + 1, TOWN.road)).toBe(true);
    expect(isWalkable(s, RIVER.x0 + 1, 30)).toBe(false);
    expect(tileAt(s, 60, SEA_Y + 1)!.ground).toBe("sea");
    expect(tileAt(s, 70, SEA_Y + 2)!.ground).toBe("dock");
    expect(buildingAt(s, 74, 74)?.kind).toBe("fishingHut");
    expect(tileAt(s, POND.cx, POND.cy)!.ground).toBe("water");
  });

  it("raises the mountains in terraces you can only climb by the trail", () => {
    const top = tileAt(s, MINE_ENTRANCE.x, MINE_ENTRANCE.y + 2)!;
    expect(top.elev).toBe(3);
    expect(buildingAt(s, MINE_ENTRANCE.x, MINE_ENTRANCE.y)?.kind).toBe("mineEntrance");
    // Up a cliff: no. Up a ramp: yes.
    expect(canStep(s, 105, 20, 106, 20)).toBe(false);
    const ramp = TRAIL.find((t) => t[2])!;
    expect(canStep(s, ramp[0] - 1, ramp[1], ramp[0], ramp[1])).toBe(true);
    // The whole trail is one walk from the road to the mine.
    const walk = route(s, [104, 11], [MINE_ENTRANCE.x, MINE_ENTRANCE.y + 2]);
    expect(walk.at(-1)).toEqual([MINE_ENTRANCE.x, MINE_ENTRANCE.y + 2]);
    for (let i = 1; i < walk.length; i++) expect(canStep(s, ...walk[i - 1], ...walk[i])).toBe(true);
    // And the player can't step off a cliff either.
    const edge = at(s, 105, 20, "right");
    expect(Math.round(movePlayer(edge, 0.4, 0).x)).toBe(105);
  });

  it("keeps everyone's routes on their feet", () => {
    for (const npc of Object.values(NPC_BY_ID)) for (const stop of npc.schedule) expect(isWalkable(s, stop.x, stop.y), `${npc.id} at ${stop.x},${stop.y}`).toBe(true);
  });
});

describe("signposts", () => {
  it("take you around the valley, and the walk takes time", () => {
    const s = at(newWorld(42), 43, 11, "up");
    expect(interactTarget({ ...s, player: { x: 42, y: 11, facing: "up" } })).toBe("travel");
    const beach = applyOp(s, "travel", ["beach"]);
    const d = DESTINATIONS.find((x) => x.id === "beach")!;
    expect([beach.player.x, beach.player.y]).toEqual([d.x, d.y]);
    expect(beach.minute).toBeGreaterThan(s.minute + 10);
    // Away from a signpost, nothing happens.
    const far = at(newWorld(42), 20, 20);
    expect(applyOp(far, "travel", ["beach"])).toBe(far);
  });
});

describe("fishing", () => {
  const fisher = () => {
    let s = addItem(at(newWorld(42), 70, SEA_Y + 1, "left"), "rod", 1)!;
    s = { ...s, selected: s.inventory.findIndex((x) => x?.item === "rod") };
    return s;
  };

  it("lands sea fish off the dock, with a journal page", () => {
    let s = fisher();
    for (let i = 0; i < 40 && !(s.tally?.fished); i++) s = applyTool({ ...s, energy: 100 });
    expect(s.tally?.fished).toBeGreaterThan(0);
    const caught = s.inventory.find((x) => x && ["flounder", "mackerel", "stripedBass", "crab", "kelp"].includes(x.item));
    expect(caught).toBeDefined();
    expect(s.journal).toContain(caught!.item);
  });

  it("has different fish by water, season, and hour", () => {
    const night = { ...newWorld(42), minute: startOfDay(1) + 16 * 60 };
    expect(bitingNow(night, "river").map((c) => c.id)).toContain("catfish");
    expect(bitingNow(newWorld(42), "river").map((c) => c.id)).not.toContain("catfish");
    expect(bitingNow(newWorld(42), "pond").every((c) => c.water === "pond")).toBe(true);
  });

  it("needs water in front of you", () => {
    const s = at(fisher(), 20, 10);
    expect(applyTool(s).messages.at(-1)!.text).toMatch(/Face the water/);
  });

  it("cooks any fish into dinner", () => {
    let s = addItem(addItem(addItem(newWorld(42), "bluegill", 1)!, "knife", 1)!, "pan", 1)!;
    s = { ...s, buildings: [...s.buildings, { id: "stove-x", kind: "stove", x: 14, y: 20, data: {} }] };
    s = craft(s, "panFish", "stove-x");
    expect(countItem(s, "panFish")).toBe(1);
    expect(countItem(s, "bluegill")).toBe(0);
  });

  it("starts with Kai, who hands over his spare rod", () => {
    const r = talk(newWorld(42), "kai");
    expect(countItem(r.state, "rod")).toBe(1);
    expect(r.text).toMatch(/spare rod/);
  });
});

describe("allotments", () => {
  it("rent in the park for a flat price, and don't raise the price of farm plots", () => {
    let s = { ...newWorld(42), coins: 1000 };
    const a = PLOTS[ALLOTMENT0];
    expect(plotLocked(s, a.x0, a.y0)).toBe(true);
    const before = nextPlotPrice(s);
    s = buyPlot(s, ALLOTMENT0);
    expect(s.coins).toBe(1000 - ALLOTMENT_RENT);
    expect(plotLocked(s, a.x0, a.y0)).toBe(false);
    expect(nextPlotPrice(s)).toBe(before);
    expect(tileAt(s, a.x0, a.y0)!.ground).toBe("farm");
  });

  it("are shared community beds in a shared world", () => {
    const m = newMultiWorld("w", "Test", 9, undefined, { id: "ana", name: "Ana" });
    const v = viewFor(m, "ana");
    expect(plotLocked(v, PLOTS[ALLOTMENT0].x0, PLOTS[ALLOTMENT0].y0)).toBe(false);
  });
});

describe("saves", () => {
  it("store only what's changed, and load back the same", () => {
    const s = newWorld(42);
    const raw = saveWorld(s);
    expect(raw.length).toBeLessThan(150_000);
    const back = loadWorld(raw)!;
    expect(back.tiles).toEqual(s.tiles);
    const changed = { ...s, tiles: s.tiles.map((t, i) => (i === idx(15, 20) ? { ...t, tilled: true } : t)) };
    expect(loadWorld(saveWorld(changed))!.tiles[idx(15, 20)].tilled).toBe(true);
  });

  it("grow an old farm into the valley, keeping the farm and the community garden", () => {
    const fresh = newWorld(5);
    // A version 10 save: 76 by 64, the town just past the lane, plants in the farm field and the old garden.
    const oldTiles: Tile[] = [];
    for (let y = 0; y < OLD_ROWS; y++) for (let x = 0; x < OLD_W; x++) {
      const t = fresh.tiles[idx(Math.min(x, W - 1), y)];
      oldTiles.push(x === 15 && y === 20 ? { ...t, tilled: true } : x === 64 && y === 22 ? { ...t, ground: "farm", tilled: true, mulch: true } : t);
    }
    const old = { ...fresh, version: 10, tiles: oldTiles, player: { x: 55, y: 13, facing: "down" as const } };
    const up = loadWorld(JSON.stringify(old))!;
    expect(up.version).toBe(WORLD_VERSION);
    expect(up.tiles).toHaveLength(W * H);
    expect(up.tiles[idx(15, 20)].tilled).toBe(true);
    // The garden moved east with the town, and so did the player.
    expect(up.tiles[idx(64 + 22, 22)].mulch).toBe(true);
    expect(up.player.x).toBe(77);
    expect(isWalkable(up, Math.round(up.player.x), Math.round(up.player.y))).toBe(true);
    expect(up.buildings.find((b) => b.id === "mine-entrance")).toMatchObject({ x: MINE_ENTRANCE.x, y: MINE_ENTRANCE.y });
  });

  it("pack shared worlds too, and grow old ones", () => {
    let m = newMultiWorld("w", "Test", 7, undefined, { id: "ana", name: "Ana" });
    m = addPlayer(m, "ben", "Ben")!;
    const packed = packMultiWorld(m);
    expect(JSON.stringify(packed).length).toBeLessThan(JSON.stringify(m).length / 5);
    expect(unpackMultiWorld(JSON.parse(JSON.stringify(packed)))).toEqual(m);
    // A version 1 world: 64 rows, a 38-wide town.
    const v1 = {
      ...m, version: 1,
      farms: { 0: { ...m.farms[0], tiles: m.farms[0].tiles.slice(0, FARM_W * OLD_ROWS) } },
      players: { ana: { ...m.players.ana, area: { kind: "town" as const }, player: { x: 50, y: 11, facing: "right" as const } } },
      town: { ...m.town, tiles: Array.from({ length: (OLD_W - FARM_W) * OLD_ROWS }, () => m.town.tiles[0]) },
    } as MultiWorld;
    const grown = unpackMultiWorld(v1);
    expect(grown.version).toBe(2);
    expect(grown.farms[0].tiles).toHaveLength(FARM_W * H);
    expect(grown.town.tiles).toHaveLength((W - FARM_W) * H);
    expect(grown.players.ana.player.x).toBe(72);
  });
});
