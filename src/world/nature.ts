import { nextRandom } from "@/game/rng";
import { seasonOf, startOfDay } from "./clock";
import { BUILDING_SIZE, H, idx, TOWN, W } from "./map";
import type { Critter, Season, WeatherId, WorldState } from "./types";

/** Where and when each critter or fungus can turn up. */
interface Spawn {
  kind: string;
  icon: string;
  seasons: Season[];
  /** Where it shows up. */
  habitat: "farm" | "grass" | "forest" | "log" | "shore" | "flowers";
  /** Weather that makes it more likely (×3). */
  likes?: WeatherId[];
  /** Weather it avoids entirely. */
  avoids?: WeatherId[];
  weight: number;
}

export const SPAWNS: Spawn[] = [
  { kind: "ladybug", icon: "🐞", seasons: ["Spring", "Summer"], habitat: "farm", avoids: ["rain", "storm", "snow"], weight: 3 },
  { kind: "monarch", icon: "🦋", seasons: ["Summer", "Fall"], habitat: "flowers", avoids: ["rain", "storm", "frost", "snow"], weight: 2 },
  { kind: "pill-bug", icon: "🪲", seasons: ["Spring", "Summer", "Fall"], habitat: "log", likes: ["rain", "fog"], weight: 2 },
  { kind: "ground-beetle", icon: "🪲", seasons: ["Spring", "Summer", "Fall"], habitat: "farm", weight: 2 },
  { kind: "aphid", icon: "🦗", seasons: ["Spring", "Summer"], habitat: "farm", avoids: ["rain", "storm"], weight: 2 },
  { kind: "robin", icon: "🐦", seasons: ["Spring", "Summer", "Fall"], habitat: "grass", likes: ["rain"], weight: 2 },
  { kind: "chickadee", icon: "🐦", seasons: ["Fall", "Winter"], habitat: "forest", weight: 2 },
  { kind: "oyster-mushroom", icon: "🍄", seasons: ["Spring", "Fall", "Winter"], habitat: "log", likes: ["rain", "fog"], weight: 1 },
  { kind: "puffball", icon: "🍄", seasons: ["Summer", "Fall"], habitat: "grass", likes: ["rain", "fog", "storm"], weight: 1 },
  { kind: "turkey-tail", icon: "🍄", seasons: ["Spring", "Summer", "Fall", "Winter"], habitat: "log", likes: ["fog"], weight: 1 },
  { kind: "frog", icon: "🐸", seasons: ["Spring", "Summer"], habitat: "shore", likes: ["rain", "storm"], weight: 2 },
  { kind: "dragonfly", icon: "🪰", seasons: ["Summer"], habitat: "shore", avoids: ["rain", "storm"], weight: 2 },
];

/** Mushrooms only fruit after damp weather. */
const FUNGI = new Set(["oyster-mushroom", "puffball", "turkey-tail"]);

function roll(seed: number) {
  let s = seed >>> 0;
  return () => {
    const [v, n] = nextRandom(s);
    s = n;
    return v;
  };
}

function habitatOk(state: WorldState, x: number, y: number, habitat: Spawn["habitat"]): boolean {
  const t = state.tiles[idx(x, y)];
  if (state.buildings.some((b) => {
    const [w, h] = BUILDING_SIZE[b.kind];
    return x >= b.x && x < b.x + w && y >= b.y && y < b.y + h;
  })) return false;
  switch (habitat) {
    case "farm": return t.ground === "farm" && !t.obstacle;
    case "grass": return t.ground === "grass" && !t.obstacle;
    case "forest": return t.ground === "forest" && t.obstacle === "tree";
    case "log": return t.obstacle === "log" || t.obstacle === "stump";
    case "shore": return t.ground === "sand";
    case "flowers": {
      const c = t.crop;
      return (!!c && !c.dead && c.growth > 0.5 && (c.id === "sunflower" || c.id === "buckwheat" || c.id === "clover"))
        || state.buildings.some((b) => b.kind === "flowerBed" && Math.abs(b.x - x) + Math.abs(b.y - y) === 1);
    }
  }
}

/** Each morning, a few creatures and fungi appear around the farm for the day. */
export function spawnCritters(state: WorldState, day: number): WorldState {
  const rand = roll(state.seed ^ (day * 104729) ^ 0x5eed);
  const season = seasonOf(day, state.settings);
  const today = state.weather[day]?.kind ?? "sunny";
  const yesterday = state.weather[day - 1]?.kind ?? "sunny";
  const damp = ["rain", "storm", "fog"].includes(today) || ["rain", "storm", "fog"].includes(yesterday);
  const until = startOfDay(day + 1) - 1;

  const pool = SPAWNS.filter((s) => s.seasons.includes(season) && !s.avoids?.includes(today) && (!FUNGI.has(s.kind) || damp));
  const weights = pool.map((s) => s.weight * (s.likes?.includes(today) ? 3 : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  const count = season === "Winter" ? 2 : 6;
  const critters: Critter[] = [];
  for (let n = 0; n < count && total > 0; n++) {
    let r = rand() * total;
    const spec = pool[weights.findIndex((w) => (r -= w) < 0)] ?? pool[0];
    // Try some random spots for its habitat: mostly around the farm and the country road, then anywhere in the valley.
    for (let tries = 0; tries < 60; tries++) {
      const x = Math.floor(rand() * (tries < 40 ? TOWN.x0 : W)), y = Math.floor(rand() * H);
      if (critters.some((c) => c.x === x && c.y === y)) continue;
      if (!habitatOk(state, x, y, spec.habitat)) continue;
      critters.push({ id: `${spec.kind}-${day}-${n}`, kind: spec.kind, x, y, until });
      break;
    }
  }
  return { ...state, critters };
}

/** Drop critters whose time is up. */
export function expireCritters(state: WorldState): WorldState {
  const left = state.critters.filter((c) => c.until > state.minute);
  return left.length === state.critters.length ? state : { ...state, critters: left };
}

export function critterIcon(kind: string): string {
  return SPAWNS.find((s) => s.kind === kind)?.icon ?? "✨";
}
