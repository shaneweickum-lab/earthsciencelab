import { advanceSeason, applyPractice, canApply, newGame, plotHealth, type GameState } from "./engine";
import type { PracticeId } from "./practices";

/** Scripted players used for balancing tests. */
export type Strategy = (state: GameState) => GameState;

function tryApply(state: GameState, plotId: number, id: PracticeId): GameState {
  if (canApply(state, plotId, id)) return state;
  const r = applyPractice(state, plotId, id);
  return r.ok ? r.state : state;
}

export const regenerativeStrategy: Strategy = (start) => {
  let s = start;
  const order = [...s.plots].sort((a, b) => plotHealth(a) - plotHealth(b)).map((p) => p.id);
  const passes: PracticeId[][] = [["noTill"], ["coverCrop"], ["grazing"], ["compost"], ["rotate"], ["hedgerow"], ["mulch"]];
  for (const pass of passes) {
    for (const id of order) {
      for (const practice of pass) {
        if (practice === "compost" && s.coins < 40) continue;
        if (practice === "hedgerow" && (s.coins < 60 || (id !== 4 && id !== 0 && id !== 8))) continue;
        s = tryApply(s, id, practice);
      }
    }
  }
  return s;
};

export const conventionalStrategy: Strategy = (start) => {
  let s = start;
  for (const p of s.plots) {
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
