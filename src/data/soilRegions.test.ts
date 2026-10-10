import { describe, expect, it } from "vitest";
import { classifyTexture } from "@/lib/soil/textureTriangle";
import { SOIL_ORDER_IDS } from "./soilOrders";
import { SOIL_REGIONS } from "./soilRegions";

describe("soil regions", () => {
  it.each(SOIL_REGIONS.filter((r) => r.texture))("$name example composition matches its texture class", (r) => {
    expect(r.sand! + r.silt! + r.clay!).toBe(100);
    expect(classifyTexture({ sand: r.sand!, silt: r.silt!, clay: r.clay! })).toBe(r.texture);
  });

  it("has unique ids and valid coordinates", () => {
    expect(new Set(SOIL_REGIONS.map((r) => r.id)).size).toBe(SOIL_REGIONS.length);
    for (const r of SOIL_REGIONS) {
      expect(Math.abs(r.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(r.lon)).toBeLessThanOrEqual(180);
    }
  });

  it("shows every one of the 12 soil orders somewhere", () => {
    const used = new Set(SOIL_REGIONS.map((r) => r.order));
    for (const id of SOIL_ORDER_IDS) expect(used.has(id)).toBe(true);
  });
});
