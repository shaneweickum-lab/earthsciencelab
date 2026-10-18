import { CROPS, type CropId } from "@/game/crops";
import { nextRandom } from "@/game/rng";
import { DAY_END, DAY_START, dayOf, seasonOf, startOfDay, timeOfDay } from "./clock";
import { cropDays, ITEMS, item, RECIPES, sellPrice, SHOP_UNLOCKS, tempFactor, TIERS, UPGRADES, WORLD_CROPS, type Recipe, type Station, type ToolUse } from "./items";
import { addGardenLane, atGardenExit, BUILDING_SIZE, CHEST_SIZE, GARDEN_ENTRY, GATE_ROWS, LANE_X, laneBuildings, STALL_SIZE, OLD_H, PLOTS, plotAt, plotPrice, SOUTH_PATH, MINE_ENTRANCE, MINE_H, MINE_START, MINE_W, mineFloor, createMap, doorOf, farmBuildings, townBuildings, FARM, FARM_W, greenhouseInterior, H, idx, inBounds, W, WALKABLE_BUILDINGS } from "./map";
import { amendmentPoints, expectedGrade, harvestAmount, MAX_BOOST } from "./grades";
import { journalEntry } from "./journal";
import { spawnCritters } from "./nature";
import { TOWN_KINDS, type Building, type BuildingKind, type Dir, type Grade, type Listing, type Obstacle, type Slot, type Tile, type WorldState } from "./types";
import { formatTemp, normalizeSettings, on, type GameSettings } from "./settings";
import { isWet, WEATHER, weatherFor, type DayWeather } from "./weather";

export const WORLD_VERSION = 10;
export const INVENTORY_SIZE = 30;
export const HOTBAR_SIZE = 10;
export const MAX_ENERGY = 100;
export const ORGANIC_BONUS = 1.25;

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

// ───────────────────────── setup ─────────────────────────

/** What's in the chest by the house on day one. Grandma Rosa's lessons hand out the rest of her tools. */
export const STARTER_CHEST: Slot[] = [{ item: "scythe", qty: 1 }];

/** Grandma Rosa's lessons, the tutorial (see quests.ts). A new farm starts on the first. */
export const LESSONS = Array.from({ length: 10 }, (_, i) => `lesson-${i + 1}`);

/** Count something the player did, for lessons that ask you to do it a few times. */
export function tally(state: WorldState, key: string, n = 1): WorldState {
  return { ...state, tally: { ...state.tally, [key]: (state.tally?.[key] ?? 0) + n } };
}

export function newWorld(seed = Date.now() % 2147483647, settings?: Partial<GameSettings>): WorldState {
  const cfg = normalizeSettings(settings);
  const { tiles, buildings } = createMap(seed);
  // You start empty-handed: Grandma Rosa's tools wait in the chest by the house.
  const inventory: (Slot | null)[] = Array(INVENTORY_SIZE).fill(null);
  const chest = buildings.find((b) => b.kind === "chest")!;
  STARTER_CHEST.forEach((s, i) => (chest.data.items![i] = { ...s }));
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
    plots: [0],
    quests: { active: [{ id: LESSONS[0], accepted: dayOf(startOfDay(1)), step: 0 }], done: [] },
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
  if (state.mine) return x >= 0 && y >= 0 && x < MINE_W && y < MINE_H ? state.mine.tiles[y * MINE_W + x] : null;
  return inBounds(x, y) ? state.tiles[idx(x, y)] : null;
}

/** The buildings where the player is: the farm and town, or the ladders on a mine floor. */
export const buildingsHere = (state: WorldState) => (state.mine ? state.mine.buildings : state.buildings);
/** Critters live up on the farm; there are none underground. */
export const crittersHere = (state: WorldState) => (state.mine ? [] : state.critters);

export function buildingAt(state: WorldState, x: number, y: number): Building | null {
  for (const b of buildingsHere(state)) {
    const [w, h] = BUILDING_SIZE[b.kind];
    if (x >= b.x && x < b.x + w && y >= b.y && y < b.y + h) return b;
  }
  return null;
}

/** Can the player stand on this tile? */
export function isWalkable(state: WorldState, x: number, y: number): boolean {
  const t = tileAt(state, x, y);
  if (!t || t.ground === "water" || t.ground === "caveWall") return false;
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

export function say(state: WorldState, text: string): WorldState {
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
  if (state.mine) {
    const tiles = [...state.mine.tiles];
    tiles[y * MINE_W + x] = fn(tiles[y * MINE_W + x]);
    return { ...state, mine: { ...state.mine, tiles } };
  }
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

/** One hour passing: soil dries or soaks, crops grow. (Exported for multiplayer, which runs it per farm.) */
export function hourly(state: WorldState): WorldState {
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
  return stallSales({ ...state, tiles });
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
    // Felled trees sprout from their stumps, then grow back.
    if (next.regrow !== undefined && newDay >= next.regrow) {
      const rest = unmarked(next);
      if (next.obstacle === "stump") next = { ...rest, obstacle: "sapling", regrow: newDay + REGROW_DAYS };
      else next = next.obstacle === "sapling" ? { ...rest, obstacle: "tree" } : rest;
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
      // Ladybugs, birds, and hens all eat pests.
      const guarded = near(state, x, y, ["bugHotel", "birdHouse", "chickenCoop"], 6);
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
    if (b.kind === "chickenCoop") {
      // Two eggs a morning (the nest box holds six), and every 3 days the manure has composted.
      const last = b.data.manureDay ?? newDay;
      const composted = newDay - last >= 3;
      return { ...b, data: { ...b.data, eggs: Math.min(6, (b.data.eggs ?? 0) + 2), ready: Math.min(5, (b.data.ready ?? 0) + (composted ? 1 : 0)), manureDay: composted ? newDay : last } };
    }
    if (b.kind === "smallBarn") return { ...b, data: { ...b.data, ready: Math.min(3, (b.data.ready ?? 0) + 1) } };
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
  const s = surface(startDay(runNight(tally(state, "slept")), d));
  return {
    ...s,
    energy: late ? Math.round(s.maxEnergy * 0.8) : s.maxEnergy,
    player: { x: 10, y: 9, facing: "down" },
  };
}

export function faint(state: WorldState): WorldState {
  const lost = Math.min(100, Math.round(state.coins * 0.1));
  const d = day({ ...state, minute: state.minute - 1 }) + 1;
  const s = surface(startDay({ ...state, minute: startOfDay(d) - 1 }, d));
  return {
    ...s,
    coins: s.coins - lost,
    energy: Math.round(s.maxEnergy * 0.5),
    player: { x: 10, y: 9, facing: "down" },
    log: { ...s.log!, notes: [`You stayed up past 2 AM and fainted! A neighbor carried you home and charged ${lost} coins.`, ...s.log!.notes] },
  };
}

// ───────────────────────── tools ─────────────────────────

const ENERGY: Record<ToolUse, number> = { hoe: 2, can: 1, scythe: 1, axe: 2, pickaxe: 2, shovel: 2, ring: 1 };

/** How many swings' worth of power it takes to clear each obstacle (a basic tool does 1 a swing). */
export const OBSTACLE_HP: Record<NonNullable<Obstacle>, number> = {
  stick: 1, sapling: 1, stone: 2, log: 4, stump: 5, tree: 8,
  copperOre: 3, tinOre: 3, ironOre: 5, goldOre: 6, mithrilOre: 9,
};
/** "stone", "log", or "copper ore rock". */
export const obstacleName = (o: NonNullable<Obstacle>) => (o.endsWith("Ore") ? `${ITEMS[o].name.toLowerCase()} rock` : o);

/** Rocks you break with a pickaxe (the rest are wood, for the axe). */
export const ROCKS: NonNullable<Obstacle>[] = ["stone", "copperOre", "tinOre", "ironOre", "goldOre", "mithrilOre"];
/** Wood from chopping each one. */
const WOOD: Partial<Record<NonNullable<Obstacle>, number>> = { stick: 1, sapling: 1, log: 4, stump: 3, tree: 6 };
/** Days for a felled tree's stump to sprout, and for the sapling to grow back into a tree. */
export const REGROW_DAYS = 7;

/** A tool's uses left (full when the slot doesn't say). */
export function durability(slot: Slot): { left: number; max: number } | null {
  const max = ITEMS[slot.item]?.tool?.durability;
  return max ? { left: slot.dur ?? max, max } : null;
}

/** Use up one use of the selected tool; it breaks when it runs out. */
function wear(state: WorldState, i: number): WorldState {
  const slot = state.inventory[i];
  const d = slot && durability(slot);
  if (!slot || !d) return state;
  const inv = [...state.inventory];
  if (d.left > 1) {
    inv[i] = { ...slot, dur: d.left - 1 };
    return { ...state, inventory: inv };
  }
  inv[i] = null;
  return say({ ...state, inventory: inv }, `Your ${ITEMS[slot.item].name.toLowerCase()} wore out! Buy or craft a new one.`);
}

/** A tile without its damage and regrowth marks (for when its obstacle changes). */
function unmarked(t: Tile): Tile {
  const out = { ...t };
  delete out.hits;
  delete out.regrow;
  return out;
}

/** A tile whose obstacle is gone. */
const cleared = (t: Tile): Tile => ({ ...unmarked(t), obstacle: null });

/** A rock breaks: stone or ore, and maybe the ladder down that was hiding under it. */
function breakRock(state: WorldState, x: number, y: number, o: NonNullable<Obstacle>): WorldState {
  const qty = o === "stone" || o === "mithrilOre" ? 1 : 1 + ((x + y) % 2);
  const got = addItem(setTile(state, x, y, cleared), o, qty);
  if (!got) return say(state, "Your bag is full.");
  let s = say(got, `+${qty} ${item(o).name.toLowerCase()}.`);
  if (o !== "stone") s = discover(s, o);
  const m = s.mine;
  if (m && m.ladderAt === y * MINE_W + x) {
    s = { ...s, mine: { ...m, buildings: [...m.buildings, { id: "ladder-down", kind: "ladderDown", x, y, data: {} }] } };
    s = say(s, "You found a ladder going down!");
  }
  return s;
}

/** One swing of an axe or pickaxe at the obstacle in front of you. */
function hitObstacle(state: WorldState, x: number, y: number, power: number, verb: string): WorldState {
  const t = tileAt(state, x, y)!;
  const o = t.obstacle!;
  const hits = (t.hits ?? 0) + power;
  const hp = OBSTACLE_HP[o];
  const what = obstacleName(o);
  if (hits < hp) return say(setTile(state, x, y, (tt) => ({ ...tt, hits })), `${verb}! The ${what} is ${Math.round((hits / hp) * 100)}% broken.`);
  if (ROCKS.includes(o)) return breakRock(state, x, y, o);
  const wood = WOOD[o] ?? 1;
  if (o === "tree") {
    // A felled tree leaves a stump that sprouts again, unless it's in the garden field.
    const inField = x >= FARM.x0 && x <= FARM.x1 && y >= FARM.y0 && y <= FARM.y1;
    const got = addItem(setTile(state, x, y, (tt) => (
      inField ? { ...unmarked(tt), obstacle: "stump" } : { ...unmarked(tt), obstacle: "stump", regrow: day(state) + REGROW_DAYS }
    )), "wood", wood);
    if (!got) return say(state, "Your bag is full.");
    return discover(say(got, `Timber! +${wood} wood.${inField ? "" : " The stump will sprout again unless you chop it out."}`), "forest-regrowth");
  }
  const got = addItem(setTile(state, x, y, cleared), "wood", wood);
  return got ? say(got, `+${wood} wood.`) : say(state, "Your bag is full.");
}

export function selectedItem(state: WorldState) {
  return state.inventory[state.selected];
}

/** The main action button: observe critters, harvest ripe crops, or use the selected item. */
export function act(state: WorldState): WorldState {
  const { x, y } = facingTile(state);
  const t = tileAt(state, x, y);
  if (!t) return state;
  if (crittersHere(state).some((c) => c.x === x && c.y === y)) return interact(state);
  // Ladders, the mine entrance, and Grandma's barn work with whatever you're holding.
  const b = buildingAt(state, x, y);
  if (b && (b.kind === "ladderUp" || b.kind === "ladderDown" || b.kind === "mineEntrance" || (b.kind === "barn" && !b.data.owner))) return interact(state);
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
  if (def.kind === "food") return eat(state, state.selected);
  if (plotLocked(state, x, y)) return say(state, "This plot isn't yours yet. Press E to see its price.");

  if (def.kind === "kit") return placeBuilding(state, state.selected, x, y);
  if (def.kind === "seed") return plant(state, x, y, def.crop!);
  if (def.kind === "amendment") return applyAmendment(state, x, y, slot.item);
  if (def.kind !== "tool") return interact(state);

  const use = def.tool!.use;
  const power = TIERS[def.tool!.tier].power;
  const b = buildingAt(state, x, y);
  const spent = spend(state, ENERGY[use]);
  if (!spent) return say(state, "You're too tired. Go home and sleep.");
  // Every use that does something wears the tool a little.
  const paid = wear(spent, state.selected);

  switch (use) {
    case "hoe": {
      if (t.ground !== "farm" && !t.greenhouse) return say(state, "You can only till the garden field or greenhouse beds.");
      if (b && b.kind !== "greenhouse") return say(state, "Something is built here.");
      if (t.obstacle) return say(state, `Clear the ${t.obstacle} first.`);
      if (t.weeds) return say(state, "Cut the weeds with the scythe first.");
      if (t.tilled) return say(state, "This soil is already tilled.");
      return say(setTile(tally(paid, "tilled"), x, y, (tt) => ({
        ...tt, tilled: true,
        soil: on(state, "tillage") ? { ...tt.soil, structure: clamp(tt.soil.structure - 2), om: clamp(tt.soil.om - 0.5), life: clamp(tt.soil.life - 1) } : tt.soil,
      })), on(state, "tillage") ? "Tilled! (Each tilling breaks soil crumbs a little, so only till where you'll plant.)" : "Tilled!");
    }
    case "can": {
      if (t.ground === "water") return say({ ...paid, water: state.canSize }, "Filled your watering can at the pond.");
      if (b?.kind === "rainBarrel") return refillFromBarrel(paid, b);
      if (b?.kind === "well") return fromWell(paid);
      if (state.water <= 0) return say(state, "Your watering can is empty. Refill it at the pond or a rain barrel.");
      if (!t.tilled) return say(state, "Water tilled soil or crops.");
      // Each pour soaks the soil part way; keep pouring and it gets waterlogged.
      return setTile({ ...paid, water: state.water - 1 }, x, y, (tt) => ({ ...tt, moisture: clamp(tt.moisture + 45) }));
    }
    case "scythe": {
      if (t.weeds) {
        const got = addItem(setTile(tally(paid, "weeds"), x, y, (tt) => ({ ...tt, weeds: false })), "fiber", 1);
        return got ? say(got, "Cut weeds (+1 fiber).") : say(state, "Your bag is full.");
      }
      if (t.crop?.dead) {
        const got = addItem(setTile(paid, x, y, (tt) => ({ ...tt, crop: null })), "fiber", 1);
        return got ? say(got, "Cleared a dead plant (+1 fiber).") : state;
      }
      return state;
    }
    case "axe": {
      if (!t.obstacle || ROCKS.includes(t.obstacle)) return state;
      return hitObstacle(paid, x, y, power, "Chop");
    }
    case "pickaxe": {
      if (t.obstacle && ROCKS.includes(t.obstacle)) return hitObstacle(paid, x, y, power, "Crack");
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

function fromWell(state: WorldState): WorldState {
  return discover(say({ ...state, water: state.canSize }, "Filled your watering can from the well: groundwater, soaked up from rain over many years."), "groundwater");
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

export type InteractTarget = "house" | "store" | "tv" | "shipping" | "board" | "chest" | "mine" | "craft" | "plot" | "gate" | "stall" | null;

/** Harvest, use buildings, or pick up critters on the facing tile. Returns which menu to open, if any. */
export function interactTarget(state: WorldState): InteractTarget {
  const { x, y } = facingTile(state);
  const b = buildingAt(state, x, y);
  if (b?.kind === "house") return "house";
  if (b?.kind === "store") return "store";
  if (b?.kind === "shippingBin") return "shipping";
  if (b?.kind === "noticeBoard") return "board";
  if (b?.kind === "chest") return "chest";
  if (b?.kind === "gardenGate") return "gate";
  if (b?.kind === "marketStall") return "stall";
  if (!b && plotLocked(state, x, y)) return "plot";
  if (b && b.kind in STATIONS) return "craft";
  // Once you've been deep enough, the mine cart at the entrance can take you down.
  if (b?.kind === "mineEntrance" && mineOpen(state) && (state.deepest ?? 0) >= 5) return "mine";
  return null;
}

export function interact(state: WorldState): WorldState {
  const { x, y } = facingTile(state);
  const t = tileAt(state, x, y);
  if (!t) return state;
  const critter = crittersHere(state).find((c) => c.x === x && c.y === y);
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
    case "well":
      return fromWell(state);
    case "chickenCoop": {
      const eggs = b.data.eggs ?? 0, manure = b.data.ready ?? 0;
      if (!eggs && !manure) return discover(say(state, "The hens are scratching for bugs. Come back in the morning for eggs."), "hen");
      let got: WorldState | null = update({ ...b.data, eggs: 0, ready: 0 });
      if (eggs) got = got && addItem(got, "egg", eggs);
      if (manure) got = got && addItem(got, "compost", manure);
      if (!got) return say(state, "Your bag is full.");
      const parts = [eggs ? `${eggs} egg${eggs > 1 ? "s" : ""}` : "", manure ? `${manure} compost from composted manure` : ""].filter(Boolean).join(" and ");
      return discover(say(got, `Collected ${parts}.`), "hen");
    }
    case "smallBarn": {
      const hay = b.data.ready ?? 0;
      if (!hay) return say(state, "The barn is stacked with hay. Old hay turns into straw mulch each morning.");
      const got = addItem(update({ ...b.data, ready: 0 }), "mulch", hay);
      return got ? say(got, `Collected ${hay} straw mulch from the barn.`) : say(state, "Your bag is full.");
    }
    case "barn": {
      if (b.data.owner) return say(state, "The Ortegas' barn smells like hay and corn.");
      if (state.foundWorkbench) return say(state, "Grandma Rosa's old barn. Swallows nest in the rafters.");
      // Under a dusty tarp in the barn: Grandma's workbench.
      const got = addItem(state, "kit_workbench", 1);
      if (!got) return say(state, "Something big is under a tarp in the barn. Make room in your bag to carry it.");
      return say({ ...got, foundWorkbench: true }, "Under a dusty tarp in the barn you find Grandma Rosa's old workbench! Set it up on the farm to start crafting.");
    }
    case "chest":
      return say(state, "Grandma Rosa's old chest. Open it to store things or take them out.");
    case "mineEntrance":
      if (!mineOpen(state)) return say(state, "Old boards cover the mine entrance. Luis might know something about it.");
      return enterMine(state, 1);
    case "ladderDown":
      return enterMine(state, (state.mine?.floor ?? 0) + 1);
    case "ladderUp":
      return leaveMine(state);
    case "silo":
      return say(state, "A tall silo for storing grain through the winter.");
    case "windmill":
      return say(state, "The windmill creaks as it turns. Wind power once pumped water for the whole valley.");
    case "waterTower":
      return say(state, "The town water tower. Gravity pushes the water down through the pipes to every house.");
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
  if (lockedInShop(state, id)) return say(state, "That's not in stock yet.");
  if (ITEMS[id]?.kind === "tool") {
    if (owns(state, id)) return say(state, `You already have a ${item(id).name.toLowerCase()}.`);
    qty = 1;
  }
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

/** True until the quest that introduces this item is done (see SHOP_UNLOCKS). */
export function lockedInShop(state: WorldState, id: string): boolean {
  const quest = SHOP_UNLOCKS[id];
  return !!quest && !(state.quests?.done ?? []).includes(quest);
}

/** Whether you have this item in your bag or in a chest. */
export function owns(state: WorldState, id: string): boolean {
  return countItem(state, id) > 0 || state.buildings.some((b) => b.data.items?.some((x) => x?.item === id));
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
  return say({ ...tally(state, "sold"), inventory: inv, coins: state.coins + coins }, `Sold ${n} ${def.name}${s.grade ? ` (grade ${s.grade})` : ""} for ${coins} coins.`);
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
  return say({ ...tally(removed, "sold"), shipping }, `Put ${s.qty} ${def.name} in the shipping bin. You'll be paid overnight.`);
}

// ───────────────────────── building ─────────────────────────

export function canPlace(state: WorldState, kind: BuildingKind, x: number, y: number): string | null {
  const [w, h] = BUILDING_SIZE[kind];
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    const t = tileAt(state, xx, yy);
    if (!t) return "Too close to the edge.";
    if (xx >= FARM_W) return "Build on your own farm, not in town.";
    if (plotLocked(state, xx, yy)) return "That plot isn't yours yet.";
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
  if (state.mine) return say(state, "Build up on your farm, not in the mine.");
  const def = item(s.item);
  if (!def.building) return state;
  const { x: ox, y: oy } = placementFor(state, def.building, x, y);
  const reason = canPlace(state, def.building, ox, oy);
  if (reason) return say(state, reason);
  let next = removeItem(state, s.item, 1)!;
  const rot = rotatable(def.building) ? (state.placeRot ?? 0) % 4 : 0;
  const b: Building = {
    id: `${def.building}-${state.minute}-${ox}-${oy}`, kind: def.building, x: ox, y: oy,
    ...(rot ? { rot } : {}), data: def.building === "rainBarrel" ? { water: 0 } : {},
  };
  next = { ...next, buildings: [...next.buildings, b] };
  if (def.building === "greenhouse") {
    for (const p of greenhouseInterior(b)) {
      next = setTile(next, p.x, p.y, (t) => ({ ...t, greenhouse: true, ground: "farm", weeds: false, obstacle: null }));
    }
  }
  next = say(next, `Built ${/^[AEIOU]/.test(def.name) ? "an" : "a"} ${def.name}!`);
  return def.building === "greenhouse" ? discover(next, "greenhouse-effect") : next;
}

/** Things you build can be turned to face any way, except the greenhouse (its door faces the path). */
export const rotatable = (kind: BuildingKind) => kind !== "greenhouse";

/** Turn the next thing you build a quarter turn. */
export function turnPlacing(state: WorldState): WorldState {
  return { ...state, placeRot: ((state.placeRot ?? 0) + 1) % 4 };
}

/** Turn something you built (the one in front of you) a quarter turn. */
export function rotateBuilding(state: WorldState): WorldState {
  if (state.mine) return state;
  const { x, y } = facingTile(state);
  const b = buildingAt(state, x, y);
  if (!b || !canPickUp(b)) return state;
  if (!rotatable(b.kind)) return say(state, "The greenhouse door has to face the path.");
  const rot = ((b.rot ?? 0) + 1) % 4;
  return { ...state, buildings: state.buildings.map((o) => (o.id === b.id ? { ...o, rot } : o)) };
}

/** Things you built yourself can be picked back up (Grandma's chest stays by the house). */
export const canPickUp = (b: Building) => !TOWN_KINDS.includes(b.kind) && !b.data.owner && b.id !== "chest";

export function pickUpBuilding(state: WorldState, id: string): WorldState {
  const b = state.buildings.find((x) => x.id === id);
  if (!b || !canPickUp(b)) return state;
  if (b.kind === "chest" && b.data.items?.some(Boolean)) return say(state, "Empty the chest first.");
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

// ───────────────────────── farm plots ─────────────────────────

export const ownedPlots = (state: WorldState) => state.plots ?? [0];

/** True on farmland in a plot you don't own yet (the mine and town are never locked). */
export function plotLocked(state: WorldState, x: number, y: number): boolean {
  if (state.mine) return false;
  const p = plotAt(x, y);
  return p !== null && !ownedPlots(state).includes(p);
}

/** What the next plot costs. */
export const nextPlotPrice = (state: WorldState) => plotPrice(ownedPlots(state).length);

/** Buy a plot of farmland. */
export function buyPlot(state: WorldState, id: number): WorldState {
  if (!PLOTS[id] || ownedPlots(state).includes(id)) return state;
  const price = nextPlotPrice(state);
  if (state.coins < price) return say(state, `This plot costs ${price} coins.`);
  return say({ ...state, coins: state.coins - price, plots: [...ownedPlots(state), id] }, `You bought a new plot for ${price} coins! Clear it and get planting.`);
}

/** Unlock the next plots for free (a quest reward), nearest the house first. */
export function grantPlots(state: WorldState, n: number): WorldState {
  const owned = ownedPlots(state);
  const add = PLOTS.map((p) => p.id).filter((id) => !owned.includes(id)).slice(0, n);
  return add.length ? { ...state, plots: [...owned, ...add] } : state;
}

// ───────────────────────── crafting ─────────────────────────

/** What each crafting station is called. */
export const STATIONS: Record<Station, string> = {
  workbench: "Workbench", grinder: "Grinder", spinningWheel: "Spinning Wheel", furnace: "Furnace", stove: "Stove", oven: "Oven",
};

/** Kitchen stations count when they stand within this many steps of the one you're cooking at. */
export const KITCHEN_REACH = 3;

/** True for food: dishes made in a kitchen (or with only a knife, anywhere). */
export const isCooking = (r: Recipe) => !!r.tools || !!r.stations;

/** The stoves and ovens that make up the kitchen around the station you're at. */
export function kitchenAt(state: WorldState, at?: string): Station[] {
  const b = at ? state.buildings.find((x) => x.id === at) : undefined;
  if (!b || (b.kind !== "stove" && b.kind !== "oven")) return [];
  const near = state.buildings.filter((o) => (o.kind === "stove" || o.kind === "oven") && Math.abs(o.x - b.x) <= KITCHEN_REACH && Math.abs(o.y - b.y) <= KITCHEN_REACH);
  return [...new Set(near.map((o) => o.kind as Station))];
}

/** How many of a recipe's inputs you have, the utensils and stations it's missing, and whether you can make it. */
export function recipeStatus(state: WorldState, recipe: Recipe, at?: string) {
  const inputs = recipe.inputs.map((i) => ({ ...i, have: countItem(state, i.item) }));
  const missingTools = (recipe.tools ?? []).filter((t) => countItem(state, t) === 0);
  const kitchen = kitchenAt(state, at);
  const missingStations = (recipe.stations ?? []).filter((st) => !kitchen.includes(st));
  return { inputs, missingTools, missingStations, ok: inputs.every((i) => i.have >= i.qty) && !missingTools.length && !missingStations.length };
}

/** Make one batch of a recipe: at a station, in a kitchen (`at` is the stove or oven you're using), or from your bag. */
export function craft(state: WorldState, id: string, at?: string): WorldState {
  const recipe = RECIPES.find((x) => x.id === id);
  if (!recipe) return state;
  const st = recipeStatus(state, recipe, at);
  if (st.missingTools.length) return say(state, `You need a ${st.missingTools.map((t) => item(t).name.toLowerCase()).join(" and a ")} in your bag.`);
  if (st.missingStations.length) return say(state, `Cook this at a ${st.missingStations.map((x) => STATIONS[x].toLowerCase()).join(" with an ")}${st.missingStations.length > 1 ? " beside it" : ""}.`);
  if (!st.ok) return say(state, "You don't have everything for that yet.");
  let s = state;
  for (const i of recipe.inputs) s = removeItem(s, i.item, i.qty)!;
  const got = addItem(s, recipe.id, recipe.qty);
  if (!got) return say(state, "Your bag is full.");
  const made = say(got, `${isCooking(recipe) ? "Cooked" : "Made"} ${recipe.qty > 1 ? `${recipe.qty} ` : ""}${item(recipe.id).name}!`);
  if (isCooking(recipe)) {
    const cooked = tally(made, "cooked");
    return discover(cooked, "sun-to-supper");
  }
  return recipe.id === "bronzeBar" ? discover(made, "alloy") : recipe.station === "furnace" ? discover(made, "smelting") : made;
}

// ───────────────────────── food ─────────────────────────

/** Eat food from your bag: it gives back energy. */
export function eat(state: WorldState, slotIndex: number): WorldState {
  const s = state.inventory[slotIndex];
  const def = s ? ITEMS[s.item] : null;
  if (!s || !def?.energy) return state;
  if (on(state, "energy") && state.energy >= state.maxEnergy) return say(state, "You're full of energy. Save it for later.");
  const eaten = removeItem(state, s.item, 1);
  if (!eaten) return state;
  const gain = Math.min(def.energy, state.maxEnergy - state.energy);
  const fed = tally({ ...eaten, energy: state.energy + gain }, "ate");
  return say(fed, on(state, "energy") ? `Ate ${def.name}. +${gain} energy.` : `Ate ${def.name}. Yum! (Energy is turned off in this game.)`);
}

// ───────────────────────── Garden Lane ─────────────────────────

/** Through a gate on Garden Lane. Yours (gate 0) leads home; the others are overgrown in a game of your own. */
export function enterGate(state: WorldState, garden: number): WorldState {
  if (state.mine) return state;
  if (garden !== 0) return say(state, "Brambles grow over this gate. Nobody farms here. In a shared world, a friend's garden would be through here.");
  return say({ ...state, player: { ...GARDEN_ENTRY } }, "Home sweet home.");
}

/** Out along your farm's road, back to your gate on Garden Lane. */
export function leaveFarm(state: WorldState): WorldState {
  if (state.mine || !atGardenExit(state.player)) return state;
  return { ...state, player: { x: LANE_X, y: GATE_ROWS[0], facing: "right" } };
}

// ───────────────────────── your market stall ─────────────────────────

/** The listings on your stall. */
export const stallListings = (state: WorldState): Listing[] => state.stall ?? [];

/** Put some of a bag stack on your stall, at your price. */
export function stockStall(state: WorldState, slot: number, qty: number, price: number): WorldState {
  const s = state.inventory[slot];
  if (!s) return state;
  const def = ITEMS[s.item];
  if (!def.sell || def.tool || def.kind === "utensil") return say(state, "You can't sell that at the market.");
  const n = Math.max(1, Math.min(Math.floor(qty) || 1, s.qty));
  const each = Math.max(1, Math.round(price) || 1);
  const list = stallListings(state);
  const same = list.findIndex((l) => l.item === s.item && l.grade === s.grade && l.price === each);
  if (same < 0 && list.length >= STALL_SIZE) return say(state, `Your stall holds ${STALL_SIZE} kinds of things. Take something off first.`);
  const listing: Listing = s.grade ? { item: s.item, qty: n, grade: s.grade, price: each } : { item: s.item, qty: n, price: each };
  const stall = same >= 0 ? list.map((l, i) => (i === same ? { ...l, qty: l.qty + n } : l)) : [...list, listing];
  const inventory = state.inventory.map((x, i) => (i === slot ? (x!.qty - n > 0 ? { ...x!, qty: x!.qty - n } : null) : x));
  return say({ ...state, inventory, stall }, `Put ${n} ${def.name} on your stall for ${each} coins each.`);
}

/** Take a listing back off your stall. */
export function unstockStall(state: WorldState, listing: number): WorldState {
  const l = stallListings(state)[listing];
  if (!l) return state;
  const back = addItem(state, l.item, l.qty, l.grade);
  if (!back) return say(state, "Your bag is full.");
  return { ...back, stall: stallListings(state).filter((_, i) => i !== listing) };
}

/** What a stall listing would fetch at the store: the fair price townsfolk expect. */
export const fairPrice = (state: WorldState, l: Pick<Listing, "item" | "grade">) => Math.max(1, sellPrice(ITEMS[l.item], l.grade, state.organic));

/**
 * The chance a passer-by buys one of a listing this hour: about 1 in 3 at the store's price,
 * less the more you ask, never above 3 times the store's price, and always when it's a bargain.
 */
export function stallChance(state: WorldState, l: Listing): number {
  const ratio = l.price / fairPrice(state, l);
  if (ratio <= 0.8) return 1;
  if (ratio >= 3) return 0;
  return Math.min(1, (0.35 * (3 - ratio)) / 2);
}

/** Who stops at your stall. */
const SHOPPERS = ["Mei", "Dr. Okafor", "June", "Luis", "Pip", "A traveler", "A neighbor"];

/** Townsfolk browse your stall during the day (8 AM to 8 PM): each listing may sell one an hour. */
function stallSales(state: WorldState): WorldState {
  const list = stallListings(state);
  const hour = Math.floor(timeOfDay(state.minute) / 60);
  if (!list.length || hour < 8 || hour >= 20) return state;
  let seed = (state.seed ^ Math.imul(state.minute, 0x9e3779b1)) >>> 0;
  const rand = () => {
    const [v, n] = nextRandom(seed);
    seed = n;
    return v;
  };
  let s = state;
  const stall: Listing[] = [];
  for (const l of list) {
    const roll = rand();
    const who = SHOPPERS[Math.floor(rand() * SHOPPERS.length)];
    if (roll >= stallChance(state, l)) {
      stall.push(l);
      continue;
    }
    s = say(tally({ ...s, coins: s.coins + l.price }, "sold"), `${who} bought ${ITEMS[l.item].name} from your stall: +${l.price} coins.`);
    if (l.qty > 1) stall.push({ ...l, qty: l.qty - 1 });
  }
  return { ...s, stall };
}

// ───────────────────────── the mine ─────────────────────────

/** Luis's quest boards up... unboards the old mine. */
export const mineOpen = (state: WorldState) => (state.quests?.done ?? []).includes("reopen-mine");

/** Floors the mine cart can take you to: the top, and every fifth floor you've reached. */
export function cartFloors(state: WorldState): number[] {
  const out = [1];
  for (let f = 5; f <= (state.deepest ?? 0); f += 5) out.push(f);
  return out;
}

/** Climb down to a floor: a fresh cave, with you standing by the ladder up. */
export function enterMine(state: WorldState, floor: number): WorldState {
  if (!mineOpen(state)) return state;
  const mine = mineFloor(state.seed, floor, day(state));
  const deepest = Math.max(state.deepest ?? 0, floor);
  const s: WorldState = { ...state, mine, deepest, player: { x: MINE_START.x, y: MINE_START.y + 1, facing: "down" } };
  const note = floor === 1 ? "The old mine. Break rocks with your pickaxe; a ladder down hides under one of them." : `Floor ${floor}.`;
  return say(s, deepest > (state.deepest ?? 0) && floor % 5 === 0 ? `${note} The mine cart can bring you back to this floor.` : note);
}

/** Without the mine: you're back up top. */
function surface(state: WorldState): WorldState {
  const s = { ...state };
  delete s.mine;
  return s;
}

/** Climb out of the mine to the entrance in town. */
export function leaveMine(state: WorldState): WorldState {
  if (!state.mine) return state;
  return say({ ...surface(state), player: { x: MINE_ENTRANCE.x + 1, y: MINE_ENTRANCE.y + 2, facing: "down" } }, "You climb back out into the daylight.");
}

// ───────────────────────── chests ─────────────────────────

function setChest(state: WorldState, id: string, items: (Slot | null)[]): WorldState {
  return { ...state, buildings: state.buildings.map((b) => (b.id === id ? { ...b, data: { ...b.data, items } } : b)) };
}

function chestItems(state: WorldState, id: string): (Slot | null)[] | null {
  const b = state.buildings.find((x) => x.id === id && x.kind === "chest");
  if (!b) return null;
  const items = [...(b.data.items ?? [])];
  while (items.length < CHEST_SIZE) items.push(null);
  return items;
}

/** Move a stack from a chest into your bag. */
export function takeFromChest(state: WorldState, id: string, slot: number): WorldState {
  const items = chestItems(state, id);
  const s = items?.[slot];
  if (!items || !s) return state;
  const got = addSlot(state, s);
  if (!got) return say(state, "Your bag is full.");
  items[slot] = null;
  return setChest(got, id, items);
}

/** Put a whole stack in the bag, keeping a tool's wear. */
function addSlot(state: WorldState, s: Slot): WorldState | null {
  if (s.dur === undefined) return addItem(state, s.item, s.qty, s.grade);
  const i = state.inventory.findIndex((x) => !x);
  if (i < 0) return null;
  const inv = [...state.inventory];
  inv[i] = { ...s };
  return { ...state, inventory: inv };
}

/** Move everything that fits from a chest into your bag. */
export function takeAllFromChest(state: WorldState, id: string): WorldState {
  let s = state;
  for (let i = 0; i < CHEST_SIZE; i++) s = takeFromChest(s, id, i);
  return s;
}

/** Move a stack from your bag into a chest, stacking with the same item. */
export function putInChest(state: WorldState, id: string, invSlot: number): WorldState {
  const items = chestItems(state, id);
  const s = state.inventory[invSlot];
  if (!items || !s) return state;
  const same = items.findIndex((x) => x && x.item === s.item && x.grade === s.grade && ITEMS[s.item].kind !== "tool");
  const at = same >= 0 ? same : items.findIndex((x) => !x);
  if (at < 0) return say(state, "The chest is full.");
  items[at] = same >= 0 ? { ...items[at]!, qty: items[at]!.qty + s.qty } : { ...s };
  const inv = [...state.inventory];
  inv[invSlot] = null;
  return setChest({ ...state, inventory: inv }, id, items);
}

/** Saves from before the town: keep the farm, rebuild the map at the new size, and add the town. */
function addTown(old: WorldState): WorldState {
  const oldW = old.tiles.length / OLD_H;
  const fresh = createMap(old.seed);
  const tiles = fresh.tiles.map((t, i) => {
    const x = i % W, y = Math.floor(i / W);
    return x < FARM_W && x < oldW && y < OLD_H ? old.tiles[y * oldW + x] : t;
  });
  // The store moved into town; the farm keeps everything you built.
  const farm = old.buildings.filter((b) => b.kind !== "store" && b.x < FARM_W);
  const town = fresh.buildings.filter((b) => !farm.some((f) => f.id === b.id));
  return { ...old, version: 4, tiles, buildings: [...farm, ...town] };
}

/**
 * Version 5 added landmarks (barns, silos, the windmill, the water tower). Older saves get each
 * one whose ground is still free; one that would land on something the player built or planted
 * is left out.
 */
function addLandmarks(old: WorldState, version = 5): WorldState {
  let s: WorldState = { ...old, version };
  const all = [...farmBuildings(), ...townBuildings()];
  for (const b of all) {
    if (s.buildings.some((x) => x.id === b.id)) continue;
    const [w, h] = BUILDING_SIZE[b.kind];
    let free = true;
    for (let y = b.y; y < b.y + h; y++) for (let x = b.x; x < b.x + w; x++) if (buildingAt(s, x, y) || s.tiles[idx(x, y)].crop) free = false;
    if (!free) continue;
    const tiles = [...s.tiles];
    for (let y = b.y; y < b.y + h; y++) for (let x = b.x; x < b.x + w; x++) {
      const t = tiles[idx(x, y)];
      tiles[idx(x, y)] = { ...t, obstacle: null, weeds: false, tilled: false, ground: t.ground === "forest" ? "grass" : t.ground };
    }
    s = { ...s, tiles, buildings: [...s.buildings, b] };
  }
  return s;
}

/**
 * Version 6 moved the starting tools into a chest and locked the science tools behind quests.
 * Older farms already have their tools, so they get an empty chest and the tools stay unlocked.
 */
function addChest(old: WorldState): WorldState {
  const s = addLandmarks(old, 6);
  const qs = s.quests ?? { active: [], done: [] };
  // (Only the science tools: the kitchen came later, with its own quest.)
  const unlocks = Object.entries(SHOP_UNLOCKS).filter(([id]) => !id.startsWith("kit_")).map(([, q]) => q).filter((q) => !qs.done.includes(q));
  return { ...s, quests: { ...qs, done: [...qs.done, ...unlocks] } };
}

/** Version 9 added Grandma Rosa's lessons. Older farms already know the ropes, so they're done. */
function finishLessons(old: WorldState): WorldState {
  const qs = old.quests ?? { active: [], done: [] };
  return { ...old, version: 9, quests: { ...qs, done: [...qs.done, ...LESSONS.filter((l) => !qs.done.includes(l))] } };
}

/**
 * Version 8 split the farmland into plots and added the South Fields below the old map. Older
 * farms keep the whole field they had, gain the new rows, and get a path cut through the forest.
 */
function addSouthFields(old: WorldState): WorldState {
  let tiles = old.tiles;
  if (tiles.length === W * OLD_H) tiles = [...tiles, ...createMap(old.seed).tiles.slice(W * OLD_H)];
  let s: WorldState = { ...old, version: 8, tiles, plots: PLOTS.filter((p) => p.y1 < OLD_H).map((p) => p.id) };
  for (const [x, y] of SOUTH_PATH) {
    if (buildingAt(s, x, y) || s.tiles[idx(x, y)].crop) continue;
    s = setTile(s, x, y, (t) => ({ ...unmarked(t), ground: "path", obstacle: null, weeds: false }));
  }
  return s;
}

/**
 * Version 10 put Garden Lane between the farm and town (your farm is reached through its gate),
 * set up your market stall, and locked the field plots that version 8 handed out free and that
 * still stand empty, so they can be bought or earned like on a new farm.
 */
function addGardenLaneV10(old: WorldState): WorldState {
  const tiles = [...old.tiles];
  addGardenLane(tiles);
  let s: WorldState = { ...old, version: 10, tiles };
  for (const b of laneBuildings()) {
    if (s.buildings.some((x) => x.id === b.id)) continue;
    s = setTile(s, b.x, b.y, (t) => ({ ...unmarked(t), obstacle: null, weeds: false, ground: t.ground === "forest" ? "grass" : t.ground }));
    s = { ...s, buildings: [...s.buildings, b] };
  }
  const px = Math.round(s.player.x);
  if (!s.mine && px >= FARM_W && px <= LANE_X + 1) s = { ...s, player: { x: LANE_X + 1, y: GARDEN_ENTRY.y, facing: "right" } };
  return { ...s, plots: relockedPlots(s) };
}

/** The field plots version 8 gave old farms, minus the ones still empty (plot 0 always stays yours). */
function relockedPlots(s: WorldState): number[] {
  const owned = ownedPlots(s);
  const field = PLOTS.filter((p) => p.y1 < OLD_H).map((p) => p.id);
  // Only farms that got the whole field from version 8 (it handed them out in order).
  if (!field.every((id, i) => owned[i] === id)) return owned;
  const used = (id: number) => {
    const p = PLOTS[id];
    for (let y = p.y0; y <= p.y1; y++) for (let x = p.x0; x <= p.x1; x++) {
      const t = s.tiles[idx(x, y)];
      if (t.tilled || t.crop || t.mulch || t.greenhouse || buildingAt(s, x, y)) return true;
    }
    return false;
  };
  return owned.filter((id) => id === 0 || !field.includes(id) || used(id));
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
    if (up.tiles.length === W * OLD_H) up = { ...up, tiles: [...up.tiles, ...createMap(up.seed).tiles.slice(W * OLD_H)] };
    if (up.tiles.length !== W * H) return null;
    if (up.version < 5) up = addLandmarks(up);
    if (up.version < 6) up = addChest(up);
    // Version 7 added the mine entrance past the town.
    if (up.version < 7) up = addLandmarks(up, 7);
    if (up.version < 8) up = addSouthFields(up);
    if (up.version < 9) up = finishLessons(up);
    if (up.version < 10) up = addGardenLaneV10(up);
    // Version 3 added crop grades: older tiles have no amendment points, crops no stress.
    return up.version === WORLD_VERSION ? { ...up, settings: normalizeSettings(up.settings) } : null;
  } catch {
    return null;
  }
}

export { FARM, W, H, DAY_START };
