import { describe, expect, it } from "vitest";
import {
  advanceSeason, applyPractice, canApply, fieldHealth, fullyTested, isKnown, newGame, previewPractice,
  TOTAL_SEASONS, WIN_HEALTH, type GameState,
} from "./engine";
import type { PracticeId } from "./practices";
import { conventionalStrategy, idleStrategy, organicStrategy, playOut, spamStrategy } from "./strategies";

const SEEDS = [1, 2, 3, 42, 99, 1234];

function apply(s: GameState, plot: number, id: PracticeId): GameState {
  const r = applyPractice(s, plot, id);
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}

describe("starting the organic garden", () => {
  it("starts overgrown, untested, certified organic, with degraded soil", () => {
    const g = newGame(5);
    expect(g.organic).toBe(true);
    expect(g.plots.every((p) => p.weedy && !fullyTested(p))).toBe(true);
    const h = fieldHealth(g.plots);
    expect(h).toBeGreaterThan(20);
    expect(h).toBeLessThan(40);
  });

  it("requires weeding before planting or improving a plot", () => {
    let g = newGame(1);
    expect(canApply(g, 0, "coverCrop")).toMatch(/weeds first/);
    expect(canApply(g, 0, "shovelTest")).toBeNull();
    g = apply(g, 0, "weed");
    expect(g.plots[0].weedy).toBe(false);
    expect(canApply(g, 0, "coverCrop")).toBeNull();
    expect(canApply(g, 0, "weed")).toMatch(/No weeds/);
  });

  it("reveals metrics only through the matching soil test", () => {
    let g = newGame(1);
    const p = () => g.plots[0];
    expect(isKnown(p(), "life")).toBe(false);
    g = apply(g, 0, "shovelTest");
    expect(isKnown(p(), "life") && isKnown(p(), "structure")).toBe(true);
    expect(isKnown(p(), "nutrients")).toBe(false);
    g = apply(g, 0, "labTest");
    g = apply(g, 0, "waterTest");
    expect(fullyTested(p())).toBe(true);
    expect(canApply(g, 0, "labTest")).toMatch(/already/);
    // Tests don't count as something done to the soil.
    expect(p().applied).toEqual([]);
  });
});

describe("actions", () => {
  it("has no limit on how many actions you take, only coins", () => {
    let g = newGame(1);
    for (const p of g.plots) g = apply(apply(g, p.id, "weed"), p.id, "shovelTest");
    const before = g.coins;
    g = apply(g, 0, "coverCrop");
    g = apply(g, 1, "coverCrop");
    g = apply(g, 2, "rotate");
    expect(g.coins).toBe(before - 14 - 14 - 4);
    g = { ...g, coins: 3 };
    expect(canApply(g, 3, "coverCrop")).toMatch(/coins/);
  });

  it("loses organic status for good after synthetic inputs", () => {
    let g = apply(newGame(1), 0, "weed");
    g = apply(g, 0, "synthFert");
    expect(g.organic).toBe(false);
    const { state, report } = advanceSeason(g);
    expect(report.lostOrganic).toBe(true);
    expect(state.organic).toBe(false);
  });

  it("brings weeds back on bare plots but not covered ones", () => {
    let g = { ...newGame(1), season: 1 };
    g = apply(apply(g, 0, "weed"), 0, "mulch");
    g = apply(g, 1, "weed");
    const next = advanceSeason(g).state;
    expect(next.plots[0].weedy).toBe(false);
    expect(next.plots[1].weedy).toBe(true);
  });

  it("plowing ends no-till", () => {
    let g = apply(apply(newGame(1), 0, "weed"), 0, "noTill");
    g = advanceSeason(g).state;
    g = apply(apply(g, 0, "weed"), 0, "plow");
    expect(g.plots[0].noTill).toBe(false);
  });
});

describe("preview", () => {
  it.each(["coverCrop", "compost", "mulch", "plow", "synthFert", "rotate"] as PracticeId[])(
    "%s preview matches what actually happens",
    (id) => {
      const g = apply(newGame(9), 4, "weed");
      const preview = previewPractice(g, 4, id);
      const without = advanceSeason(g).state.plots[4];
      const withIt = advanceSeason(apply(g, 4, id)).state.plots[4];
      expect(withIt.om - without.om).toBeCloseTo(preview.deltas.om, 0);
      expect(withIt.life - without.life).toBeCloseTo(preview.deltas.life, 0);
      expect(withIt.structure - without.structure).toBeCloseTo(preview.deltas.structure, 0);
    },
  );

  it("shows good effects for compost and bad ones for plowing", () => {
    const g = apply(newGame(9), 4, "weed");
    expect(previewPractice(g, 4, "compost").deltas.om).toBeGreaterThan(0);
    expect(previewPractice(g, 4, "plow").deltas.structure).toBeLessThan(0);
    expect(previewPractice(g, 4, "synthFert").notes.join(" ")).toMatch(/organic/i);
  });

  it("previews tests as what they reveal", () => {
    expect(previewPractice(newGame(1), 0, "labTest").reveals).toEqual(["om", "nutrients", "ph"]);
  });

  it("previews weeding as a harvest boost", () => {
    const g = { ...newGame(1), season: 2 };
    expect(previewPractice(g, 0, "weed").harvestDelta).toBeGreaterThan(0);
  });
});

describe("balance", () => {
  it("is deterministic for a fixed seed", () => {
    expect(playOut(organicStrategy, 7)).toEqual(playOut(organicStrategy, 7));
  });

  it.each(SEEDS)("a planned organic garden wins (seed %i)", (seed) => {
    const end = playOut(organicStrategy, seed);
    expect(end.history).toHaveLength(TOTAL_SEASONS);
    expect(fieldHealth(end.plots)).toBeGreaterThanOrEqual(WIN_HEALTH);
    expect(end.status).toBe("won");
    expect(end.organic).toBe(true);
  });

  it.each(SEEDS)("buying everything with no plan runs out of coins and loses (seed %i)", (seed) => {
    expect(playOut(spamStrategy, seed).status).toBe("lost");
  });

  it.each(SEEDS)("plowing and synthetics every season degrade soil (seed %i)", (seed) => {
    const start = fieldHealth(newGame(seed).plots);
    const end = playOut(conventionalStrategy, seed);
    expect(fieldHealth(end.plots)).toBeLessThan(start);
    expect(end.status).toBe("lost");
  });

  it("neglect lets the garden decline", () => {
    const start = fieldHealth(newGame(3).plots);
    expect(fieldHealth(playOut(idleStrategy, 3).plots)).toBeLessThan(start);
  });
});
