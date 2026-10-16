import { CROPS, type CropId } from "@/game/crops";
import { nextRandom } from "@/game/rng";
import { DAY_END, DAY_START, dayOf, seasonOf, startOfDay, timeOfDay } from "./clock";
import { cropDays, ITEMS, item, sellPrice, tempFactor, UPGRADES, WORLD_CROPS } from "./items";
import { BUILDING_SIZE, createMap, doorOf, FARM, FARM_W, greenhouseInterior, H, idx, inBounds, W, WALKABLE_BUILDINGS } from "./map";
import { amendmentPoints, expectedGrade, harvestAmount, MAX_BOOST } from "./grades";
import { journalEntry } from "./journal";
import { spawnCritters } from "./nature";
import { TOWN_KINDS, type Building, type BuildingKind, type Dir, type Grade, type Slot, type Tile, type WorldState } from "./types";
import { formatTemp, normalizeSettings, on, type GameSettings } from "./settings";
import { isWet, WEATHER, weatherFor, type DayWeather } from "./weather";

export const WORLD_VERSION = 4;
export const INVENTORY_SIZE = 30;
export const HOTBAR_SIZE = 10;
export const MAX_ENERGY = 100;
export const ORGANIC_BONUS = 1.25;

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

// ───────────────────────── setup ─────────────────────────

export function newWorld(seed = Date.now() % 2147483647, settings?: Partial<GameSettings>): WorldState {
  const cfg = normalizeSettings(settings);
  const { tiles, buildings } = createMap(seed);
  const inventory: (Slot | null)[] = Array(INVENTORY_SIZE).fill(null);
  const start: Slot[] = [
    { item: "hoe", qty: 1 }, { item: "can", qty: 1 }, { item: "scythe", qty: 1 }, { item: "axe", qty: 1 },
    { item: "pickaxe", qty: 1 }, { item: "shovel", qty: 1 }, { item: "ring", qty: 1 },
    { item: "seed_carrot", qty: 6 }, { item: "seed_clover", qty: 6 }, { item: "labKit", qty: 3 },
  ];
  start.forEach((s, i) => (inventory[i] = s));
  return {
    version: WORLD_VERSION,
    seed,
    minute: startOfDay(1),
    coins: 300,
    organic: true,
    energy: MAX_ENERGY,
    maxEnergy: MAX_ENERGY,
    water: 20,
    canSize: 20,
    player: { x: 10, y: 10, facing: "down" },
    inventory,
    selected: 0,
    tiles,
    buildings,
    shipping: [],
    critters: [],
    journal: [],
    harvests: 0,
    weather: { 1: weatherFor(seed, 1, cfg), 2: weatherFor(seed, 2, cfg) },
    log: null,
    messages: [],
    introSeen: false,
    settings: cfg,
  };
}

// ───────────────────────── helpers ─────────────────────────

export function day(state: WorldState) {
  return dayOf(state.minute);
}

/** The weather (sky, high, low) for a day. */
export function weatherOn(state: WorldState, d: number): DayWeather {
  return state.weather[d] ?? weatherFor(state.seed, d, state.settings);
}

export function todayClimate(state: WorldState): DayWeather {
  return weatherOn(state, day(state));
}

export function tomorrowClimate(state: WorldState): DayWeather {
  return weatherOn(state, day(state) + 1);
}

export function todayWeather(state: WorldState) {
  return todayClimate(state).kind;
}

export function tomorrowWeather(state: WorldState) {
  return tomorrowClimate(state).kind;
}

/** Today's season (always a mild growing season when seasons are off). */
export function seasonNow(state: WorldState) {
  return seasonOf(day(state), state.settings);
}

/** Today's average temperature, °F. Greenhouses trap the sun's heat and stay much warmer. */
export function meanTempF(state: WorldState, greenhouse = false) {
  const w = todayClimate(state);
  return (w.high + w.low) / 2 + (greenhouse ? 18 : 0);
}

export function tileAt(state: WorldState, x: number, y: number): Tile | null {
  return inBounds(x, y) ? state.tiles[idx(x, y)] : null;
}

export function buildingAt(state: WorldState, x: number, y: number): Building | null {
  for (const b of state.buildings) {
    const [w, h] = BUILDING_SIZE[b.kind];
    if (x >= b.x && x < b.x + w && y >= b.y && y < b.y + h) return b;
  }
  return null;
}

/** Can the player stand on this tile? */
export function isWalkable(state: WorldState, x: number, y: number): boolean {
  const t = tileAt(state, x, y);
  if (!t || t.ground === "water") return false;
  if (t.obstacle) return false;
  const b = buildingAt(state, x, y);
  if (!b) return true;
  if (WALKABLE_BUILDINGS.includes(b.kind)) return true;
  if (b.kind === "greenhouse") {
    const door = doorOf(b)!;
    return (x === door.x && y === door.y) || greenhouseInterior(b).some((p) => p.x === x && p.y === y);
  }
  return false;
}

export const DIRS: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export function playerTile(state: WorldState) {
  return { x: Math.round(state.player.x), y: Math.round(state.player.y) };
}

export function facingTile(state: WorldState) {
  const p = playerTile(state);
  const [dx, dy] = DIRS[state.player.facing];
  return { x: p.x + dx, y: p.y + dy };
}

function say(state: WorldState, text: string): WorldState {
  return { ...state, messages: [...state.messages, { text, at: state.minute }].slice(-6) };
}

const matches = (s: Slot | null, id: string, grade?: Grade) => !!s && s.item === id && (grade === undefined || s.grade === grade);

/** How many of an item you have (all grades, unless a grade is given). */
export function countItem(state: WorldState, id: string, grade?: Grade) {
  return state.inventory.reduce((n, s) => n + (matches(s, id, grade) ? s!.qty : 0), 0);
}

/** Add items to the bag. Produce of different grades goes in separate stacks. */
export function addItem(state: WorldState, id: string, qty: number, grade?: Grade): WorldState | null {
  const inv = [...state.inventory];
  const stackable = ITEMS[id]?.kind !== "tool";
  let left = qty;
  if (stackable) {
    for (let i = 0; i < inv.length && left > 0; i++) {
      const s = inv[i];
      if (s && s.item === id && s.grade === grade) {
        inv[i] = { ...s, qty: s.qty + left };
        left = 0;
      }
    }
  }
  for (let i = 0; i < inv.length && left > 0; i++) {
    if (!inv[i]) {
      inv[i] = grade ? { item: id, qty: stackable ? left : 1, grade } : { item: id, qty: stackable ? left : 1 };
      left -= stackable ? left : 1;
    }
  }
  if (left > 0) return null;
  return { ...state, inventory: inv };
}

export function removeItem(state: WorldState, id: string, qty: number, grade?: Grade): WorldState | null {
  if (countItem(state, id, grade) < qty) return null;
  const inv = [...state.inventory];
  let left = qty;
  for (let i = 0; i < inv.length && left > 0; i++) {
    const s = inv[i];
    if (s && matches(s, id, grade)) {
      const take = Math.min(s.qty, left);
      inv[i] = s.qty - take > 0 ? { ...s, qty: s.qty - take } : null;
      left -= take;
    }
  }
  return { ...state, inventory: inv };
}

function setTile(state: WorldState, x: number, y: number, fn: (t: Tile) => Tile): WorldState {
  const tiles = [...state.tiles];
  tiles[idx(x, y)] = fn(tiles[idx(x, y)]);
  return { ...state, tiles };
}

function spend(state: WorldState, energy: number): WorldState | null {
  if (!on(state, "energy")) return state;
  if (state.energy < energy) return null;
  return { ...state, energy: state.energy - energy };
}

/** Which soil numbers the player can see on a tile. With "Hidden soil" off, everything is visible. */
export function knownSoil(state: WorldState, t: Tile): Tile["known"] {
  return on(state, "soilTesting") ? t.known : { lab: true, shovel: true, water: true };
}

export function soilQuality(t: Tile): number {
  const s = t.soil;
  return 0.35 * s.nutrients + 0.25 * s.water + 0.2 * s.structure + 0.2 * s.life;
}

export { soilHealth } from "./grades";

function near(state: WorldState, x: number, y: number, kinds: BuildingKind[], r: number) {
  return state.buildings.some((b) => kinds.includes(b.kind) && Math.abs(b.x - x) <= r && Math.abs(b.y - y) <= r);
}

function flowersNear(state: WorldState, x: number, y: number, r: number) {
  if (near(state, x, y, ["flowerBed"], r)) return true;
  for (let yy = y - r; yy <= y + r; yy++) for (let xx = x - r; xx <= x + r; xx++) {
    const c = tileAt(state, xx, yy)?.crop;
    if (c && !c.dead && (c.id === "sunflower" || c.id === "buckwheat" || c.id === "clover") && c.growth > 0.5) return true;
  }
  return false;
}

// ───────────────────────── growth ─────────────────────────

/** How fast a crop grows this hour, 0–1.5. Explained to the player in the tile inspector. */
export function growthFactor(state: WorldState, x: number, y: number): { factor: number; reasons: string[] } {
  const t = state.tiles[idx(x, y)];
  const c = t.crop;
  if (!c || c.dead) return { factor: 0, reasons: [] };
  const wc = WORLD_CROPS[c.id];
  const reasons: string[] = [];
  // Soil quality only counts the parts of the soil that are switched on.
  let f = on(state, "nutrients") ? 0.55 + soilQuality(t) / 110 : 1;
  const season = seasonNow(state);
  if (on(state, "plantingSeasons") && state.settings.seasons && !t.greenhouse && !wc.seasons.includes(season))
    return { factor: 0, reasons: [`Out of season: ${CROPS[c.id].name} doesn't grow outdoors in ${season}.`] };
  if (on(state, "watering") && t.moisture < 15) {
    f *= 0.15;
    reasons.push("Thirsty! Dry soil nearly stops growth. Water it.");
  }
  if (on(state, "waterlogging") && t.moisture >= 90 && t.soil.structure < 40) {
    f *= 0.5;
    reasons.push("Waterlogged! Soggy, packed soil has no air for roots. Better structure (compost) helps it drain.");
  }
  const phOff = Math.abs(t.soil.ph - 6.5);
  if (on(state, "ph") && phOff > 0.8) {
    f *= Math.max(0.5, 1 - 0.2 * phOff);
    reasons.push(t.soil.ph < 6.5 ? "Soil is too acidic, so some nutrients are locked up." : "Soil is too alkaline, so some nutrients are locked up.");
  }
  if (on(state, "weeds") && t.weeds) {
    f *= 0.5;
    reasons.push("Weeds are stealing water and nutrients.");
  }
  if (on(state, "pests") && c.pests) {
    f *= 0.6;
    reasons.push("Pests are chewing the leaves.");
  }
  if (on(state, "temperature")) {
    const temp = meanTempF(state, t.greenhouse);
    const tf = tempFactor(wc.type, temp);
    if (tf < 1) {
      f *= tf;
      const name = CROPS[c.id].name.toLowerCase();
      reasons.push(tf === 0
        ? `Too cold for ${wc.type}-season ${name} to grow at all (about ${formatTemp(temp, state.settings.units)} today).`
        : temp > 80 ? `Heat stress: ${name} slows down in hot weather.` : `Chilly: ${wc.type}-season ${name} grows slowly at about ${formatTemp(temp, state.settings.units)}.`);
    }
  }
  if (on(state, "pollinators") && near(state, x, y, ["beehive"], 5)) {
    f *= 1.1;
    reasons.push("Bees nearby help pollinate.");
  }
  if (on(state, "nutrients") && t.soil.nutrients < 20) reasons.push("Nutrients are low. Try compost or a legume like beans or clover.");
  return { factor: Math.min(1.5, f), reasons };
}

function hourly(state: WorldState): WorldState {
  const weather = todayWeather(state);
  const wet = isWet(weather);
  const dry = { sunny: 1.2, cloudy: 0.6, fog: 0.4, heat: 2.4, frost: 0.5, snow: 0.2, rain: 0, storm: 0 }[weather];
  const tiles = state.tiles.map((t, i) => {
    if (t.ground !== "farm" && !t.greenhouse) return t;
    const outdoors = !t.greenhouse;
    let moisture = t.moisture;
    if (outdoors && wet) moisture = clamp(moisture + (weather === "storm" ? 18 : 12));
    else if (on(state, "watering")) moisture = clamp(moisture - (outdoors ? dry : 1.3) * (t.mulch ? 0.5 : 1) * (1.35 - t.soil.water / 100));
    let soil = t.soil;
    const covered = t.mulch || (t.crop && !t.crop.dead && CROPS[t.crop.id].coversSoil);
    if (on(state, "erosion") && outdoors && weather === "storm" && t.tilled && !covered) {
      soil = { ...soil, structure: clamp(soil.structure - 0.25), om: clamp(soil.om - 0.12), nutrients: clamp(soil.nutrients - 0.25) };
    }
    let crop = t.crop;
    if (crop && !crop.dead && crop.growth < 1) {
      const x = i % W, y = Math.floor(i / W);
      const { factor } = growthFactor({ ...state }, x, y);
      const days = cropDays(crop.id, state.settings.daysPerMonth, crop.harvests > 0);
      // Hard times while growing lower the crop's grade.
      const stressed = (on(state, "watering") && moisture < 15)
        || (on(state, "waterlogging") && moisture >= 90 && t.soil.structure < 40)
        || (on(state, "weeds") && t.weeds)
        || (on(state, "pests") && crop.pests);
      crop = { ...crop, growth: Math.min(1, crop.growth + factor / (days * 24)), stress: (crop.stress ?? 0) + (stressed ? 1 : 0) };
    }
    if (moisture === t.moisture && soil === t.soil && crop === t.crop) return t;
    return { ...t, moisture: r1(moisture), soil, crop };
  });
  return { ...state, tiles };
}

// ───────────────────────── days ─────────────────────────

function rollFor(state: WorldState, salt: number) {
  let s = (state.seed ^ (day(state) * 7919) ^ salt) >>> 0;
  return () => {
    const [v, n] = nextRandom(s);
    s = n;
    return v;
  };
}

/** Everything that happens overnight, ending at 6 AM on `newDay`. */
function startDay(prev: WorldState, newDay: number): WorldState {
  let state: WorldState = { ...prev, minute: startOfDay(newDay) };
  // Keep about a month of weather history so saves stay small.
  const weather: WorldState["weather"] = {};
  for (const [k, v] of Object.entries(state.weather)) if (Number(k) >= newDay - 30) weather[Number(k)] = v;
  weather[newDay] = state.weather[newDay] ?? weatherFor(state.seed, newDay, state.settings);
  weather[newDay + 1] = state.weather[newDay + 1] ?? weatherFor(state.seed, newDay + 1, state.settings);
  state = { ...state, weather };
  const climate = weather[newDay];
  const today = climate.kind;
  const season = seasonOf(newDay, state.settings);
  const newSeason = state.settings.seasons && seasonOf(newDay - 1, state.settings) !== season;
  const rand = rollFor(state, 101);
  const notes: string[] = [];

  // Shipping payout.
  let earned = 0;
  for (const s of state.shipping) {
    const def = item(s.item);
    earned += sellPrice(def, s.grade, state.organic) * s.qty;
  }
  if (earned > 0) notes.push(`The shipping bin paid ${earned} coins${state.organic ? " (organic bonus included)" : ""}.`);

  let killedFrost = 0, killedSeason = 0, newWeeds = 0, newPests = 0;
  const tiles = state.tiles.map((t, i) => {
    const x = i % W, y = Math.floor(i / W);
    let next = t;
    if (on(state, "soilLife") && (t.ground === "farm" || t.greenhouse)) {
      const soil = { ...t.soil };
      soil.life = clamp(soil.life + (soil.om + 10 - soil.life) * 0.05);
      soil.structure = clamp(soil.structure + (soil.life - soil.structure) * 0.03);
      if (t.mulch) soil.om = clamp(soil.om + 0.3);
      next = { ...t, soil: { ...soil, life: r1(soil.life), structure: r1(soil.structure), om: r1(soil.om) } };
    }
    const c = next.crop;
    if (c && !c.dead && !next.greenhouse) {
      const wc = WORLD_CROPS[c.id];
      if (on(state, "plantingSeasons") && newSeason && !wc.seasons.includes(season)) {
        next = { ...next, crop: { ...c, dead: true } };
        killedSeason++;
      } else if (on(state, "frost") && climate.low <= wc.killF) {
        next = { ...next, crop: { ...c, dead: true } };
        killedFrost++;
      }
    }
    // Weeds sprout on uncovered farm soil.
    if (on(state, "weeds") && next.ground === "farm" && !next.greenhouse && !next.weeds && !next.obstacle && !next.mulch && !buildingAt(state, x, y)) {
      const covered = next.crop && !next.crop.dead && CROPS[next.crop.id].coversSoil;
      const chance = season === "Winter" ? 0.01 : covered ? 0 : next.crop ? 0.05 : next.tilled ? 0.08 : 0.12;
      if (rand() < chance) {
        next = { ...next, weeds: true };
        newWeeds++;
      }
    }
    // Pests find crops grown in the same family again and again.
    const cc = next.crop;
    if (on(state, "pests") && cc && !cc.dead && !cc.pests) {
      const guarded = near(state, x, y, ["bugHotel", "birdHouse"], 6);
      const repeat = on(state, "rotation") && next.familyStreak >= 1;
      const chance = (repeat ? 0.2 : 0.04) * (guarded ? 0.25 : 1);
      if (rand() < chance) {
        next = { ...next, crop: { ...cc, pests: true } };
        newPests++;
      }
    }
    return next;
  });

  // Buildings work overnight.
  const yesterdayWet = isWet(state.weather[newDay - 1]?.kind ?? "sunny");
  const buildings = state.buildings.map((b) => {
    if (b.kind === "composter" && (b.data.fiber ?? 0) >= 5 && b.data.startedDay !== undefined && newDay - b.data.startedDay >= 2) {
      const made = Math.floor((b.data.fiber ?? 0) / 5);
      notes.push(`Decomposers in your compost bin turned plant fiber into ${made} compost.`);
      return { ...b, data: { ...b.data, fiber: (b.data.fiber ?? 0) % 5, ready: (b.data.ready ?? 0) + made, startedDay: (b.data.fiber ?? 0) % 5 ? newDay : undefined } };
    }
    if (b.kind === "rainBarrel" && yesterdayWet) return { ...b, data: { ...b.data, water: Math.min(40, (b.data.water ?? 0) + 20) } };
    if (b.kind === "beehive") {
      const last = b.data.honeyDay ?? newDay;
      if (!b.data.ready && newDay - last >= 3 && flowersNear(state, b.x, b.y, 5)) {
        notes.push("Your bees made honey from nearby flowers.");
        return { ...b, data: { ...b.data, ready: 1, honeyDay: newDay } };
      }
      if (b.data.honeyDay === undefined) return { ...b, data: { ...b.data, honeyDay: newDay } };
    }
    return b;
  });

  if (killedFrost) notes.push(`It dropped to ${formatTemp(climate.low, state.settings.units)} overnight, and the cold killed ${killedFrost} tender crop${killedFrost > 1 ? "s" : ""} outside. A greenhouse protects plants from frost.`);
  if (killedSeason) notes.push(`${killedSeason} crop${killedSeason > 1 ? "s" : ""} died because ${season} arrived and they don't grow this season.`);
  if (newWeeds) notes.push(`${newWeeds} new weed${newWeeds > 1 ? "s" : ""} sprouted on uncovered soil. Mulch and cover crops keep weeds down.`);
  if (newPests) notes.push(`Pests found ${newPests} crop${newPests > 1 ? "s" : ""}. Rotating plant families and a bug hotel or bird house help.`);
  if (newSeason) notes.unshift(`${season} begins today!`);
  const tomorrow = weather[newDay + 1];
  notes.push(`Tomorrow's forecast: ${WEATHER[tomorrow.kind].name}, high ${formatTemp(tomorrow.high, state.settings.units)}, low ${formatTemp(tomorrow.low, state.settings.units)}.`);

  state = {
    ...state,
    tiles,
    buildings,
    shipping: [],
    coins: state.coins + earned,
    log: { day: newDay, earned, notes },
  };
  state = spawnCritters(state, newDay);
  // Weather you live through goes in the journal.
  const yesterday = state.weather[newDay - 1]?.kind;
  if (today === "sunny" && yesterday && isWet(yesterday)) {
    state = discover(state, "rainbow");
    state = { ...state, log: { ...state.log!, notes: ["🌈 A rainbow arched over the farm this morning: sunlight behind you, the last raindrops in front.", ...state.log!.notes] } };
  }
  if (today === "storm") state = discover(state, "thunderstorm");
  if (today === "frost") state = discover(state, "frost");
  if (today === "snow") state = discover(state, "snowflake");
  return state;
}

/** Advance the clock. Handles hourly growth, and fainting at 2 AM. */
export function tick(state: WorldState, minutes: number): WorldState {
  let s = state;
  let left = minutes;
  while (left > 0) {
    const tod = timeOfDay(s.minute);
    const toHour = 60 - (tod % 60);
    const step = Math.min(left, toHour);
    s = { ...s, minute: s.minute + step };
    left -= step;
    if (step === toHour) s = hourly(s);
    if (timeOfDay(s.minute) >= DAY_END) {
      // With "Bedtime" off, the clock waits at 2 AM until you go to bed.
      s = on(s, "bedtime") ? faint(s) : { ...s, minute: s.minute - (timeOfDay(s.minute) - DAY_END) - 1 };
      break;
    }
  }
  return s;
}

function runNight(state: WorldState): WorldState {
  let s = state;
  const target = startOfDay(day(state) + 1);
  while (s.minute < target) {
    const tod = timeOfDay(s.minute);
    const step = Math.min(60 - (tod % 60), target - s.minute);
    s = { ...s, minute: s.minute + step };
    if (s.minute % 60 === 0 || s.minute === target) s = hourly(s);
  }
  return s;
}

export function sleep(state: WorldState): WorldState {
  const late = timeOfDay(state.minute) >= 24 * 60;
  const d = day(state) + 1;
  const s = startDay(runNight(state), d);
  return {
    ...s,
    energy: late ? Math.round(s.maxEnergy * 0.8) : s.maxEnergy,
    player: { x: 10, y: 9, facing: "down" },
  };
}

function faint(state: WorldState): WorldState {
  const lost = Math.min(100, Math.round(state.coins * 0.1));
  const d = day({ ...state, minute: state.minute - 1 }) + 1;
  const s = startDay({ ...state, minute: startOfDay(d) - 1 }, d);
  return {
    ...s,
    coins: s.coins - lost,
    energy: Math.round(s.maxEnergy * 0.5),
    player: { x: 10, y: 9, facing: "down" },
    log: { ...s.log!, notes: [`You stayed up past 2 AM and fainted! A neighbor carried you home and charged ${lost} coins.`, ...s.log!.notes] },
  };
}

// ───────────────────────── tools ─────────────────────────

const ENERGY: Record<string, number> = { hoe: 2, can: 1, scythe: 1, axe: 2, pickaxe: 3, shovel: 2, ring: 1 };

export function selectedItem(state: WorldState) {
  return state.inventory[state.selected];
}

/** The main action button: observe critters, harvest ripe crops, or use the selected item. */
export function act(state: WorldState): WorldState {
  const { x, y } = facingTile(state);
  const t = tileAt(state, x, y);
  if (!t) return state;
  if (state.critters.some((c) => c.x === x && c.y === y)) return interact(state);
  const slot = selectedItem(state);
  const def = slot ? ITEMS[slot.item] : null;
  if (t.crop && !t.crop.dead && t.crop.growth >= 1 && def?.kind !== "amendment") return harvest(state, x, y);
  return applyTool(state);
}

/** Use the selected item on the tile in front of the player. */
export function applyTool(state: WorldState): WorldState {
  const slot = selectedItem(state);
  if (!slot) return interact(state);
  const def = ITEMS[slot.item];
  const { x, y } = facingTile(state);
  const t = tileAt(state, x, y);
  if (!t) return state;

  if (def.kind === "kit") return placeBuilding(state, state.selected, x, y);
  if (def.kind === "seed") return plant(state, x, y, def.crop!);
  if (def.kind === "amendment") return applyAmendment(state, x, y, slot.item);
  if (def.kind !== "tool") return interact(state);

  const cost = ENERGY[slot.item] ?? 1;
  const b = buildingAt(state, x, y);
  const paid = spend(state, cost);
  if (!paid) return say(state, "You're too tired. Go home and sleep.");

  switch (slot.item) {
    case "hoe": {
      if (t.ground !== "farm" && !t.greenhouse) return say(state, "You can only till the garden field or greenhouse beds.");
      if (b && b.kind !== "greenhouse") return say(state, "Something is built here.");
      if (t.obstacle) return say(state, `Clear the ${t.obstacle} first.`);
      if (t.weeds) return say(state, "Cut the weeds with the scythe first.");
      if (t.tilled) return say(state, "This soil is already tilled.");
      return say(setTile(paid, x, y, (tt) => ({
        ...tt, tilled: true,
        soil: on(state, "tillage") ? { ...tt.soil, structure: clamp(tt.soil.structure - 2), om: clamp(tt.soil.om - 0.5), life: clamp(tt.soil.life - 1) } : tt.soil,
      })), on(state, "tillage") ? "Tilled! (Each tilling breaks soil crumbs a little, so only till where you'll plant.)" : "Tilled!");
    }
    case "can": {
      if (t.ground === "water") return say({ ...paid, water: state.canSize }, "Filled your watering can at the pond.");
      if (b?.kind === "rainBarrel") return refillFromBarrel(paid, b);
      if (state.water <= 0) return say(state, "Your watering can is empty. Refill it at the pond or a rain barrel.");
      if (!t.tilled) return say(state, "Water tilled soil or crops.");
      // Each pour soaks the soil part way; keep pouring and it gets waterlogged.
      return setTile({ ...paid, water: state.water - 1 }, x, y, (tt) => ({ ...tt, moisture: clamp(tt.moisture + 45) }));
    }
    case "scythe": {
      if (t.weeds) {
        const got = addItem(setTile(paid, x, y, (tt) => ({ ...tt, weeds: false })), "fiber", 1);
        return got ? say(got, "Cut weeds (+1 fiber).") : say(state, "Your bag is full.");
      }
      if (t.crop?.dead) {
        const got = addItem(setTile(paid, x, y, (tt) => ({ ...tt, crop: null })), "fiber", 1);
        return got ? say(got, "Cleared a dead plant (+1 fiber).") : state;
      }
      return state;
    }
    case "axe": {
      if (t.obstacle !== "stick" && t.obstacle !== "stump" && t.obstacle !== "log") return state;
      const n = t.obstacle === "stick" ? 1 : 4;
      const got = addItem(setTile(paid, x, y, (tt) => ({ ...tt, obstacle: null })), "wood", n);
      return got ? say(got, `+${n} wood.`) : say(state, "Your bag is full.");
    }
    case "pickaxe": {
      if (t.obstacle === "stone") {
        const got = addItem(setTile(paid, x, y, (tt) => ({ ...tt, obstacle: null })), "stone", 1);
        return got ? say(got, "+1 stone.") : say(state, "Your bag is full.");
      }
      if (t.tilled && !t.crop) return setTile(paid, x, y, (tt) => ({ ...tt, tilled: false }));
      return state;
    }
    case "shovel": {
      if (t.ground !== "farm" && !t.greenhouse) return say(state, "Dig a test hole in the garden.");
      if (t.obstacle || t.crop) return say(state, "Find an open spot to dig.");
      const worms = Math.round(t.soil.life / 10);
      let s = setTile(paid, x, y, (tt) => ({ ...tt, known: { ...tt.known, shovel: true } }));
      s = say(s, `Shovel test: you counted ${worms} earthworm${worms === 1 ? "" : "s"}. Soil life ${Math.round(t.soil.life)}, structure ${Math.round(t.soil.structure)}.`);
      s = discoverIf(s, worms >= 3, "earthworm");
      return discoverIf(s, t.soil.life >= 45, "mycorrhizae");
    }
    case "ring": {
      if (t.ground !== "farm" && !t.greenhouse) return say(state, "Test the garden soil.");
      const mins = Math.max(1, Math.round(30 - t.soil.water / 4));
      return say(setTile(paid, x, y, (tt) => ({ ...tt, known: { ...tt.known, water: true } })),
        `Infiltration test: an inch of water soaked in after ${mins} minutes. Water holding: ${Math.round(t.soil.water)}.`);
    }
  }
  return state;
}

function refillFromBarrel(state: WorldState, b: Building): WorldState {
  const have = b.data.water ?? 0;
  if (have <= 0) return say(state, "The rain barrel is empty. It fills when it rains.");
  const need = state.canSize - state.water;
  const take = Math.min(need, have);
  return say({
    ...state,
    water: state.water + take,
    buildings: state.buildings.map((x) => (x.id === b.id ? { ...x, data: { ...x.data, water: have - take } } : x)),
  }, `Refilled from the rain barrel (${have - take} left). Rainwater saves well water!`);
}

export function canPlantHere(state: WorldState, x: number, y: number, crop: CropId): string | null {
  const t = tileAt(state, x, y);
  if (!t) return "Nothing here.";
  if (!t.tilled) return "Till the soil with the hoe first.";
  if (t.crop) return "Something is already planted here.";
  if (t.weeds) return "Cut the weeds first.";
  const season = seasonNow(state);
  if (on(state, "plantingSeasons") && state.settings.seasons && !t.greenhouse && !WORLD_CROPS[crop].seasons.includes(season))
    return `${CROPS[crop].name} won't grow outdoors in ${season}. Try the greenhouse, or plant in ${WORLD_CROPS[crop].seasons.join(" or ")}.`;
  return null;
}

export function plant(state: WorldState, x: number, y: number, crop: CropId): WorldState {
  const reason = canPlantHere(state, x, y, crop);
  if (reason) return say(state, reason);
  const s = removeItem(state, `seed_${crop}`, 1);
  if (!s) return state;
  const t = state.tiles[idx(x, y)];
  const same = t.lastFamily === CROPS[crop].family;
  const out = setTile(s, x, y, (tt) => ({
    ...tt,
    crop: { id: crop, growth: 0, harvests: 0, dead: false, pests: false },
    familyStreak: same ? tt.familyStreak + 1 : 0,
    soil: same ? tt.soil : { ...tt.soil, life: clamp(tt.soil.life + 2) },
  }));
  const rotation = on(state, "rotation");
  return say(out, same && rotation
    ? `Planted ${CROPS[crop].name}. ⚠️ Same plant family as last time here: pests love that.`
    : `Planted ${CROPS[crop].name}.${t.lastFamily && rotation ? " Good rotation!" : ""}`);
}

export function applyAmendment(state: WorldState, x: number, y: number, id: string): WorldState {
  const t = tileAt(state, x, y);
  if (!t || (t.ground !== "farm" && !t.greenhouse)) return say(state, "Use this on garden soil.");
  if (id === "labKit") {
    if (t.known.lab) return say(state, "You already have lab results for this spot.");
    const s = removeItem(state, id, 1)!;
    return say(setTile(s, x, y, (tt) => ({ ...tt, known: { ...tt.known, lab: true } })),
      `Lab results: organic matter ${(t.soil.om * 0.08).toFixed(1)}%, nutrients ${Math.round(t.soil.nutrients)}, pH ${t.soil.ph.toFixed(1)}.`);
  }
  if (t.obstacle) return say(state, `Clear the ${t.obstacle} first.`);
  const s0 = removeItem(state, id, 1);
  if (!s0) return state;
  let s = s0;
  let msg = "";
  s = setTile(s, x, y, (tt) => {
    const soil = { ...tt.soil };
    switch (id) {
      case "compost":
        soil.om = clamp(soil.om + 6); soil.life = clamp(soil.life + 6); soil.nutrients = clamp(soil.nutrients + 6);
        soil.ph = r1(soil.ph + (6.8 - soil.ph) * 0.25);
        msg = "Spread compost: more organic matter, soil life, and nutrients.";
        return { ...tt, soil };
      case "mulch":
        msg = "Mulched: holds moisture, blocks weeds, and protects soil from storms.";
        return { ...tt, mulch: true, weeds: false };
      case "lime":
        soil.ph = r1(Math.min(7.6, soil.ph + 0.6));
        msg = "Added lime: limestone neutralizes acid and raises pH.";
        return { ...tt, soil };
      case "biochar":
        soil.water = clamp(soil.water + 8); soil.om = clamp(soil.om + 3);
        msg = "Mixed in biochar: its tiny pores hold water and nutrients for a very long time.";
        return { ...tt, soil };
      case "synthFert":
        soil.nutrients = clamp(soil.nutrients + 20); soil.life = clamp(soil.life - 4); soil.ph = r1(soil.ph - 0.2);
        msg = "Synthetic fertilizer: quick nutrients, but soil life dropped and the garden is no longer certified organic.";
        return { ...tt, soil };
    }
    return tt;
  });
  if (item(id).notOrganic) s = { ...s, organic: false };
  // Amendments also raise the grade of the next harvest from this spot.
  const points = amendmentPoints(id, t);
  const before = t.boost ?? 0;
  const after = Math.min(MAX_BOOST, before + points);
  if (after > before) {
    s = setTile(s, x, y, (tt) => ({ ...tt, boost: after }));
    msg += ` Crop grade bonus +${after - before}.`;
  }
  return say(s, msg);
}

// ───────────────────────── interact ─────────────────────────

export type InteractTarget = "house" | "store" | "tv" | "shipping" | "board" | null;

/** Harvest, use buildings, or pick up critters on the facing tile. Returns which menu to open, if any. */
export function interactTarget(state: WorldState): InteractTarget {
  const { x, y } = facingTile(state);
  const b = buildingAt(state, x, y);
  if (b?.kind === "house") return "house";
  if (b?.kind === "store") return "store";
  if (b?.kind === "shippingBin") return "shipping";
  if (b?.kind === "noticeBoard") return "board";
  return null;
}

export function interact(state: WorldState): WorldState {
  const { x, y } = facingTile(state);
  const t = tileAt(state, x, y);
  if (!t) return state;
  const critter = state.critters.find((c) => c.x === x && c.y === y);
  if (critter) return discover({ ...state, critters: state.critters.filter((c) => c.id !== critter.id) }, critter.kind);
  const b = buildingAt(state, x, y);
  if (b) return operateBuilding(state, b);
  if (t.ground === "water") return discover(say({ ...state, water: state.canSize }, "Filled your watering can at the pond."), "pond-life");
  const c = t.crop;
  if (c?.dead) {
    const got = addItem(setTile(state, x, y, (tt) => ({ ...tt, crop: null })), "fiber", 1);
    return got ? say(got, "Cleared a dead plant (+1 fiber).") : state;
  }
  if (c && c.growth >= 1) return harvest(state, x, y);
  if (c) {
    const pct = Math.round(c.growth * 100);
    return say(state, `${CROPS[c.id].name}: ${pct}% grown.${c.pests ? " Pests are on it!" : ""}`);
  }
  return state;
}

export function harvest(state: WorldState, x: number, y: number): WorldState {
  const t = state.tiles[idx(x, y)];
  const c = t.crop!;
  const crop = CROPS[c.id];
  const wc = WORLD_CROPS[c.id];
  const applyGives = (soil: Tile["soil"]) => ({
    ...soil,
    nutrients: on(state, "nutrients")
      ? clamp(soil.nutrients - crop.nutrientUse * 1.2 - (on(state, "rotation") && t.familyStreak >= 1 ? 2 : 0) + (crop.gives.nutrients ?? 0))
      : soil.nutrients,
    om: clamp(soil.om + (crop.gives.om ?? 0)),
    structure: clamp(soil.structure + (crop.gives.structure ?? 0)),
    life: clamp(soil.life + (crop.gives.life ?? 0)),
  });
  if (wc.cover) {
    const s = setTile(state, x, y, (tt) => ({ ...tt, crop: null, lastFamily: crop.family, soil: applyGives(tt.soil) }));
    return discover(say(s, "Dug the clover into the soil as green manure: more nitrogen and organic matter!"), "nitrogen-fixation");
  }
  const { grade } = expectedGrade(state, t);
  const qty = harvestAmount(state, idx(x, y), c.id, grade);
  const got = addItem(state, `crop_${c.id}`, qty, grade);
  if (!got) return say(state, "Your bag is full.");
  const regrows = !!wc.regrowDays && c.harvests < 3;
  const s = setTile(got, x, y, (tt) => ({
    ...tt,
    crop: regrows ? { ...c, growth: 0, harvests: c.harvests + 1, stress: 0 } : null,
    lastFamily: crop.family,
    soil: applyGives(tt.soil),
    // Amendments are used up by the harvest; a crop that keeps producing keeps half.
    boost: regrows ? Math.floor((tt.boost ?? 0) / 2) : 0,
  }));
  const done = say({ ...s, harvests: s.harvests + 1 }, `Harvested ${qty} ${crop.name} · Grade ${grade}!${regrows ? " It will grow more." : ""}`);
  return crop.family === "legume" ? discover(done, "nitrogen-fixation") : done;
}

function operateBuilding(state: WorldState, b: Building): WorldState {
  const update = (data: Building["data"]) => ({ ...state, buildings: state.buildings.map((x) => (x.id === b.id ? { ...x, data } : x)) });
  switch (b.kind) {
    case "composter": {
      if ((b.data.ready ?? 0) > 0) {
        const got = addItem(update({ ...b.data, ready: 0 }), "compost", b.data.ready!);
        return got ? say(got, `Collected ${b.data.ready} compost!`) : say(state, "Your bag is full.");
      }
      const fiber = countItem(state, "fiber");
      if (fiber === 0) return say(state, `Compost bin: ${b.data.fiber ?? 0} fiber inside. Add plant fiber from weeds.`);
      const add = Math.min(fiber, 20 - (b.data.fiber ?? 0));
      if (add <= 0) return say(state, "The bin is full. Wait for the decomposers.");
      const s = removeItem(update({ ...b.data, fiber: (b.data.fiber ?? 0) + add, startedDay: b.data.startedDay ?? day(state) }), "fiber", add)!;
      return discover(say(s, `Added ${add} fiber. Bacteria and fungi will break it down (every 5 fiber makes 1 compost in 2 days).`), "decomposers");
    }
    case "rainBarrel":
      return refillFromBarrel(state, b);
    case "extension":
      return say(state, "The County Extension Office: free soil advice and testing. Dr. Okafor is usually out front.");
    case "cottage":
      return say(state, `You knock on the door. ${b.data.owner === "june" ? "A jar-shaped sign reads: \"Honey for sale. Ask June.\"" : "Nobody answers. They must be out working."}`);
    case "fountain":
      return say(state, "The fountain is cool and clear. A frog blinks at you from the edge.");
    case "beehive": {
      if (b.data.owner) return discover(say(state, "This is June's hive. The bees pollinate the whole community garden."), "honeybee");
      if (b.data.ready) {
        const got = addItem(update({ ...b.data, ready: 0 }), "honey", 1);
        return got ? discover(say(got, "Collected honey! 🍯"), "honeybee") : state;
      }
      return discover(say(state, "The bees are busy. Plant flowers like sunflowers, buckwheat, or clover within 5 steps for honey."), "honeybee");
    }
    default:
      return state;
  }
}

// ───────────────────────── shop ─────────────────────────

export function buy(state: WorldState, id: string, qty = 1): WorldState {
  const price = id === "bigCan" ? UPGRADES.bigCan.price : item(id).price;
  if (price === undefined) return say(state, "The store doesn't sell that.");
  const total = price * qty;
  if (state.coins < total) return say(state, "Not enough coins.");
  if (id === "bigCan") {
    if (state.canSize >= 40) return say(state, "You already have the bigger can.");
    return say({ ...state, coins: state.coins - total, canSize: 40, water: 40 }, "Upgraded to the copper watering can!");
  }
  const got = addItem(state, id, qty);
  if (!got) return say(state, "Your bag is full.");
  return say({ ...got, coins: state.coins - total }, `Bought ${qty} ${item(id).name}.`);
}

export function sellNow(state: WorldState, slotIndex: number, qty: number): WorldState {
  const s = state.inventory[slotIndex];
  if (!s) return state;
  const def = item(s.item);
  if (!def.sell) return say(state, "The store won't buy that.");
  const n = Math.min(qty, s.qty);
  const inv = [...state.inventory];
  inv[slotIndex] = s.qty - n > 0 ? { ...s, qty: s.qty - n } : null;
  const coins = sellPrice(def, s.grade, state.organic) * n;
  return say({ ...state, inventory: inv, coins: state.coins + coins }, `Sold ${n} ${def.name}${s.grade ? ` (grade ${s.grade})` : ""} for ${coins} coins.`);
}

export function ship(state: WorldState, slotIndex: number): WorldState {
  const s = state.inventory[slotIndex];
  if (!s) return state;
  const def = item(s.item);
  if (!def.sell) return say(state, "That can't be shipped.");
  const inv = [...state.inventory];
  inv[slotIndex] = null;
  const removed = { ...state, inventory: inv };
  const same = (x: Slot) => x.item === s.item && x.grade === s.grade;
  const shipping = removed.shipping.some(same)
    ? removed.shipping.map((x) => (same(x) ? { ...x, qty: x.qty + s.qty } : x))
    : [...removed.shipping, { ...s }];
  return say({ ...removed, shipping }, `Put ${s.qty} ${def.name} in the shipping bin. You'll be paid overnight.`);
}

// ───────────────────────── building ─────────────────────────

export function canPlace(state: WorldState, kind: BuildingKind, x: number, y: number): string | null {
  const [w, h] = BUILDING_SIZE[kind];
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    const t = tileAt(state, xx, yy);
    if (!t) return "Too close to the edge.";
    if (xx >= FARM_W) return "Build on your own farm, not in town.";
    if (t.ground === "water" || t.ground === "forest") return "Can't build on water or in the forest.";
    if (t.obstacle) return `Clear the ${t.obstacle} first.`;
    if (t.crop) return "Something is planted there.";
    if (buildingAt(state, xx, yy)) return "Something is already built there.";
    const p = playerTile(state);
    if (p.x === xx && p.y === yy) return "You're standing there.";
  }
  return null;
}

/** Top-left corner for a building placed on the facing tile, so big buildings sit in front of the player. */
export function placementFor(state: WorldState, kind: BuildingKind, x: number, y: number) {
  const [w, h] = BUILDING_SIZE[kind];
  const f = state.player.facing;
  const ox = f === "left" ? x - (w - 1) : f === "right" ? x : x - Math.floor((w - 1) / 2);
  const oy = f === "up" ? y - (h - 1) : f === "down" ? y : y - Math.floor((h - 1) / 2);
  return { x: ox, y: oy };
}

export function placeBuilding(state: WorldState, slotIndex: number, x: number, y: number): WorldState {
  const s = state.inventory[slotIndex];
  if (!s) return state;
  const def = item(s.item);
  if (!def.building) return state;
  const { x: ox, y: oy } = placementFor(state, def.building, x, y);
  const reason = canPlace(state, def.building, ox, oy);
  if (reason) return say(state, reason);
  let next = removeItem(state, s.item, 1)!;
  const b: Building = { id: `${def.building}-${state.minute}-${ox}-${oy}`, kind: def.building, x: ox, y: oy, data: def.building === "rainBarrel" ? { water: 0 } : {} };
  next = { ...next, buildings: [...next.buildings, b] };
  if (def.building === "greenhouse") {
    for (const p of greenhouseInterior(b)) {
      next = setTile(next, p.x, p.y, (t) => ({ ...t, greenhouse: true, ground: "farm", weeds: false, obstacle: null }));
    }
  }
  next = say(next, `Built a ${def.name}!`);
  return def.building === "greenhouse" ? discover(next, "greenhouse-effect") : next;
}

export function pickUpBuilding(state: WorldState, id: string): WorldState {
  const b = state.buildings.find((x) => x.id === id);
  if (!b || TOWN_KINDS.includes(b.kind) || b.data.owner) return state;
  if (b.kind === "greenhouse" && greenhouseInterior(b).some((p) => state.tiles[idx(p.x, p.y)].crop)) return say(state, "Harvest or clear the greenhouse beds first.");
  const kit = `kit_${b.kind}`;
  const got = addItem(state, kit, 1);
  if (!got) return say(state, "Your bag is full.");
  let next: WorldState = { ...got, buildings: got.buildings.filter((x) => x.id !== id) };
  if (b.kind === "greenhouse") for (const p of greenhouseInterior(b)) next = setTile(next, p.x, p.y, (t) => ({ ...t, greenhouse: false }));
  return say(next, `Picked up the ${item(kit).name}.`);
}

// ───────────────────────── journal ─────────────────────────

export function discover(state: WorldState, id: string): WorldState {
  if (state.journal.includes(id)) return state;
  return say({ ...state, journal: [...state.journal, id] }, `📓 New Nature Journal page: ${journalEntry(id)?.name ?? id}!`);
}

function discoverIf(state: WorldState, cond: boolean, id: string) {
  return cond ? discover(state, id) : state;
}

// ───────────────────────── movement ─────────────────────────

const R = 0.3;

/** Move the player by (dx, dy) tiles, sliding along walls. */
export function movePlayer(state: WorldState, dx: number, dy: number): WorldState["player"] {
  const p = state.player;
  const free = (x: number, y: number) =>
    [[-R, -R], [R, -R], [-R, R], [R, R]].every(([ox, oy]) => isWalkable(state, Math.round(x + ox), Math.round(y + oy)));
  let { x, y } = p;
  if (dx && free(x + dx, y)) x += dx;
  if (dy && free(x, y + dy)) y += dy;
  const facing: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy !== 0 ? (dy > 0 ? "down" : "up") : p.facing;
  return { x, y, facing };
}

export function swapSlots(state: WorldState, a: number, b: number): WorldState {
  const inv = [...state.inventory];
  [inv[a], inv[b]] = [inv[b], inv[a]];
  return { ...state, inventory: inv };
}

/** Saves from before the town: keep the farm, rebuild the map at the new size, and add the town. */
function addTown(old: WorldState): WorldState {
  const oldW = old.tiles.length / H;
  const fresh = createMap(old.seed);
  const tiles = fresh.tiles.map((t, i) => {
    const x = i % W, y = Math.floor(i / W);
    return x < FARM_W && x < oldW ? old.tiles[y * oldW + x] : t;
  });
  // The store moved into town; the farm keeps everything you built.
  const farm = old.buildings.filter((b) => b.kind !== "store" && b.x < FARM_W);
  const town = fresh.buildings.filter((b) => !farm.some((f) => f.id === b.id));
  return { ...old, version: WORLD_VERSION, tiles, buildings: [...farm, ...town] };
}

/** Version 1 saves had no settings and stored weather as a plain label. */
function migrateV1(old: WorldState): WorldState {
  const settings = normalizeSettings(undefined);
  const d = dayOf(old.minute);
  return {
    ...old,
    version: 2,
    settings,
    weather: { [d]: weatherFor(old.seed, d, settings), [d + 1]: weatherFor(old.seed, d + 1, settings) },
  };
}

export function saveWorld(state: WorldState): string {
  return JSON.stringify(state);
}

export function loadWorld(raw: string | null): WorldState | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as WorldState;
    if (!Array.isArray(s.tiles) || !(s.version >= 1 && s.version <= WORLD_VERSION)) return null;
    let up = s.version === 1 ? migrateV1(s) : s;
    // Version 4 grew the map east to add the town.
    if (up.version < 4) up = addTown(up);
    if (up.tiles.length !== W * H) return null;
    // Version 3 added crop grades: older tiles have no amendment points, crops no stress.
    return up.version === WORLD_VERSION ? { ...up, settings: normalizeSettings(up.settings) } : null;
  } catch {
    return null;
  }
}

export { FARM, W, H, DAY_START };
