import { describe, expect, it } from "vitest";
import { loadWorld, newWorld, saveWorld } from "./engine";
import { buyDecor, canPut, DECOR, homestead, moveDecor, placeDecor, resale, rotateDecor, sellDecor, storeDecor, DECOR_BY_ID } from "./homestead";
import type { WorldState } from "./types";

const rich = (): WorldState => ({ ...newWorld(3), coins: 5000 });
const last = (s: WorldState) => s.messages.at(-1)?.text;

describe("homestead", () => {
  it("has a catalog of room and yard pieces with real models", () => {
    expect(DECOR.filter((d) => d.area === "room").length).toBeGreaterThan(30);
    expect(DECOR.filter((d) => d.area === "yard").length).toBeGreaterThan(20);
    expect(new Set(DECOR.map((d) => d.id)).size).toBe(DECOR.length);
    for (const d of DECOR) expect(d.price).toBeGreaterThan(0);
  });

  it("buys with coins into storage, and refuses when you can't afford it", () => {
    let s = buyDecor(rich(), "sofa");
    expect(s.coins).toBe(5000 - DECOR_BY_ID.sofa.price);
    expect(homestead(s).stored.sofa).toBe(1);
    const poor = buyDecor({ ...newWorld(3), coins: 10 }, "sofa");
    expect(poor.coins).toBe(10);
    expect(last(poor)).toMatch(/costs/);
    s = buyDecor(s, "sofa");
    expect(homestead(s).stored.sofa).toBe(2);
  });

  it("places, moves, turns, and stores, without overlaps or leaving the room", () => {
    let s = buyDecor(buyDecor(rich(), "sofa"), "sofa");
    s = placeDecor(s, "room", "sofa", 0, 0);
    expect(homestead(s).room).toHaveLength(1);
    expect(homestead(s).stored.sofa).toBe(1);
    const blocked = placeDecor(s, "room", "sofa", 1, 0);
    expect(homestead(blocked).room).toHaveLength(1);
    expect(last(blocked)).toMatch(/already there/);
    expect(canPut(s, "room", "sofa", 7, 0, 0)).toMatch(/doesn't fit/);
    expect(canPut(s, "room", "sofa", 7, 0, 1)).toBeNull();
    expect(canPut(s, "yard", "sofa", 0, 0, 0)).toMatch(/indoors/);
    const uid = homestead(s).room[0].uid;
    s = moveDecor(s, "room", uid, 3, 2);
    expect(homestead(s).room[0]).toMatchObject({ x: 3, y: 2, rot: 0 });
    s = rotateDecor(s, "room", uid);
    expect(homestead(s).room[0].rot).toBe(1);
    s = storeDecor(s, "room", uid);
    expect(homestead(s).room).toHaveLength(0);
    expect(homestead(s).stored.sofa).toBe(2);
  });

  it("lets rugs lie under furniture and small things stand on tables", () => {
    let s = rich();
    for (const id of ["bigRug", "table", "radio", "radio", "bedSingle"]) s = buyDecor(s, id);
    s = placeDecor(s, "room", "bigRug", 0, 0);
    s = placeDecor(s, "room", "table", 0, 0);
    s = placeDecor(s, "room", "radio", 1, 0);
    expect(homestead(s).room).toHaveLength(3);
    s = placeDecor(s, "room", "bedSingle", 4, 0);
    expect(canPut(s, "room", "radio", 4, 0, 0)).toMatch(/table/);
    // The table can't move with the radio on it.
    const table = homestead(s).room.find((p) => p.item === "table")!;
    expect(last(storeDecor(s, "room", table.uid))).toMatch(/Clear/);
    expect(homestead(moveDecor(s, "room", table.uid, 2, 3)).room.find((p) => p.item === "table")!.x).toBe(0);
  });

  it("sells stored things back for half", () => {
    let s = buyDecor(rich(), "fountain");
    s = sellDecor(s, "fountain");
    expect(s.coins).toBe(5000 - DECOR_BY_ID.fountain.price + resale(DECOR_BY_ID.fountain));
    expect(homestead(s).stored.fountain).toBeUndefined();
    expect(sellDecor(s, "fountain")).toBe(s);
  });

  it("is kept in the save", () => {
    let s = buyDecor(buyDecor(rich(), "oak"), "lantern");
    s = placeDecor(s, "yard", "oak", 2, 2);
    const back = loadWorld(saveWorld(s))!;
    expect(homestead(back)).toEqual(homestead(s));
  });
});
