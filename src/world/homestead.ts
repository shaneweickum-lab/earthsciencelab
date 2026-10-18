import CATALOG from "./decor.json";
import { say as note } from "./engine";
import type { DecorArea, Homestead, Placed, WorldState } from "./types";

/**
 * My Homestead: the player's farmhouse room and front yard, decorated with furniture and garden
 * pieces bought with farm coins. Purely for looks: nothing grows in the yard.
 */
export interface DecorDef {
  id: string;
  name: string;
  price: number;
  area: DecorArea;
  /** The model: public/models/<pack>/<model>.glb, drawn at scale `s`. */
  pack: string;
  model: string;
  s: number;
  /** Cells it covers before turning. */
  w: number;
  d: number;
  /** Rugs lie under everything; small things ("top") can stand on a surface like a table. */
  layer?: "rug" | "top";
  surface?: boolean;
}

export const DECOR: DecorDef[] = CATALOG as DecorDef[];
export const DECOR_BY_ID: Record<string, DecorDef> = Object.fromEntries(DECOR.map((d) => [d.id, d]));

/** Each area's size in cells. */
export const AREA_SIZE: Record<DecorArea, [w: number, d: number]> = { room: [8, 6], yard: [10, 8] };
export const AREA_NAME: Record<DecorArea, string> = { room: "Farmhouse room", yard: "Front yard" };

/** Selling something back gets you half its price. */
export const resale = (def: DecorDef) => Math.floor(def.price / 2);

export const emptyHomestead = (): Homestead => ({ room: [], yard: [], stored: {}, next: 1 });
export const homestead = (state: WorldState): Homestead => state.homestead ?? emptyHomestead();

/** The cells a decoration covers, turned `rot` quarter turns. */
export function footprint(def: DecorDef, rot: number): [w: number, d: number] {
  return rot % 2 ? [def.d, def.w] : [def.w, def.d];
}

function cells(p: Placed): [number, number][] {
  const [w, d] = footprint(DECOR_BY_ID[p.item], p.rot);
  const out: [number, number][] = [];
  for (let y = p.y; y < p.y + d; y++) for (let x = p.x; x < p.x + w; x++) out.push([x, y]);
  return out;
}

const layerOf = (def: DecorDef) => def.layer ?? "item";
const covers = (p: Placed, x: number, y: number) => cells(p).some(([cx, cy]) => cx === x && cy === y);

/** The surface (a table, a counter) under a cell, if any. */
export function surfaceAt(placed: Placed[], x: number, y: number): Placed | undefined {
  return placed.find((p) => DECOR_BY_ID[p.item]?.surface && covers(p, x, y));
}

/** Why a decoration can't stand there, or null if it can. `skip` is a uid to ignore (the one being moved). */
export function canPut(state: WorldState, area: DecorArea, id: string, x: number, y: number, rot: number, skip?: number): string | null {
  const def = DECOR_BY_ID[id];
  if (!def || def.area !== area) return area === "room" ? "That belongs outside." : "That belongs indoors.";
  const [w, d] = footprint(def, rot);
  const [aw, ad] = AREA_SIZE[area];
  if (x < 0 || y < 0 || x + w > aw || y + d > ad) return "That doesn't fit there.";
  const others = homestead(state)[area].filter((p) => p.uid !== skip && DECOR_BY_ID[p.item]);
  const layer = layerOf(def);
  for (let yy = y; yy < y + d; yy++) for (let xx = x; xx < x + w; xx++) {
    const here = others.filter((p) => covers(p, xx, yy));
    if (here.some((p) => layerOf(DECOR_BY_ID[p.item]) === layer)) return "Something is already there.";
    // Small things can sit on the floor or on a table, but not on a bed or a chair.
    if (layer === "top" && here.some((p) => layerOf(DECOR_BY_ID[p.item]) === "item" && !DECOR_BY_ID[p.item].surface)) return "That needs a table or a clear spot.";
    if (layer === "item" && here.some((p) => layerOf(DECOR_BY_ID[p.item]) === "top")) return "Move the little things out of the way first.";
  }
  return null;
}

function withHome(state: WorldState, h: Homestead): WorldState {
  return { ...state, homestead: h };
}

/** Buy a decoration with farm coins. It goes into storage, ready to set out. */
export function buyDecor(state: WorldState, id: string): WorldState {
  const def = DECOR_BY_ID[id];
  if (!def) return state;
  if (state.coins < def.price) return note(state, `The ${def.name.toLowerCase()} costs ${def.price} coins.`);
  const h = homestead(state);
  return note(withHome({ ...state, coins: state.coins - def.price }, { ...h, stored: { ...h.stored, [id]: (h.stored[id] ?? 0) + 1 } }), `Bought the ${def.name.toLowerCase()}.`);
}

/** Set out a stored decoration. */
export function placeDecor(state: WorldState, area: DecorArea, id: string, x: number, y: number, rot = 0): WorldState {
  const h = homestead(state);
  if (!(h.stored[id] > 0)) return state;
  const why = canPut(state, area, id, x, y, rot);
  if (why) return note(state, why);
  const stored = { ...h.stored, [id]: h.stored[id] - 1 };
  if (!stored[id]) delete stored[id];
  return withHome(state, { ...h, stored, next: h.next + 1, [area]: [...h[area], { uid: h.next, item: id, x, y, rot: rot % 4 }] });
}

/** Things standing on a surface (they'd be left floating if it moved). */
const onTop = (placed: Placed[], p: Placed) =>
  DECOR_BY_ID[p.item]?.surface ? placed.filter((q) => layerOf(DECOR_BY_ID[q.item]) === "top" && cells(q).some(([x, y]) => covers(p, x, y))) : [];

/** Move (and turn) a decoration that's already out. */
export function moveDecor(state: WorldState, area: DecorArea, uid: number, x: number, y: number, rot?: number): WorldState {
  const h = homestead(state);
  const p = h[area].find((q) => q.uid === uid);
  if (!p) return state;
  const r = (rot ?? p.rot) % 4;
  if (onTop(h[area], p).length && (x !== p.x || y !== p.y || r !== p.rot)) return note(state, "Clear the things off it first.");
  const why = canPut(state, area, p.item, x, y, r, uid);
  if (why) return note(state, why);
  return withHome(state, { ...h, [area]: h[area].map((q) => (q.uid === uid ? { ...q, x, y, rot: r } : q)) });
}

/** Turn a decoration a quarter turn where it stands. */
export function rotateDecor(state: WorldState, area: DecorArea, uid: number): WorldState {
  const p = homestead(state)[area].find((q) => q.uid === uid);
  return p ? moveDecor(state, area, uid, p.x, p.y, p.rot + 1) : state;
}

/** Put a decoration back into storage. */
export function storeDecor(state: WorldState, area: DecorArea, uid: number): WorldState {
  const h = homestead(state);
  const p = h[area].find((q) => q.uid === uid);
  if (!p) return state;
  if (onTop(h[area], p).length) return note(state, "Clear the things off it first.");
  return withHome(state, { ...h, [area]: h[area].filter((q) => q.uid !== uid), stored: { ...h.stored, [p.item]: (h.stored[p.item] ?? 0) + 1 } });
}

/** Sell a stored decoration back for half its price. */
export function sellDecor(state: WorldState, id: string): WorldState {
  const def = DECOR_BY_ID[id];
  const h = homestead(state);
  if (!def || !(h.stored[id] > 0)) return state;
  const stored = { ...h.stored, [id]: h.stored[id] - 1 };
  if (!stored[id]) delete stored[id];
  return note(withHome({ ...state, coins: state.coins + resale(def) }, { ...h, stored }), `Sold the ${def.name.toLowerCase()} for ${resale(def)} coins.`);
}
