import { describe, expect, it } from "vitest";
import { CROP_ORDER, CROPS } from "./crops";

describe("crops", () => {
  it("lists every crop in the seed bag once", () => {
    expect(new Set(CROP_ORDER).size).toBe(Object.keys(CROPS).length);
  });

  it.each(Object.values(CROPS))("$name explains what it takes and gives", (c) => {
    expect(c.takes.length).toBeGreaterThan(10);
    expect(c.givesText.length).toBeGreaterThan(10);
    expect(c.seedCost).toBeGreaterThan(0);
  });

  it("only legumes and buckwheat give nutrients back", () => {
    const givers = Object.values(CROPS).filter((c) => (c.gives.nutrients ?? 0) > 0).map((c) => c.id);
    expect(givers.sort()).toEqual(["beans", "buckwheat"]);
    expect(CROPS.beans.family).toBe("legume");
  });

  it("heavy feeders use more nutrients than light ones", () => {
    expect(CROPS.corn.nutrientUse).toBeGreaterThan(CROPS.carrot.nutrientUse);
    expect(CROPS.tomato.nutrientUse).toBeGreaterThan(CROPS.beans.nutrientUse);
  });
});
