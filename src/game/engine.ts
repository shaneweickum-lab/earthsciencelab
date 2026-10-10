import { CROPS, FAMILY_LABEL, type CropFamily, type CropId } from "./crops";
import { PRACTICES, type PracticeId } from "./practices";
import { nextRandom } from "./rng";

export const GRID_SIZE = 3;
export const TOTAL_SEASONS = 12;
export const WIN_HEALTH = 70;
export const START_COINS = 100;
export const ORGANIC_BONUS = 1.25;
/** Bumped when the saved game shape changes, so old saves are discarded. */
export const GAME_VERSION = 3;

export const SEASON_NAMES = ["Spring", "Summer", "Fall", "Winter"] as const;
export type SeasonName = (typeof SEASON_NAMES)[number];

export type EventId = "calm" | "heavyRain" | "drought" | "pests" | "boomMarket" | "bustMarket";

export const EVENTS: Record<EventId, { name: string; icon: string; forecast: string }> = {
  calm: { name: "Calm Weather", icon: "⛅", forecast: "Mild weather ahead. A good time to build soil." },
  heavyRain: { name: "Heavy Rain", icon: "🌧️", forecast: "Storms coming! Bare soil will wash away. Cover it up." },
  drought: { name: "Drought", icon: "☀️", forecast: "Hot and dry ahead. Soil that holds water will do best." },
  pests: { name: "Pest Outbreak", icon: "🐛", forecast: "Pests are spreading. Crops grown over and over are easy targets." },
  boomMarket: { name: "Great Prices", icon: "📈", forecast: "Crop prices are high this season. Harvests pay extra." },
  bustMarket: { name: "Low Prices", icon: "📉", forecast: "Crop prices are low this season. Harvests pay less." },
};

/** Event odds by season, so summer brings droughts and spring brings storms. */
const EVENT_WEIGHTS: Record<SeasonName, [EventId, number][]> = {
  Spring: [["calm", 3], ["heavyRain", 4], ["pests", 2], ["bustMarket", 1]],
  Summer: [["calm", 2], ["drought", 4], ["pests", 3], ["boomMarket", 1]],
  Fall: [["calm", 3], ["heavyRain", 2], ["boomMarket", 2], ["bustMarket", 2]],
  Winter: [["calm", 4], ["heavyRain", 3]],
};

export interface Plot {
  id: number;
  /** 0–100 scores. Organic matter maps to roughly 0–8% real organic matter. */
  om: number;
  life: number;
  structure: number;
  water: number;
  nutrients: number;
  ph: number;
  noTill: boolean;
  noTillSeasons: number;
  hedgerow: boolean;
  biochar: boolean;
  /** What's growing right now. Null means an empty plot ready for seeds. */
  crop: CropId | null;
  /** Plant family grown here last season, for crop rotation. */
  lastFamily: CropFamily | null;
  /** How many seasons in a row the same family has been grown here (0 = rotated). */
  familyStreak: number;
  applied: PracticeId[];
  weedy: boolean;
  /** Which soil tests have been run. Untested metrics stay hidden from the player. */
  known: { lab: boolean; shovel: boolean; water: boolean };
}

export type Metric = "om" | "life" | "structure" | "water" | "nutrients" | "ph";

/** Which test reveals each metric. */
export const METRIC_TEST: Record<Metric, keyof Plot["known"]> = {
  om: "lab", nutrients: "lab", ph: "lab", life: "shovel", structure: "shovel", water: "water",
};

export function isKnown(p: Plot, m: Metric): boolean {
  return p.known[METRIC_TEST[m]];
}

export function fullyTested(p: Plot): boolean {
  return p.known.lab && p.known.shovel && p.known.water;
}

export interface SeasonReport {
  season: number;
  seasonName: SeasonName;
  event: EventId;
  harvest: number;
  grazingIncome: number;
  lostOrganic: boolean;
  weedsReturned: number;
  healthBefore: number;
  healthAfter: number;
  plotHealthChange: number[];
  insights: string[];
}

export type GameStatus = "playing" | "won" | "lost";

export interface GameState {
  version: number;
  seed: number;
  season: number;
  coins: number;
  organic: boolean;
  /** Organic status at the start of this season, so the report can say when it changed. */
  organicAtSeasonStart: boolean;
  plots: Plot[];
  forecast: EventId;
  status: GameStatus;
  history: SeasonReport[];
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

export function seasonName(season: number): SeasonName {
  return SEASON_NAMES[(season - 1) % 4];
}

export function phScore(ph: number): number {
  return clamp(100 - 30 * Math.abs(ph - 6.5));
}

export function plotHealth(p: Plot): number {
  return round1(
    0.25 * p.om + 0.2 * p.life + 0.2 * p.structure + 0.15 * p.water + 0.1 * p.nutrients + 0.1 * phScore(p.ph),
  );
}

export function fieldHealth(plots: Plot[]): number {
  return round1(plots.reduce((s, p) => s + plotHealth(p), 0) / plots.length);
}

export function organicMatterPercent(om: number): number {
  return round1(om * 0.08);
}

function rollEvent(seed: number, season: number): [EventId, number] {
  const weights = EVENT_WEIGHTS[seasonName(season)];
  const total = weights.reduce((s, [, w]) => s + w, 0);
  const [r, next] = nextRandom(seed);
  let pick = r * total;
  for (const [id, w] of weights) {
    pick -= w;
    if (pick < 0) return [id, next];
  }
  return [weights[0][0], next];
}

export function newGame(seed = Date.now() % 2147483647): GameState {
  let s = seed;
  const plots: Plot[] = [];
  const rand = () => {
    const [v, n] = nextRandom(s);
    s = n;
    return v;
  };
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    plots.push({
      id: i,
      om: Math.round(16 + rand() * 10),
      life: Math.round(14 + rand() * 10),
      structure: Math.round(18 + rand() * 10),
      water: Math.round(26 + rand() * 8),
      nutrients: Math.round(30 + rand() * 14),
      ph: round1(5.5 + rand() * 0.6),
      noTill: false,
      noTillSeasons: 0,
      hedgerow: false,
      biochar: false,
      crop: null,
      // The old garden grew the same heavy feeders year after year.
      lastFamily: (["grass", "nightshade"] as const)[Math.floor(rand() * 2)],
      familyStreak: 2,
      applied: [],
      weedy: true,
      known: { lab: false, shovel: false, water: false },
    });
  }
  const [forecast, next] = rollEvent(s, 1);
  return {
    version: GAME_VERSION,
    seed: next,
    season: 1,
    coins: START_COINS,
    organic: true,
    organicAtSeasonStart: true,
    plots,
    forecast,
    status: "playing",
    history: [],
  };
}

export type ApplyResult = { ok: true; state: GameState } | { ok: false; reason: string };

export function canApply(state: GameState, plotId: number, practiceId: PracticeId): string | null {
  const plot = state.plots[plotId];
  const practice = PRACTICES[practiceId];
  if (state.status !== "playing") return "The game is over.";
  if (!plot) return "Pick a plot first.";
  if (practice.unlockSeason && state.season < practice.unlockSeason)
    return `Unlocks in season ${practice.unlockSeason}.`;
  if (practiceId === "weed" && !plot.weedy) return "No weeds here right now.";
  if (practiceId === "labTest" && plot.known.lab) return "You already have lab results for this plot.";
  if (practiceId === "shovelTest" && plot.known.shovel) return "You already did a shovel test here.";
  if (practiceId === "waterTest" && plot.known.water) return "You already tested water here.";
  if (plot.applied.includes(practiceId)) return "Already done on this plot this season.";
  if (plot.weedy && (practice.kind === "regenerative" || practice.kind === "conventional"))
    return "Pull the weeds first.";
  if (state.coins < practice.cost) return "Not enough coins.";
  if (practiceId === "noTill" && plot.noTill) return "This plot is already no-till.";
  if (practiceId === "hedgerow" && plot.hedgerow) return "This plot already has a hedgerow.";
  if (practiceId === "biochar" && plot.biochar) return "Biochar is already in this soil.";
  if (practiceId === "grazing" && !plot.applied.includes("coverCrop"))
    return "Animals need a cover crop to graze. Plant one first.";
  return null;
}

export function applyPractice(state: GameState, plotId: number, practiceId: PracticeId): ApplyResult {
  const reason = canApply(state, plotId, practiceId);
  if (reason) return { ok: false, reason };
  const practice = PRACTICES[practiceId];
  const plots = state.plots.map((p) => {
    if (p.id !== plotId) return p;
    const isTest = PRACTICES[practiceId].kind === "test";
    // Tests are one-off and don't count as something done to the soil this season.
    const next = { ...p, applied: isTest ? p.applied : [...p.applied, practiceId], known: { ...p.known } };
    if (practiceId === "weed") next.weedy = false;
    if (practiceId === "labTest") next.known.lab = true;
    if (practiceId === "shovelTest") next.known.shovel = true;
    if (practiceId === "waterTest") next.known.water = true;
    if (practiceId === "noTill") next.noTill = true;
    if (practiceId === "hedgerow") next.hedgerow = true;
    if (practiceId === "biochar") next.biochar = true;
    if (practiceId === "plow" && next.noTill) {
      next.noTill = false;
      next.noTillSeasons = 0;
    }
    return next;
  });
  const organic = state.organic && practice.organic !== false;
  return { ok: true, state: { ...state, plots, organic, coins: state.coins - practice.cost } };
}

export function canPlant(state: GameState, plotId: number, cropId: CropId): string | null {
  const plot = state.plots[plotId];
  if (state.status !== "playing") return "The game is over.";
  if (!plot) return "Pick a plot first.";
  if (plot.weedy) return "Pull the weeds first.";
  if (plot.crop) return `${CROPS[plot.crop].name} are already growing here.`;
  if (seasonName(state.season) === "Winter") return "Too cold to plant crops in winter. Try a cover crop instead.";
  if (state.coins < CROPS[cropId].seedCost) return "Not enough coins.";
  return null;
}

export function plantCrop(state: GameState, plotId: number, cropId: CropId): ApplyResult {
  const reason = canPlant(state, plotId, cropId);
  if (reason) return { ok: false, reason };
  const plots = state.plots.map((p) => (p.id === plotId ? { ...p, crop: cropId } : p));
  return { ok: true, state: { ...state, plots, coins: state.coins - CROPS[cropId].seedCost } };
}

function neighbors(id: number): number[] {
  const r = Math.floor(id / GRID_SIZE);
  const c = id % GRID_SIZE;
  const out: number[] = [];
  if (r > 0) out.push(id - GRID_SIZE);
  if (r < GRID_SIZE - 1) out.push(id + GRID_SIZE);
  if (c > 0) out.push(id - 1);
  if (c < GRID_SIZE - 1) out.push(id + 1);
  return out;
}

interface PlotOutcome {
  plot: Plot;
  harvest: number;
  grazing: number;
  bare: boolean;
  eroded: boolean;
  leached: boolean;
  pestHit: boolean;
  plowed: boolean;
  weedsReturned: boolean;
  /** Growing-season plot with nothing planted. */
  empty: boolean;
  fixedNitrogen: boolean;
}

function resolvePlot(p: Plot, state: GameState, event: EventId, market: number): PlotOutcome {
  const has = (id: PracticeId) => p.applied.includes(id);
  const winter = seasonName(state.season) === "Winter";
  const hedgeNear = p.hedgerow || neighbors(p.id).some((n) => state.plots[n].hedgerow);
  const crop = p.crop ? CROPS[p.crop] : null;
  const covered = has("coverCrop") || has("mulch") || !!crop?.coversSoil;
  const plowed = has("plow");
  const bare = !covered;
  let { om, life, structure, water, nutrients, ph } = p;
  let grazing = 0;

  // Practices
  if (has("coverCrop")) { om += 4; life += 6; structure += 4; nutrients += 4; }
  if (has("compost")) { om += 8; life += 7; nutrients += 7; ph += (6.8 - ph) * 0.25; }
  if (has("mulch")) { water += 4; om += 2; life += 1; }
  if (has("grazing")) { om += 2; nutrients += 4; life += 3; grazing = 6; }
  if (has("compostTea")) life += 6;
  if (has("biochar")) { om += 4; water += 8; }
  if (has("plow")) { structure -= 10; om -= 3; life -= 5; nutrients += 5; }
  if (has("synthFert")) { nutrients += 20; life -= 4; ph -= 0.2; }
  if (has("pesticide")) life -= 8;

  // Permanent features
  const noTillSeasons = p.noTill ? p.noTillSeasons + 1 : 0;
  if (p.noTill) { structure += 4; life += 3; om += 1.5; }
  if (p.hedgerow) life += 1;

  // The crop feeds on the soil, gives some things back, and rotation matters.
  let familyStreak = p.familyStreak;
  if (crop) {
    nutrients -= crop.nutrientUse;
    om += crop.gives.om ?? 0;
    nutrients += crop.gives.nutrients ?? 0;
    structure += crop.gives.structure ?? 0;
    life += crop.gives.life ?? 0;
    if (crop.family === p.lastFamily) {
      familyStreak = p.familyStreak + 1;
      nutrients -= 2;
    } else {
      familyStreak = 0;
      life += 2;
    }
  }

  // Natural processes
  nutrients -= winter ? 2 : 1;
  // Weeds steal water and nutrients from the crop.
  if (p.weedy) nutrients -= 3;
  if (bare) {
    om -= winter ? 2 : 1;
    structure -= winter ? 2 : 1;
  }

  let eroded = false;
  if (event === "heavyRain") {
    if (bare) {
      const loss = 7 * (1 - structure / 150) * (hedgeNear ? 0.5 : 1);
      om -= loss * 0.6;
      structure -= loss * 0.8;
      nutrients -= loss;
      eroded = true;
    } else {
      nutrients -= 1;
    }
  }
  if (event === "drought" && bare && om < 35) life -= 3;

  // Feedback loops: microbes follow food, and microbes and worms build structure.
  life += (om + 10 - life) * 0.15;
  structure += (life - structure) * 0.08;
  const waterTarget = 20 + 0.45 * om + 0.35 * structure + (p.biochar || has("biochar") ? 10 : 0);
  water += (waterTarget - water) * 0.3;

  // Extra nutrients that plants can't hold wash away.
  let leached = false;
  if (nutrients > 70) {
    const keep = p.biochar || has("biochar") ? 0.8 : 0.6;
    nutrients = 70 + (nutrients - 70) * keep;
    leached = has("synthFert");
  }

  om = clamp(om); life = clamp(life); structure = clamp(structure);
  water = clamp(water); nutrients = clamp(nutrients); ph = clamp(ph, 4.5, 8);

  // Harvest
  let harvest = 0;
  let pestHit = false;
  if (!winter && crop) {
    const quality = 0.35 * nutrients + 0.25 * water + 0.2 * structure + 0.2 * life;
    let factor = 0.35 + (0.65 * quality) / 100;
    if (plowed) factor *= 1.15;
    if (has("synthFert")) factor *= 1.15;
    if (p.noTill && noTillSeasons <= 2) factor *= 0.92;
    if (p.weedy) factor *= 0.55;
    factor *= Math.max(0.6, 1 - 0.15 * Math.abs(ph - 6.5));
    if (event === "drought") factor *= 0.4 + (0.6 * water) / 100;
    if (event === "pests") {
      const protectedPlot = has("pesticide") || hedgeNear || (familyStreak === 0 && life > 45);
      if (protectedPlot) factor *= 0.9;
      else {
        factor *= familyStreak >= 1 ? 0.4 : 0.6;
        pestHit = true;
      }
    }
    harvest = Math.round(18 * factor * crop.value * market * (state.organic ? ORGANIC_BONUS : 1));
  }

  // Weeds sprout again on soil left bare during the growing season.
  const weedsReturned = !winter && bare && !p.weedy;
  const weedy = p.weedy || (!winter && bare);

  return {
    plot: {
      ...p,
      om: round1(om), life: round1(life), structure: round1(structure),
      water: round1(water), nutrients: round1(nutrients), ph: round1(ph),
      noTillSeasons, applied: [], weedy,
      // Harvest time: the plot is empty again and remembers what grew here.
      crop: null,
      lastFamily: crop ? crop.family : p.lastFamily,
      familyStreak: crop ? familyStreak : p.familyStreak,
    },
    harvest,
    grazing,
    bare,
    eroded,
    leached,
    pestHit,
    plowed,
    weedsReturned,
    empty: !winter && !crop,
    fixedNitrogen: crop?.family === "legume",
  };
}

function buildInsights(event: EventId, outcomes: PlotOutcome[], winter: boolean, delta: number, lostOrganic: boolean): string[] {
  const out: string[] = [];
  if (lostOrganic)
    out.push("You used a non-organic product, so the garden lost its organic certification. Harvests no longer earn the organic bonus.");
  const eroded = outcomes.filter((o) => o.eroded).length;
  const pestHits = outcomes.filter((o) => o.pestHit).length;
  if (event === "heavyRain") {
    out.push(
      eroded > 0
        ? `Heavy rain washed topsoil off ${eroded} bare plot${eroded > 1 ? "s" : ""}. Plots with cover crops or mulch held on to their soil.`
        : "Heavy rain fell, but every plot was covered, so almost no soil washed away!",
    );
  }
  if (event === "drought")
    out.push("The drought hit hardest where soil couldn't hold water. Organic matter soaks up water like a sponge.");
  if (event === "pests")
    out.push(
      pestHits > 0
        ? `Pests ate crops on ${pestHits} plot${pestHits > 1 ? "s" : ""}. Pests build up when the same plant family grows in the same spot. Rotating families and planting hedgerows keeps them in check.`
        : "Pests showed up, but your rotations, hedgerows, and healthy soil kept the damage small.",
    );
  if (event === "bustMarket")
    out.push("Crop prices dropped, so every harvest paid less. Spending less on inputs helps farms survive bad years.");
  if (event === "boomMarket")
    out.push("Prices were high! Healthy plots grow bigger harvests, so they earned the most.");
  if (outcomes.some((o) => o.leached))
    out.push("Some fertilizer washed out of the soil before plants could use it, and the soil got more acidic.");
  if (outcomes.some((o) => o.plowed))
    out.push("Plowing gave a quick harvest boost, but it broke apart soil crumbs and burned off organic matter.");
  const empty = outcomes.filter((o) => o.empty).length;
  if (empty > 0)
    out.push(`${empty} plot${empty > 1 ? "s" : ""} sat empty, so ${empty > 1 ? "they" : "it"} grew nothing to sell. Open the seed bag to plant.`);
  if (outcomes.some((o) => o.fixedNitrogen))
    out.push("Your beans pulled nitrogen out of the air and left it in the soil for the next crop.");
  const weedsBack = outcomes.filter((o) => o.weedsReturned).length;
  if (weedsBack > 0)
    out.push(`Weeds sprouted again on ${weedsBack} bare plot${weedsBack > 1 ? "s" : ""}. Cover crops and mulch keep weeds from taking over.`);
  if (winter && outcomes.some((o) => o.bare))
    out.push("Bare soil in winter has no roots to hold it together. Cover crops protect it until spring.");
  if (delta >= 2)
    out.push("Your soil is coming alive! More microbes and worms mean better crumbs, more water, and more food for plants.");
  if (out.length === 0)
    out.push(delta < 0 ? "Your soil got a little worse. Bare, unfed soil slowly loses its organic matter." : "A quiet season. Steady care builds soil over time.");
  return out.slice(0, 5);
}

function marketFor(event: EventId): number {
  return event === "boomMarket" ? 1.4 : event === "bustMarket" ? 0.7 : 1;
}

export interface Preview {
  /** Predicted change in each metric by the end of this season, compared with not doing it. */
  deltas: Record<Metric, number>;
  /** Change in this plot's harvest coins (plus grazing income), compared with not doing it. */
  harvestDelta: number;
  cost: number;
  /** Metrics a test would reveal (tests only). */
  reveals: Metric[];
  notes: string[];
}

const METRICS: Metric[] = ["om", "life", "structure", "water", "nutrients", "ph"];

export type GameAction = { practice: PracticeId } | { plant: CropId };

/**
 * What an action would do to one plot this season, assuming the forecast comes true.
 * Runs the real season resolver with and without it, so the preview matches the outcome.
 */
export function previewAction(state: GameState, plotId: number, action: GameAction): Preview {
  if ("plant" in action) return previewPlant(state, plotId, action.plant);
  return previewPractice(state, plotId, action.practice);
}

function previewPlant(state: GameState, plotId: number, cropId: CropId): Preview {
  const crop = CROPS[cropId];
  const event = state.forecast;
  const market = marketFor(event);
  const base = withPlot(state, plotId, (p) => ({ ...p, weedy: false, crop: null }));
  const without = resolvePlot(base.plots[plotId], base, event, market);
  const withState = withPlot(base, plotId, (p) => ({ ...p, crop: cropId }));
  const withOutcome = resolvePlot(withState.plots[plotId], withState, event, market);
  const last = base.plots[plotId].lastFamily;
  const notes: string[] = [];
  if (last === crop.family) notes.push(`⚠️ Same plant family as last season (${FAMILY_LABEL[crop.family]}): pests love that, and the soil runs low on the same nutrients`);
  else if (last) notes.push(`Good rotation! Last season this plot grew the ${FAMILY_LABEL[last].toLowerCase()}`);
  if (crop.coversSoil) notes.push("Covers the soil: keeps weeds down and protects from erosion");
  notes.push("Harvested at the end of the season, then the plot is empty again");
  return {
    deltas: Object.fromEntries(METRICS.map((m) => [m, round1(withOutcome.plot[m] - without.plot[m])])) as Record<Metric, number>,
    harvestDelta: withOutcome.harvest - without.harvest,
    cost: crop.seedCost,
    reveals: [],
    notes,
  };
}

export function previewPractice(state: GameState, plotId: number, practiceId: PracticeId): Preview {
  const practice = PRACTICES[practiceId];
  const notes = [...(practice.notes ?? [])];
  if (practice.kind === "test") {
    const test = practiceId === "labTest" ? "lab" : practiceId === "shovelTest" ? "shovel" : "water";
    return {
      deltas: { om: 0, life: 0, structure: 0, water: 0, nutrients: 0, ph: 0 },
      harvestDelta: 0,
      cost: practice.cost,
      reveals: METRICS.filter((m) => METRIC_TEST[m] === test),
      notes,
    };
  }
  const event = state.forecast;
  const market = marketFor(event);
  // Compare against the same starting plot. For anything but weeding, assume the weeds are already
  // pulled so the preview shows only this practice's own effect.
  const base = withPlot(state, plotId, (p) => ({
    ...p,
    applied: p.applied.filter((a) => a !== practiceId),
    weedy: practiceId === "weed" ? true : false,
  }));
  const without = resolvePlot(base.plots[plotId], base, event, market);
  const withState = forceApply(base, plotId, practiceId);
  const withOutcome = resolvePlot(withState.plots[plotId], withState, event, market);
  const deltas = Object.fromEntries(
    METRICS.map((m) => [m, round1(withOutcome.plot[m] - without.plot[m])]),
  ) as Record<Metric, number>;
  return {
    deltas,
    harvestDelta: withOutcome.harvest + withOutcome.grazing - (without.harvest + without.grazing),
    cost: practice.cost,
    reveals: [],
    notes,
  };
}

function withPlot(state: GameState, plotId: number, fn: (p: Plot) => Plot): GameState {
  return { ...state, plots: state.plots.map((p) => (p.id === plotId ? fn(p) : p)) };
}

/** Apply a practice ignoring coins, so a preview is always available. */
function forceApply(state: GameState, plotId: number, practiceId: PracticeId): GameState {
  const rich = { ...state, coins: Number.MAX_SAFE_INTEGER, status: "playing" as const };
  const r = applyPractice(rich, plotId, practiceId);
  return r.ok ? r.state : rich;
}

export function advanceSeason(state: GameState): { state: GameState; report: SeasonReport } {
  if (state.status !== "playing") throw new Error("Game is over");
  const event = state.forecast;
  const market = marketFor(event);
  const healthBefore = fieldHealth(state.plots);
  const outcomes = state.plots.map((p) => resolvePlot(p, state, event, market));
  const plots = outcomes.map((o) => o.plot);
  const harvest = outcomes.reduce((s, o) => s + o.harvest, 0);
  const grazingIncome = outcomes.reduce((s, o) => s + o.grazing, 0);
  const healthAfter = fieldHealth(plots);
  const winter = seasonName(state.season) === "Winter";
  const lostOrganic = state.organicAtSeasonStart && !state.organic;
  const weedsReturned = outcomes.filter((o) => o.weedsReturned).length;

  const report: SeasonReport = {
    season: state.season,
    seasonName: seasonName(state.season),
    event,
    harvest,
    grazingIncome,
    lostOrganic,
    weedsReturned,
    healthBefore,
    healthAfter,
    plotHealthChange: plots.map((p, i) => round1(plotHealth(p) - plotHealth(state.plots[i]))),
    insights: buildInsights(event, outcomes, winter, healthAfter - healthBefore, lostOrganic),
  };

  const nextSeason = state.season + 1;
  const finished = state.season >= TOTAL_SEASONS;
  const [forecast, seed] = rollEvent(state.seed, nextSeason);
  const next: GameState = {
    ...state,
    seed,
    season: finished ? state.season : nextSeason,
    coins: state.coins + harvest + grazingIncome,
    organicAtSeasonStart: state.organic,
    plots,
    forecast,
    status: finished ? (healthAfter >= WIN_HEALTH ? "won" : "lost") : "playing",
    history: [...state.history, report],
  };
  return { state: next, report };
}

/** 0–3 stars for the final field. */
export function starsFor(state: GameState): number {
  const h = fieldHealth(state.plots);
  if (h >= 80 && state.coins >= START_COINS) return 3;
  if (h >= WIN_HEALTH) return 2;
  if (h >= 50) return 1;
  return 0;
}
