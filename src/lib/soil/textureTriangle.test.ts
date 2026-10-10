import { describe, expect, it } from "vitest";
import { classifyTexture, compositionFromSandClay } from "./textureTriangle";

describe("classifyTexture", () => {
  const cases: [number, number, number, string][] = [
    [40, 40, 20, "loam"],
    [65, 25, 10, "sandy loam"],
    [95, 3, 2, "sand"],
    [82, 12, 6, "loamy sand"],
    [20, 65, 15, "silt loam"],
    [5, 88, 7, "silt"],
    [60, 13, 27, "sandy clay loam"],
    [33, 34, 33, "clay loam"],
    [10, 56, 34, "silty clay loam"],
    [50, 5, 45, "sandy clay"],
    [5, 47, 48, "silty clay"],
    [20, 20, 60, "clay"],
  ];
  it.each(cases)("sand %i / silt %i / clay %i is %s", (sand, silt, clay, expected) => {
    expect(classifyTexture({ sand, silt, clay })).toBe(expected);
  });

  it("covers every point of the triangle", () => {
    for (let sand = 0; sand <= 100; sand += 2) {
      for (let clay = 0; clay <= 100 - sand; clay += 2) {
        expect(() => classifyTexture({ sand, clay, silt: 100 - sand - clay })).not.toThrow();
      }
    }
  });
});

describe("compositionFromSandClay", () => {
  it("always sums to 100", () => {
    const c = compositionFromSandClay(70, 50);
    expect(c.sand + c.silt + c.clay).toBe(100);
    expect(c.clay).toBe(30);
  });
});
