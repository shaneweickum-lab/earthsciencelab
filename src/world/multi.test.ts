import { describe, expect, it } from "vitest";
import { applyTool, interact, newWorld, takeAllFromChest } from "./engine";
import { FARM_W, idx, MINE_ENTRANCE, PLOTS, TOWN, W } from "./map";
import {
  absorb, addPlayer, CHAT_KEEP, hideChat, reportChat, reportedChat, sayInChat, setChatOff, asPlayer, atGardenExit, buyFromStall, enterGate, everyoneAsleep, GATE_ROWS, helperBlock, leaveGarden, MAX_PLAYERS,
  newMultiWorld, nightMulti, ownerOf, setAsleep, stallOf, stockStall, tickMulti, unstockStall, viewFor, type MultiWorld,
} from "./multi";
import { skipTutorial } from "./quests";
import type { Tile, WorldState } from "./types";

const P0 = PLOTS[0];

/** A world with a host and a guest who've both done the lessons, so they have their tools. */
function world(): MultiWorld {
  let m = newMultiWorld("w1", "Test Farmers", 1234, undefined, { id: "host", name: "Ana" });
  m = addPlayer(m, "guest", "Ben")!;
  for (const id of ["host", "guest"]) m = asPlayer(m, id, (v) => skipTutorial(takeAllFromChest(v, "chest")));
  return m;
}

const patch = (fn: (v: WorldState) => WorldState) => fn;
const withTile = (x: number, y: number, t: Partial<Tile>) => patch((v) => {
  const tiles = [...v.tiles];
  tiles[idx(x, y)] = { ...tiles[idx(x, y)], ...t };
  return { ...v, tiles };
});
const standAbove = (x: number, y: number, item?: string) => patch((v) => ({
  ...v, player: { x, y: y - 1, facing: "down" }, selected: item ? v.inventory.findIndex((s) => s?.item === item) : v.selected,
}));

describe("multiplayer worlds", () => {
  it("give each farmer their own garden and share one town", () => {
    const m = world();
    expect(Object.keys(m.players)).toEqual(["host", "guest"]);
    expect(m.players.host.garden).toBe(0);
    expect(m.players.guest.garden).toBe(1);
    expect(m.farms[0].tiles).not.toEqual(m.farms[1].tiles);
    // The town has Garden Lane's gates and a stall for every garden.
    expect(m.town.buildings.filter((b) => b.kind === "gardenGate")).toHaveLength(MAX_PLAYERS);
    expect(m.town.buildings.filter((b) => b.kind === "marketStall")).toHaveLength(MAX_PLAYERS);
    // Both start on Grandma's lessons in their own gardens.
    const fresh = addPlayer(m, "c", "Cy")!;
    expect(fresh.players.c.quests!.active[0].id).toBe("lesson-1");
  });

  it("hold up to 8 farmers", () => {
    let m = world();
    for (let i = 2; i < MAX_PLAYERS; i++) m = addPlayer(m, `p${i}`, `P${i}`)!;
    expect(Object.keys(m.players)).toHaveLength(8);
    expect(addPlayer(m, "late", "Late")).toBeNull();
    expect(addPlayer(m, "host", "Ana")).toBe(m);
  });

  it("round-trip a view without changing anything", () => {
    const m = world();
    const v = viewFor(m, "host");
    expect(v.tiles).toHaveLength(newWorld(1).tiles.length);
    const back = absorb(m, "host", v);
    expect(back.farms).toBe(m.farms);
    expect(back.town).toBe(m.town);
    expect(back.players.host).toBe(m.players.host);
  });

  it("let you work your own garden, and keep it yours", () => {
    let m = world();
    const x = P0.x0, y = P0.y0;
    m = asPlayer(m, "host", (v) => applyTool(standAbove(x, y, "hoe")(withTile(x, y, { weeds: false, obstacle: null, tilled: false })(v))));
    expect(m.farms[0].tiles[y * FARM_W + x].tilled).toBe(true);
    expect(m.farms[1].tiles[y * FARM_W + x].tilled).toBe(false);
  });

  it("let visitors help out but not harvest or build", () => {
    let m = world();
    const x = P0.x0 + 1, y = P0.y0;
    // Ben walks Garden Lane from town into Ana's garden.
    m = leaveGarden(m, "guest");
    expect(m.players.guest.area).toEqual({ kind: "town" });
    m = enterGate(m, "guest", 0);
    expect(m.players.guest.area).toEqual({ kind: "garden", garden: 0 });
    expect(viewFor(m, "guest").tiles[idx(x, y)]).toBe(m.farms[0].tiles[y * FARM_W + x]);
    // Watering is helping: it lands in Ana's garden, and Ben's can empties.
    m = asPlayer(m, "guest", (v) => standAbove(x, y, "can")(withTile(x, y, { tilled: true, weeds: false, obstacle: null, moisture: 10 })(v)));
    expect(helperBlock(m, "guest", "act")).toBeNull();
    const water = m.players.guest.water;
    m = asPlayer(m, "guest", applyTool);
    expect(m.farms[0].tiles[y * FARM_W + x].moisture).toBeGreaterThan(10);
    expect(m.players.guest.water).toBe(water - 1);
    // A ripe crop is Ana's to pick.
    m = asPlayer(m, "guest", withTile(x, y, { crop: { id: "carrot", growth: 1, harvests: 0, dead: false, pests: false } }));
    expect(helperBlock(m, "guest", "act")).toMatch(/Ana's crops/);
    expect(helperBlock(m, "guest", "interact")).toMatch(/Ana's crops/);
    expect(helperBlock(m, "host", "act")).toBeNull();
    // And her chest is hers.
    m = asPlayer(m, "guest", patch((v) => ({ ...v, player: { x: 7, y: 10, facing: "up" } })));
    expect(helperBlock(m, "guest", "interact")).toMatch(/belongs to Ana/);
  });

  it("take you back to your gate when you walk out of a garden", () => {
    let m = enterGate(world(), "guest", 0);
    expect(atGardenExit(m.players.guest.player)).toBe(false);
    expect(atGardenExit({ x: 37, y: TOWN.road })).toBe(true);
    m = leaveGarden(m, "guest");
    expect(m.players.guest.player).toMatchObject({ x: 40, y: GATE_ROWS[0] });
    expect(enterGate(m, "guest", 5).players.guest.area).toEqual({ kind: "town" }); // nobody farms garden 5
  });

  it("show woods west of the lane while you're in town", () => {
    const m = leaveGarden(world(), "host");
    const v = viewFor(m, "host");
    expect(v.tiles[idx(20, 20)].ground).toBe("forest");
    expect(v.buildings.some((b) => b.id === "house")).toBe(false);
  });

  it("share a mine floor between farmers on it", () => {
    let m = world();
    m = { ...m, players: Object.fromEntries(Object.entries(m.players).map(([id, p]) => [id, { ...p, quests: { active: [], done: [...p.quests!.done, "reopen-mine"] } }])) };
    const down = (id: string) => {
      m = leaveGarden(m, id);
      m = asPlayer(m, id, patch((v) => ({ ...v, player: { x: MINE_ENTRANCE.x + 1, y: MINE_ENTRANCE.y + 2, facing: "up" } })));
      m = asPlayer(m, id, interact);
    };
    down("host");
    expect(m.players.host.area).toEqual({ kind: "mine", floor: 1 });
    // Ana breaks a rock; then Ben climbs down and finds it gone.
    const floor = m.mines[1];
    const rock = floor.tiles.findIndex((t) => t.obstacle);
    m = { ...m, mines: { 1: { ...floor, tiles: floor.tiles.map((t, i) => (i === rock ? { ...t, obstacle: null } : t)) } } };
    down("guest");
    expect(m.players.guest.area).toEqual({ kind: "mine", floor: 1 });
    expect(m.mines[1].tiles[rock].obstacle).toBeNull();
    expect(viewFor(m, "guest").mine).toBe(m.mines[1]);
  });

  it("run market stalls between farmers", () => {
    let m = world();
    m = asPlayer(m, "host", (v) => ({ ...v, inventory: v.inventory.map((s, i) => (i === 20 ? { item: "crop_carrot", qty: 5, grade: "B" } : s)) }));
    m = stockStall(m, "host", 20, 3, 40);
    expect(stallOf(m, 0)).toEqual([{ item: "crop_carrot", qty: 3, grade: "B", price: 40 }]);
    expect(m.players.host.inventory[20]!.qty).toBe(2);
    // Tools aren't for sale.
    const hoe = m.players.host.inventory.findIndex((s) => s?.item === "hoe");
    expect(stockStall(m, "host", hoe, 1, 10).players.host.messages.at(-1)!.text).toMatch(/can't sell/);
    // Ben buys two; Ana gets the coins.
    const [ana, ben] = [m.players.host.coins, m.players.guest.coins];
    m = buyFromStall(m, "guest", 0, 0, 2);
    expect(m.players.guest.coins).toBe(ben - 80);
    expect(m.players.host.coins).toBe(ana + 80);
    expect(m.players.guest.inventory.some((s) => s?.item === "crop_carrot" && s.qty === 2 && s.grade === "B")).toBe(true);
    expect(stallOf(m, 0)[0].qty).toBe(1);
    expect(m.players.host.tally!.sold).toBe(1);
    // No buying from yourself, or without the coins.
    expect(buyFromStall(m, "host", 0, 0, 1).players.host.coins).toBe(m.players.host.coins);
    const broke = { ...m, players: { ...m.players, guest: { ...m.players.guest, coins: 5 } } };
    expect(buyFromStall(broke, "guest", 0, 0, 1).players.guest.messages.at(-1)!.text).toMatch(/costs 40/);
    // The last one comes back off the stall.
    m = unstockStall(m, "host", 0);
    expect(stallOf(m, 0)).toEqual([]);
    expect(m.players.host.inventory.some((s) => s?.item === "crop_carrot" && s.qty === 3)).toBe(true);
    expect(ownerOf(m, 0)!.name).toBe("Ana");
  });

  it("share one clock, and grow every garden each hour", () => {
    let m = world();
    const x = P0.x0, y = P0.y0;
    for (const id of ["host", "guest"]) m = asPlayer(m, id, withTile(x, y, { tilled: true, weeds: false, obstacle: null, crop: { id: "carrot", growth: 0.2, harvests: 0, dead: false, pests: false }, moisture: 70 }));
    const r = tickMulti(m, 120);
    expect(r.night).toBe(false);
    expect(r.world.minute).toBe(m.minute + 120);
    expect(r.world.farms[0].tiles[y * FARM_W + x].crop!.growth).toBeGreaterThan(0.2);
    expect(r.world.farms[1].tiles[y * FARM_W + x].crop!.growth).toBeGreaterThan(0.2);
  });

  it("pass the night for everyone once the farmers online are in bed", () => {
    let m = world();
    m = leaveGarden(m, "guest");
    expect(everyoneAsleep(m, ["host", "guest"])).toBe(false);
    m = setAsleep(m, "host", true);
    expect(everyoneAsleep(m, ["host", "guest"])).toBe(false);
    expect(everyoneAsleep(m, ["host"])).toBe(true);
    m = asPlayer(m, "guest", (v) => ({ ...v, shipping: [{ item: "fiber", qty: 10 }] }));
    const coins = m.players.guest.coins;
    const day = m.minute;
    m = nightMulti(setAsleep(m, "guest", true));
    expect(m.minute).toBeGreaterThan(day);
    // Everyone wakes at home, rested, and Ben's shipping paid out.
    for (const p of Object.values(m.players)) {
      expect(p.area).toEqual({ kind: "garden", garden: p.garden });
      expect(p.asleep).toBe(false);
      expect(p.energy).toBe(p.maxEnergy);
    }
    expect(m.players.guest.coins).toBe(coins + 10);
    expect(m.players.guest.shipping).toEqual([]);
  });

  it("make anyone still up at 2 AM faint", () => {
    let m = world();
    const r = tickMulti(m, 24 * 60);
    expect(r.night).toBe(true);
    m = nightMulti(setAsleep(r.world, "host", true), ["guest"]);
    expect(m.players.guest.log!.notes[0]).toMatch(/fainted/);
    expect(m.players.host.log!.notes.join(" ")).not.toMatch(/fainted/);
  });

  it("keep the town's buildings and the gardens apart", () => {
    const m = world();
    const v = viewFor(m, "guest");
    expect(v.buildings.filter((b) => b.x < FARM_W).every((b) => m.farms[1].buildings.includes(b))).toBe(true);
    expect(v.tiles.length).toBe(W * (v.tiles.length / W));
  });

  it("keep a cleaned, capped chat log the host can moderate", () => {
    let m = world();
    m = sayInChat(m, "guest", "  hi Ana, visit www.example.com  ");
    expect(m.chat).toHaveLength(1);
    expect(m.chat![0]).toMatchObject({ id: 1, pid: "guest", name: "Ben", text: "hi Ana, visit ***" });
    expect(sayInChat(m, "guest", "   ")).toBe(m);
    expect(sayInChat(m, "stranger", "hello")).toBe(m);
    for (let i = 0; i < CHAT_KEEP + 10; i++) m = sayInChat(m, "host", `message ${i}`);
    expect(m.chat).toHaveLength(CHAT_KEEP);
    expect(m.chat!.at(-1)!.id).toBe(CHAT_KEEP + 11);
    // Only the host turns chat off; then nothing gets through.
    expect(setChatOff(m, "guest", true)).toBe(m);
    const off = setChatOff(m, "host", true);
    expect(sayInChat(off, "guest", "anyone?")).toBe(off);
    // Reports: once per farmer, never your own; the host hides or dismisses.
    const id = m.chat!.at(-1)!.id;
    let r = reportChat(m, "guest", id);
    expect(reportChat(r, "guest", id)).toBe(r);
    expect(reportChat(r, "host", id)).toBe(r);
    expect(reportedChat(r).map((c) => c.id)).toEqual([id]);
    expect(hideChat(r, "guest", id)).toBe(r);
    r = hideChat(r, "host", id);
    expect(r.chat!.at(-1)!.hidden).toBe(true);
    expect(reportedChat(r)).toEqual([]);
    expect(reportedChat(hideChat(reportChat(m, "guest", id), "host", id, false))).toEqual([]);
  });
});
