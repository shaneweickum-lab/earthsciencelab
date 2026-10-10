import { describe, expect, it } from "vitest";
import {
  advanceSeason, applyPractice, canApply, fieldHealth, newGame, TOTAL_SEASONS, WIN_HEALTH,
} from "./engine";
import { conventionalStrategy, idleStrategy, playOut, regenerativeStrategy } from "./strategies";

const SEEDS = [1, 2, 3, 42, 99, 1234];

describe("game engine", () => {
  it("is deterministic for a fixed seed", () => {
    expect(playOut(regenerativeStrategy, 7)).toEqual(playOut(regenerativeStrategy, 7));
  });

  it("starts with degraded soil", () => {
    const h = fieldHealth(newGame(5).plots);
    expect(h).toBeGreaterThan(20);
    expect(h).toBeLessThan(40);
  });

  it.each(SEEDS)("regenerative play can win (seed %i)", (seed) => {
    const end = playOut(regenerativeStrategy, seed);
    expect(end.history).toHaveLength(TOTAL_SEASONS);
    expect(fieldHealth(end.plots)).toBeGreaterThanOrEqual(WIN_HEALTH);
    expect(end.status).toBe("won");
  });

  it.each(SEEDS)("plowing and synthetic fertilizer every season degrades soil (seed %i)", (seed) => {
    const start = fieldHealth(newGame(seed).plots);
    const end = playOut(conventionalStrategy, seed);
    expect(fieldHealth(end.plots)).toBeLessThan(start);
    expect(end.status).toBe("lost");
  });

  it("doing nothing lets bare soil decline", () => {
    const start = fieldHealth(newGame(3).plots);
    expect(fieldHealth(playOut(idleStrategy, 3).plots)).toBeLessThan(start);
  });

  it("spends coins and action points", () => {
    const g = newGame(1);
    const r = applyPractice(g, 0, "coverCrop");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.coins).toBe(g.coins - 10);
    expect(r.state.ap).toBe(g.ap - 1);
    expect(canApply(r.state, 0, "coverCrop")).toMatch(/Already/);
  });

  it("requires a cover crop before grazing", () => {
    const g = newGame(1);
    expect(canApply(g, 0, "grazing")).toMatch(/cover crop/);
  });

  it("plowing ends no-till", () => {
    let g = newGame(1);
    const a = applyPractice(g, 0, "noTill");
    if (!a.ok) throw new Error(a.reason);
    g = advanceSeason(a.state).state;
    const b = applyPractice(g, 0, "plow");
    if (!b.ok) throw new Error(b.reason);
    expect(b.state.plots[0].noTill).toBe(false);
  });

  it("covered plots lose less soil in heavy rain", () => {
    const g = { ...newGame(1), forecast: "heavyRain" as const };
    const r = applyPractice(g, 0, "mulch");
    if (!r.ok) throw new Error(r.reason);
    const { state } = advanceSeason(r.state);
    const bare = state.plots[1];
    const covered = state.plots[0];
    const startBare = g.plots[1];
    const startCovered = g.plots[0];
    expect(covered.om - startCovered.om).toBeGreaterThan(bare.om - startBare.om);
  });
});
