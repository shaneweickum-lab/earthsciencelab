import { existsSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { CROPS, type CropId } from "@/game/crops";
import { CROP_LOOKS, CROP_MODELS, stageOf } from "./cropLooks";

describe("crop looks", () => {
  it("has every stage for every crop", () => {
    for (const id of Object.keys(CROPS) as CropId[]) {
      for (const stage of ["sprout", "young", "mature", "ripe"] as const) expect(CROP_LOOKS[id][stage].length, `${id} ${stage}`).toBeGreaterThan(0);
    }
  });
  it("only uses models that npm run assets copied into public/models", () => {
    for (const m of CROP_MODELS) expect(existsSync(path.join(process.cwd(), "public/models", `${m}.glb`)), m).toBe(true);
  });
  it("maps growth to stages", () => {
    expect(stageOf(0)).toBeNull();
    expect(stageOf(0.2)).toBe("sprout");
    expect(stageOf(0.5)).toBe("young");
    expect(stageOf(0.9)).toBe("mature");
    expect(stageOf(1)).toBe("ripe");
  });
});
