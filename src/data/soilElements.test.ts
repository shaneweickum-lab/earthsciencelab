import { describe, expect, it } from "vitest";
import { getElement } from "./elements";
import { SOIL_BUILDER_ZS, SOIL_ELEMENTS, SOIL_RECIPE, SOIL_ROLES, formatSoilPercent, type SoilRole } from "./soilElements";

describe("soil elements", () => {
  it("only lists real, naturally occurring elements, once each", () => {
    const zs = SOIL_ELEMENTS.map((s) => s.z);
    expect(new Set(zs).size).toBe(zs.length);
    for (const z of zs) {
      const el = getElement(z);
      expect(el).toBeDefined();
      expect(el!.crustPpm).toBeGreaterThan(0);
    }
  });

  it("has major elements that add up to nearly all of soil", () => {
    const total = SOIL_ELEMENTS.reduce((s, e) => s + (e.soilPercent ?? 0), 0);
    expect(total).toBeGreaterThan(95);
    expect(total).toBeLessThanOrEqual(101);
    expect(SOIL_RECIPE[0].z).toBe(8);
    expect(SOIL_RECIPE[1].z).toBe(14);
  });

  it("uses every role, and pollutants are not counted as builders", () => {
    for (const role of Object.keys(SOIL_ROLES) as SoilRole[]) {
      expect(SOIL_ELEMENTS.some((s) => s.roles.includes(role))).toBe(true);
    }
    expect(SOIL_BUILDER_ZS).not.toContain(82);
    expect(SOIL_BUILDER_ZS).toContain(7);
  });

  it("includes N, P, K and the main clay and sand builders", () => {
    for (const z of [7, 15, 19, 8, 14, 13, 26]) expect(SOIL_ELEMENTS.some((s) => s.z === z)).toBe(true);
  });

  it("formats shares for kids", () => {
    expect(formatSoilPercent(33)).toBe("about 33%");
    expect(formatSoilPercent(0.2)).toBe("about 0.2%");
    expect(formatSoilPercent(0.009)).toBe("about 90 parts per million");
  });
});
