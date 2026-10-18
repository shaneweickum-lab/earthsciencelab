import { addItem, buildingAt, faint, facingTile, hourly, newWorld, say, selectedItem, sleep, tally, tileAt, WORLD_VERSION } from "./engine";
import { DAY_END, timeOfDay } from "./clock";
import { ITEMS, sellPrice } from "./items";
import { createMap, FARM_W, GARDEN_ENTRY, GATE_ROWS, H, idx, LANE_X, STALL_ROW, STALL_SIZE, STALL_X0, W } from "./map";
import { expireCritters } from "./nature";
import { cleanChat } from "./chatFilter";
import { on, type GameSettings } from "./settings";
import type { Building, Critter, Listing, MineFloor, Slot, Tile, WorldState } from "./types";

/**
 * Multiplayer: up to 8 farmers in one world. Everyone shares the town, the mine, and the clock;
 * each farmer has their own garden (the west half of the map) reached from a gate on Garden Lane.
 *
 * The single-player engine runs unchanged on a *view*: one garden (or, in town, a wall of
 * woods) stitched to the shared town, with one farmer's bag, coins, and quests. `absorb` splits
 * the result back. The host runs every change through here; everyone else sees the result.
 */

export const MAX_PLAYERS = 8;
/** Width of the town half of the map. */
const TW = W - FARM_W;

export { atGardenExit, GARDEN_ENTRY, GARDEN_EXIT_X, GATE_ROWS, GATE_X, LANE_X, STALL_ROW, STALL_SIZE, STALL_X0 } from "./map";

export type Area = { kind: "garden"; garden: number } | { kind: "town" } | { kind: "mine"; floor: number };

/** One farmer's garden: the west half of a map. */
export interface FarmPart {
  tiles: Tile[];
  buildings: Building[];
  critters: Critter[];
  plots: number[];
  foundWorkbench?: boolean;
}

const PLAYER_KEYS = [
  "coins", "organic", "energy", "maxEnergy", "water", "canSize", "player", "inventory", "selected", "shipping", "journal",
  "harvests", "log", "messages", "introSeen", "quests", "deepest", "tally", "homestead", "friends", "avatar", "placeRot",
] as const;

/** One farmer: everything that's theirs rather than the world's. */
export type PlayerPart = Pick<WorldState, (typeof PLAYER_KEYS)[number]> & {
  id: string;
  name: string;
  garden: number;
  area: Area;
  /** In bed, waiting for everyone else. */
  asleep?: boolean;
};

export type { Listing } from "./types";

/** A chat message, as everyone sees it (already cleaned by the chat filter). */
export interface ChatMessage {
  id: number;
  pid: string;
  name: string;
  text: string;
  minute: number;
  /** Hidden for everyone by the host (after a report). */
  hidden?: boolean;
  /** Who reported it. */
  reports?: string[];
}

/** How many chat messages a world keeps. */
export const CHAT_KEEP = 100;

export interface MultiWorld {
  version: 1;
  id: string;
  name: string;
  /** The farmer who hosts the world (and can turn chat off). */
  hostId?: string;
  chat?: ChatMessage[];
  /** The host has turned chat off. */
  chatOff?: boolean;
  seed: number;
  minute: number;
  weather: WorldState["weather"];
  settings: GameSettings;
  town: { tiles: Tile[]; buildings: Building[]; critters: Critter[] };
  /** Gardens by number (0–7); a garden appears when its farmer joins. */
  farms: Record<number, FarmPart>;
  players: Record<string, PlayerPart>;
  /** Mine floors someone is on: shared, so the rocks one farmer breaks are gone for everyone. */
  mines: Record<number, MineFloor>;
  /** Market stall listings, by garden. */
  stalls: Record<number, Listing[]>;
}

// ───────────────────────── building the world ─────────────────────────

const farmSeed = (seed: number, garden: number) => (garden === 0 ? seed : (seed + garden * 7919) % 2147483647);

/** The west half of a map's rows. */
function westHalf<T>(tiles: T[]): T[] {
  const out: T[] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < FARM_W; x++) out.push(tiles[idx(x, y)]);
  return out;
}

function eastHalf<T>(tiles: T[]): T[] {
  const out: T[] = [];
  for (let y = 0; y < H; y++) for (let x = FARM_W; x < W; x++) out.push(tiles[idx(x, y)]);
  return out;
}

/** The town for a multiplayer world: Garden Lane with its gates, and a market stall for each garden. */
export function multiTown(seed: number): MultiWorld["town"] {
  const { tiles, buildings } = createMap(seed);
  const stalls: Building[] = GATE_ROWS.slice(1).map((_, i) => ({ id: `stall-${i + 1}`, kind: "marketStall", x: STALL_X0 + i + 1, y: STALL_ROW, data: { garden: i + 1 } }));
  for (const b of stalls) tiles[idx(b.x, b.y)] = { ...tiles[idx(b.x, b.y)], ground: "path", obstacle: null, weeds: false };
  return {
    tiles: eastHalf(tiles),
    buildings: [...buildings.filter((b) => b.x >= FARM_W), ...stalls],
    critters: [],
  };
}

/** A new farmer's garden: Grandma Rosa's farm, laid out a little differently for each garden. */
function newFarm(seed: number, garden: number): FarmPart {
  const w = newWorld(farmSeed(seed, garden));
  return { tiles: westHalf(w.tiles), buildings: w.buildings.filter((b) => b.x < FARM_W), critters: [], plots: w.plots ?? [0] };
}

const wildsCache = new Map<number, FarmPart>();

/** What you see west of the lane while you're in town: woods, not anyone's garden. */
function wilds(seed: number): FarmPart {
  let w = wildsCache.get(seed);
  if (!w) {
    const base = westHalf(createMap(seed).tiles);
    w = { tiles: base.map((t, i) => ({ ...t, ground: "forest", obstacle: i % 3 === 0 || i % 7 === 0 ? "tree" : null, weeds: false, crop: null, tilled: false })), buildings: [], critters: [], plots: [] };
    wildsCache.set(seed, w);
  }
  return w;
}

export function newMultiWorld(id: string, name: string, seed: number, settings: GameSettings | undefined, host: { id: string; name: string; avatar?: string }): MultiWorld {
  const base = newWorld(seed, settings);
  const m: MultiWorld = {
    version: 1, id, name, hostId: host.id, chat: [], seed, minute: base.minute, weather: base.weather, settings: base.settings,
    town: multiTown(seed), farms: {}, players: {}, mines: {}, stalls: {},
  };
  return addPlayer(m, host.id, host.name, host.avatar)!;
}

/** Add a farmer with a fresh garden. Null when all 8 gardens are taken. */
export function addPlayer(m: MultiWorld, id: string, name: string, avatar?: string): MultiWorld | null {
  if (m.players[id]) return m;
  const taken = new Set(Object.values(m.players).map((p) => p.garden));
  const garden = [...Array(MAX_PLAYERS).keys()].find((k) => !taken.has(k));
  if (garden === undefined) return null;
  const fresh = newWorld(farmSeed(m.seed, garden), m.settings);
  const player = Object.fromEntries(PLAYER_KEYS.map((k) => [k, fresh[k]])) as unknown as PlayerPart;
  return {
    ...m,
    farms: { ...m.farms, [garden]: m.farms[garden] ?? newFarm(m.seed, garden) },
    players: { ...m.players, [id]: { ...player, avatar: avatar ?? player.avatar, id, name, garden, area: { kind: "garden", garden } } },
  };
}

export const ownerOf = (m: MultiWorld, garden: number) => Object.values(m.players).find((p) => p.garden === garden) ?? null;
export const gardenName = (m: MultiWorld, garden: number) => {
  const o = ownerOf(m, garden);
  return o ? `${o.name}'s garden` : "An empty garden";
};

// ───────────────────────── views ─────────────────────────

/** The garden a farmer's view shows: where they're standing, or (in town or the mine) none. */
const viewGarden = (p: PlayerPart) => (p.area.kind === "garden" ? p.area.garden : null);

/** Stitch a garden (or the woods) to the town into an ordinary world for the engine. */
function stitch(m: MultiWorld, farm: FarmPart, p: PlayerPart): WorldState {
  const tiles: Tile[] = new Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < FARM_W; x++) tiles[idx(x, y)] = farm.tiles[y * FARM_W + x];
    for (let x = FARM_W; x < W; x++) tiles[idx(x, y)] = m.town.tiles[y * TW + x - FARM_W];
  }
  const player = Object.fromEntries(PLAYER_KEYS.map((k) => [k, p[k]]));
  return {
    ...(player as Pick<WorldState, (typeof PLAYER_KEYS)[number]>),
    version: WORLD_VERSION, seed: m.seed, minute: m.minute, weather: m.weather, settings: m.settings,
    tiles, buildings: [...farm.buildings, ...m.town.buildings], critters: [...farm.critters, ...m.town.critters],
    plots: farm.plots, foundWorkbench: farm.foundWorkbench,
    mine: p.area.kind === "mine" ? m.mines[p.area.floor] : undefined,
  };
}

/** What a farmer sees and acts on. */
export function viewFor(m: MultiWorld, pid: string): WorldState {
  const p = m.players[pid];
  const g = viewGarden(p);
  return stitch(m, g === null ? wilds(m.seed) : m.farms[g], p);
}

/** Split a list back into the part that's the same as before (kept as is, for cheap diffs) or new. */
function keepIfSame<T>(next: T[], prev: T[]): T[] {
  return next.length === prev.length && next.every((x, i) => x === prev[i]) ? prev : next;
}

function splitFarm(v: WorldState, prev: FarmPart, garden: number): FarmPart {
  const tiles = keepIfSame(westHalf(v.tiles), prev.tiles);
  const buildings = keepIfSame(v.buildings.filter((b) => b.x < FARM_W), prev.buildings);
  // Critter ids are made per day, so tag each garden's to keep them apart from the town's.
  const critters = keepIfSame(v.critters.filter((c) => c.x < FARM_W).map((c) => (c.id.startsWith("g") && c.id.includes(":") ? c : { ...c, id: `g${garden}:${c.id}` })), prev.critters);
  const same = tiles === prev.tiles && buildings === prev.buildings && critters === prev.critters && v.plots === prev.plots && v.foundWorkbench === prev.foundWorkbench;
  return same ? prev : { tiles, buildings, critters, plots: v.plots ?? prev.plots, foundWorkbench: v.foundWorkbench };
}

function splitTown(v: WorldState, prev: MultiWorld["town"]): MultiWorld["town"] {
  const tiles = keepIfSame(eastHalf(v.tiles), prev.tiles);
  const buildings = keepIfSame(v.buildings.filter((b) => b.x >= FARM_W), prev.buildings);
  const critters = keepIfSame(v.critters.filter((c) => c.x >= FARM_W), prev.critters);
  return tiles === prev.tiles && buildings === prev.buildings && critters === prev.critters ? prev : { tiles, buildings, critters };
}

function splitPlayer(v: WorldState, prev: PlayerPart): PlayerPart {
  const changed = PLAYER_KEYS.filter((k) => v[k] !== prev[k]);
  return changed.length ? { ...prev, ...Object.fromEntries(changed.map((k) => [k, v[k]])) } : prev;
}

/** Put a farmer's changed view back into the world: their garden (if they're in one), the town, the mine, and them. */
export function absorb(m: MultiWorld, pid: string, v: WorldState): MultiWorld {
  let p = m.players[pid];
  const g = viewGarden(p);
  const farm = g === null ? null : splitFarm(v, m.farms[g], g);
  const farms = g === null || farm === m.farms[g] ? m.farms : { ...m.farms, [g]: farm! };
  let mines = m.mines;
  // Going down, coming up, or moving between floors.
  const before = p.area.kind === "mine" ? p.area.floor : null;
  const after = v.mine?.floor ?? null;
  if (after !== null) {
    // Someone else is already on this floor: join them in the cave as it is.
    const shared = before !== after ? m.mines[after] : undefined;
    const floor = shared ?? v.mine!;
    if (floor !== m.mines[after]) mines = { ...mines, [after]: floor };
    if (before !== after) p = { ...p, area: { kind: "mine", floor: after } };
  } else if (before !== null) p = { ...p, area: { kind: "town" } };
  p = splitPlayer(v, p);
  const next: MultiWorld = { ...m, farms, town: splitTown(v, m.town), mines, weather: v.weather, players: p === m.players[pid] ? m.players : { ...m.players, [pid]: p } };
  return dropEmptyMines(next);
}

/** A mine floor nobody's on is forgotten; it's made fresh the next time someone climbs down. */
function dropEmptyMines(m: MultiWorld): MultiWorld {
  const used = new Set(Object.values(m.players).flatMap((p) => (p.area.kind === "mine" ? [p.area.floor] : [])));
  const floors = Object.keys(m.mines).map(Number);
  if (floors.every((f) => used.has(f))) return m;
  return { ...m, mines: Object.fromEntries(floors.filter((f) => used.has(f)).map((f) => [f, m.mines[f]])) };
}

/** Apply an engine function as one farmer. */
export function asPlayer(m: MultiWorld, pid: string, fn: (v: WorldState) => WorldState): MultiWorld {
  if (!m.players[pid]) return m;
  const v = viewFor(m, pid);
  const out = fn(v);
  return out === v ? m : absorb(m, pid, out);
}

/** Leave a farmer a message in their feed. */
function tell(m: MultiWorld, pid: string, text: string): MultiWorld {
  return asPlayer(m, pid, (v) => say(v, text));
}

// ───────────────────────── moving around ─────────────────────────

/** Through a gate on Garden Lane into someone's garden. */
export function enterGate(m: MultiWorld, pid: string, garden: number): MultiWorld {
  const p = m.players[pid];
  if (!p) return m;
  if (!m.farms[garden] || !ownerOf(m, garden)) return tell(m, pid, "Nobody farms this garden yet.");
  const welcome = garden === p.garden ? "Home sweet home." : `Welcome to ${gardenName(m, garden)}! Lend a hand: water, weed, and plant. The harvest is theirs.`;
  const moved: PlayerPart = { ...p, area: { kind: "garden", garden }, player: { ...GARDEN_ENTRY } };
  return tell({ ...m, players: { ...m.players, [pid]: moved } }, pid, welcome);
}

/** Out of a garden by its road, back to its gate in town. */
export function leaveGarden(m: MultiWorld, pid: string): MultiWorld {
  const p = m.players[pid];
  if (!p || p.area.kind !== "garden") return m;
  const y = GATE_ROWS[p.area.garden];
  return { ...m, players: { ...m.players, [pid]: { ...p, area: { kind: "town" }, player: { x: LANE_X, y, facing: "right" } } } };
}


/** Keep a farmer's position (sent often while they walk; the host only stores it). */
export function setPosition(m: MultiWorld, pid: string, pos: WorldState["player"]): MultiWorld {
  const p = m.players[pid];
  if (!p || (p.player.x === pos.x && p.player.y === pos.y && p.player.facing === pos.facing)) return m;
  return { ...m, players: { ...m.players, [pid]: { ...p, player: pos } } };
}

// ───────────────────────── helping in other gardens ─────────────────────────

/**
 * Why a visitor can't do this in someone else's garden, or null if they can. Visitors can cut
 * weeds, water, till, plant, feed the soil, chop, and break rocks; the crops, buildings, chest,
 * and house stay the owner's.
 */
export function helperBlock(m: MultiWorld, pid: string, mode: "act" | "interact"): string | null {
  const p = m.players[pid];
  if (!p || p.area.kind !== "garden" || p.area.garden === p.garden) return null;
  const owner = ownerOf(m, p.area.garden)?.name ?? "the owner";
  const v = viewFor(m, pid);
  const { x, y } = facingTile(v);
  if (x >= FARM_W) return null;
  const b = buildingAt(v, x, y);
  if (b && b.kind !== "shippingBin" && b.kind !== "pathStone" && b.kind !== "flowerBed") return `That belongs to ${owner}.`;
  const t = tileAt(v, x, y);
  const slot = selectedItem(v);
  const def = slot ? ITEMS[slot.item] : null;
  const ripe = !!t?.crop && !t.crop.dead && t.crop.growth >= 1;
  if (ripe && (mode === "interact" || !def || def.kind !== "amendment")) return `Those are ${owner}'s crops to harvest.`;
  if (mode === "act" && def?.kind === "kit") return `Only ${owner} can build here.`;
  return null;
}

// ───────────────────────── market stalls ─────────────────────────

export const stallOf = (m: MultiWorld, garden: number) => m.stalls[garden] ?? [];

/** Put some of a bag stack on your stall, at your price. */
export function stockStall(m: MultiWorld, pid: string, slot: number, qty: number, price: number): MultiWorld {
  const p = m.players[pid];
  const s = p?.inventory[slot];
  if (!p || !s) return m;
  const def = ITEMS[s.item];
  if (!def.sell || def.tool) return tell(m, pid, "You can't sell that at the market.");
  const n = Math.max(1, Math.min(qty, s.qty));
  const each = Math.max(1, Math.round(price));
  const list = stallOf(m, p.garden);
  const same = list.findIndex((l) => l.item === s.item && l.grade === s.grade && l.price === each);
  if (same < 0 && list.length >= STALL_SIZE) return tell(m, pid, `Your stall holds ${STALL_SIZE} kinds of things. Take something off first.`);
  const listing: Listing = { item: s.item, qty: n, grade: s.grade, price: each };
  const stall = same >= 0 ? list.map((l, i) => (i === same ? { ...l, qty: l.qty + n } : l)) : [...list, listing];
  const inventory = p.inventory.map((x, i) => (i === slot ? (x!.qty - n > 0 ? { ...x!, qty: x!.qty - n } : null) : x));
  const next = { ...m, stalls: { ...m.stalls, [p.garden]: stall }, players: { ...m.players, [pid]: { ...p, inventory } } };
  return tell(next, pid, `Put ${n} ${def.name} on your stall for ${each} coins each.`);
}

/** Take a listing back off your stall. */
export function unstockStall(m: MultiWorld, pid: string, listing: number): MultiWorld {
  const p = m.players[pid];
  const l = p && stallOf(m, p.garden)[listing];
  if (!p || !l) return m;
  const back = asPlayer(m, pid, (v) => addItem(v, l.item, l.qty, l.grade) ?? say(v, "Your bag is full."));
  if (back.players[pid].inventory === p.inventory) return back;
  return { ...back, stalls: { ...back.stalls, [p.garden]: stallOf(m, p.garden).filter((_, i) => i !== listing) } };
}

/** Buy from someone's stall: the coins go to them, even if they're not playing right now. */
export function buyFromStall(m: MultiWorld, pid: string, garden: number, listing: number, qty: number): MultiWorld {
  const buyer = m.players[pid];
  const seller = ownerOf(m, garden);
  const l = stallOf(m, garden)[listing];
  if (!buyer || !seller || !l) return m;
  if (seller.id === pid) return tell(m, pid, "That's your own stall.");
  const n = Math.max(1, Math.min(qty, l.qty));
  const cost = n * l.price;
  if (buyer.coins < cost) return tell(m, pid, `That costs ${cost} coins.`);
  let next = asPlayer(m, pid, (v) => {
    const got = addItem(v, l.item, n, l.grade);
    return got ? say({ ...got, coins: got.coins - cost }, `Bought ${n} ${ITEMS[l.item].name} from ${seller.name} for ${cost} coins.`) : say(v, "Your bag is full.");
  });
  if (next.players[pid].coins === buyer.coins) return next;
  next = asPlayer(next, seller.id, (v) => say(tally({ ...v, coins: v.coins + cost }, "sold"), `${buyer.name} bought ${n} ${ITEMS[l.item].name} from your stall: +${cost} coins.`));
  const stall = stallOf(m, garden).flatMap((x, i) => (i !== listing ? [x] : x.qty - n > 0 ? [{ ...x, qty: x.qty - n }] : []));
  return { ...next, stalls: { ...next.stalls, [garden]: stall } };
}

/** What a stall listing would fetch at the store, for a suggested price. */
export const storePrice = (item: string, grade: Slot["grade"], organic: boolean) => sellPrice(ITEMS[item], grade, organic);

// ───────────────────────── time ─────────────────────────

/** Run an engine function on every garden, as its farmer, keeping the town from the first. */
function eachGarden(m: MultiWorld, fn: (v: WorldState, p: PlayerPart) => WorldState): MultiWorld {
  let next = m;
  let first = true;
  for (const p of Object.values(m.players).sort((a, b) => a.garden - b.garden)) {
    const home = { ...next.players[p.id], area: { kind: "garden", garden: p.garden } as Area };
    const v = stitch(next, next.farms[p.garden], home);
    const out = fn(v, home);
    const farm = splitFarm(out, next.farms[p.garden], p.garden);
    const player = splitPlayer(out, next.players[p.id]);
    next = {
      ...next,
      farms: { ...next.farms, [p.garden]: farm },
      players: { ...next.players, [p.id]: player },
      ...(first ? { town: splitTown(out, next.town), minute: out.minute, weather: out.weather } : {}),
    };
    first = false;
  }
  return next;
}

/**
 * The shared clock moves on: an hour of weather and growth in every garden at once. At 2 AM,
 * with Bedtime on, `night` is true and the host ends the day for everyone.
 */
export function tickMulti(m: MultiWorld, minutes: number): { world: MultiWorld; night: boolean } {
  let next = m;
  let left = minutes;
  while (left > 0) {
    const tod = timeOfDay(next.minute);
    const toHour = 60 - (tod % 60);
    const step = Math.min(left, toHour);
    next = { ...next, minute: next.minute + step };
    left -= step;
    if (step === toHour) next = eachGarden(next, (v) => expireCritters(hourly(v)));
    if (timeOfDay(next.minute) >= DAY_END) {
      if (on(next, "bedtime")) return { world: next, night: true };
      next = { ...next, minute: next.minute - (timeOfDay(next.minute) - DAY_END) - 1 };
      break;
    }
  }
  return { world: next, night: false };
}

/** Go to bed (or get up again). */
export function setAsleep(m: MultiWorld, pid: string, asleep: boolean): MultiWorld {
  const p = m.players[pid];
  return p ? { ...m, players: { ...m.players, [pid]: { ...p, asleep } } } : m;
}

/** True when everyone playing right now is in bed, so the night can pass. */
export const everyoneAsleep = (m: MultiWorld, online: string[]) => online.length > 0 && online.every((id) => m.players[id]?.asleep);

/**
 * The night passes for every garden, including farmers who aren't playing. Anyone still up at
 * 2 AM (in `awake`) faints, as in single-player. Everyone wakes up at home.
 */
export function nightMulti(m: MultiWorld, awake: string[] = []): MultiWorld {
  const next = eachGarden({ ...m, mines: {} }, (v, p) => (awake.includes(p.id) ? faint(v) : sleep(v)));
  const players = Object.fromEntries(Object.values(next.players).map((p) => [p.id, { ...p, asleep: false, area: { kind: "garden", garden: p.garden } as Area }]));
  return { ...next, players };
}

// ───────────────────────── chat ─────────────────────────

/** Say something to everyone in the world. Dropped if chat is off or nothing's left after cleaning. */
export function sayInChat(m: MultiWorld, pid: string, raw: string): MultiWorld {
  const p = m.players[pid];
  if (!p || m.chatOff) return m;
  const text = cleanChat(raw);
  if (!text) return m;
  const chat = m.chat ?? [];
  const id = (chat.at(-1)?.id ?? 0) + 1;
  return { ...m, chat: [...chat, { id, pid, name: p.name, text, minute: m.minute }].slice(-CHAT_KEEP) };
}

/** The host turns chat off (or back on) for everyone. */
export function setChatOff(m: MultiWorld, pid: string, off: boolean): MultiWorld {
  if (pid !== m.hostId || !!m.chatOff === off) return m;
  return { ...m, chatOff: off };
}

function updateMessage(m: MultiWorld, id: number, fn: (c: ChatMessage) => ChatMessage): MultiWorld {
  const chat = m.chat ?? [];
  const i = chat.findIndex((c) => c.id === id);
  if (i < 0) return m;
  const next = fn(chat[i]);
  return next === chat[i] ? m : { ...m, chat: chat.map((c, k) => (k === i ? next : c)) };
}

/** Report a message to the host (once per farmer; not your own). */
export function reportChat(m: MultiWorld, pid: string, id: number): MultiWorld {
  if (!m.players[pid]) return m;
  return updateMessage(m, id, (c) => (c.pid === pid || c.reports?.includes(pid) ? c : { ...c, reports: [...(c.reports ?? []), pid] }));
}

/** The host hides a message for everyone, or (with `hide` false) dismisses its reports. */
export function hideChat(m: MultiWorld, pid: string, id: number, hide = true): MultiWorld {
  if (pid !== m.hostId) return m;
  return updateMessage(m, id, (c) => (hide ? { ...c, hidden: true } : { ...c, reports: [] }));
}

/** Messages the host still needs to look at. */
export const reportedChat = (m: MultiWorld) => (m.chat ?? []).filter((c) => !c.hidden && (c.reports?.length ?? 0) > 0);
