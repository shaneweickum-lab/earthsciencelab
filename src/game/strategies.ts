import { CROPS, type CropId } from "./crops";
import { advanceSeason, applyPractice, canApply, canPlant, newGame, plantCrop, plotHealth, type GameState } from "./engine";
import type { PracticeId } from "./practices";

/** Scripted players used for balancing tests. */
export type Strategy = (state: GameState) => GameState;

function tryApply(state: GameState, plotId: number, id: PracticeId): GameState {
  if (canApply(state, plotId, id)) return state;
  const r = applyPractice(state, plotId, id);
  return r.ok ? r.state : state;
}

function tryPlant(state: GameState, plotId: number, crop: CropId): GameState {
  if (canPlant(state, plotId, crop)) return state;
  const r = plantCrop(state, plotId, crop);
  return r.ok ? r.state : state;
}

/** Feed tired soil with legumes, otherwise rotate to a different plant family. */
function rotationChoice(state: GameState, plotId: number): CropId {
  const p = state.plots[plotId];
  const prefs: CropId[] = p.nutrients < 35 ? ["beans", "buckwheat"] : ["tomato", "squash", "corn", "carrot", "beans"];
  return prefs.find((c) => CROPS[c].family !== p.lastFamily) ?? prefs[0];
}

function weedAndTest(start: GameState): GameState {
  let s = start;
  for (const p of s.plots) {
    for (const id of ["weed", "shovelTest", "waterTest", "labTest"] as PracticeId[]) s = tryApply(s, p.id, id);
  }
  return s;
}

/** A sensible organic gardener: weeds, tests, goes no-till, keeps soil covered, and spends with a reserve. */
export const organicStrategy: Strategy = (start) => {
  let s = weedAndTest(start);
  for (const p of s.plots) s = tryPlant(s, p.id, rotationChoice(s, p.id));
  const order = [...s.plots].sort((a, b) => plotHealth(a) - plotHealth(b)).map((p) => p.id);
  const passes: [PracticeId, number][] = [
    ["noTill", 0], ["coverCrop", 0], ["grazing", 0], ["compost", 40], ["mulch", 50], ["hedgerow", 120],
  ];
  for (const [practice, reserve] of passes) {
    for (const id of order) {
      if (s.coins - reserve < 0) break;
      if (practice === "hedgerow" && id !== 4) continue;
      s = tryApply(s, id, practice);
    }
  }
  return s;
};

/** Buys every regenerative practice on every plot it can afford, with no plan. */
export const spamStrategy: Strategy = (start) => {
  let s = weedAndTest(start);
  for (const p of s.plots) {
    s = tryPlant(s, p.id, "tomato");
    for (const id of ["compost", "coverCrop", "mulch", "compostTea", "biochar", "hedgerow", "noTill", "grazing"] as PracticeId[]) {
      s = tryApply(s, p.id, id);
    }
  }
  return s;
};

export const conventionalStrategy: Strategy = (start) => {
  let s = start;
  for (const p of s.plots) {
    s = tryApply(s, p.id, "weed");
    s = tryPlant(s, p.id, "corn");
    s = tryApply(s, p.id, "plow");
    s = tryApply(s, p.id, "synthFert");
    if (s.forecast === "pests") s = tryApply(s, p.id, "pesticide");
  }
  return s;
};

export const idleStrategy: Strategy = (s) => s;

export function playOut(strategy: Strategy, seed: number): GameState {
  let s = newGame(seed);
  while (s.status === "playing") s = advanceSeason(strategy(s)).state;
  return s;
}
