import { advanceSeason, applyPractice, canApply, newGame, plotHealth, type GameState } from "./engine";
import type { PracticeId } from "./practices";

/** Scripted players used for balancing tests. */
export type Strategy = (state: GameState) => GameState;

function tryApply(state: GameState, plotId: number, id: PracticeId): GameState {
  if (canApply(state, plotId, id)) return state;
  const r = applyPractice(state, plotId, id);
  return r.ok ? r.state : state;
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
  const order = [...s.plots].sort((a, b) => plotHealth(a) - plotHealth(b)).map((p) => p.id);
  const passes: [PracticeId, number][] = [
    ["noTill", 0], ["coverCrop", 0], ["grazing", 0], ["rotate", 10], ["compost", 40], ["mulch", 50], ["hedgerow", 120],
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
    for (const id of ["compost", "coverCrop", "mulch", "compostTea", "biochar", "hedgerow", "noTill", "rotate", "grazing"] as PracticeId[]) {
      s = tryApply(s, p.id, id);
    }
  }
  return s;
};

export const conventionalStrategy: Strategy = (start) => {
  let s = start;
  for (const p of s.plots) {
    s = tryApply(s, p.id, "weed");
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
