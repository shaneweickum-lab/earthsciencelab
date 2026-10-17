import { describe, expect, it } from "vitest";
import { decide, hashLocal, summarize } from "./cloudSync";

const farm = { world: '{"minute":3000}', progress: '{"state":{"xp":40}}' };
const empty = { world: null, progress: null };
const synced = (local = farm, cloudAt = "t1") => ({ userId: "u", hash: hashLocal(local), cloudAt });

describe("cloud sync", () => {
  it("uploads a farm that isn't in the cloud yet", () => {
    expect(decide("u", farm, null, null)).toBe("upload");
    expect(decide("u", empty, null, null)).toBe("none");
  });

  it("downloads to an empty device, and asks when a different farm is already here", () => {
    expect(decide("u", empty, null, "t1")).toBe("download");
    expect(decide("u", farm, null, "t1")).toBe("conflict");
    // Someone else synced on this device before.
    expect(decide("u", farm, { ...synced(), userId: "someone" }, "t1")).toBe("conflict");
  });

  it("moves changes from whichever side changed", () => {
    expect(decide("u", farm, synced(), "t1")).toBe("none");
    const played = { ...farm, world: '{"minute":4500}' };
    expect(decide("u", played, synced(), "t1")).toBe("upload");
    expect(decide("u", farm, synced(), "t2")).toBe("download");
    expect(decide("u", played, synced(), "t2")).toBe("conflict");
  });

  it("summarizes a save for teachers", () => {
    expect(summarize({ minute: 1440 * 4 + 300, coins: 512.4, harvests: 7, journal: ["a", "b"] }, { state: { xp: 90 } }))
      .toEqual({ farm_day: 5, coins: 512, harvests: 7, journal_pages: 2, xp: 90 });
    expect(summarize(null, null)).toEqual({ farm_day: null, coins: null, harvests: null, journal_pages: null, xp: null });
  });
});
