// Saves written by the Godot port (npm run godot:test writes godot/tests/out) must load in
// the TS game, and keep playing the same as the original. Skipped until Godot has run.
import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { addItem, countItem, loadWorld, saveWorld, sleep } from "./engine";

const DIR = path.resolve(__dirname, "../../godot/tests/out");
const saves = existsSync(DIR) ? readdirSync(DIR).filter((f) => f.startsWith("save-")) : [];

describe.skipIf(saves.length === 0)("saves from the Godot port", () => {
  for (const file of saves) {
    it(`${file} loads and plays in the TS engine`, () => {
      const raw = readFileSync(path.join(DIR, file), "utf8");
      const s = loadWorld(raw)!;
      expect(s).not.toBeNull();
      // Same data, whatever number formatting Godot used.
      expect(JSON.parse(saveWorld(s))).toEqual(JSON.parse(raw));
      // Optional fields must be missing, not null, or the TS code treats them differently.
      for (const slot of s.inventory) if (slot) expect(slot.grade === null).toBe(false);
      for (const t of s.tiles) if (t.crop) expect(t.crop.stress === null).toBe(false);
      const next = sleep(s);
      expect(loadWorld(saveWorld(next))).not.toBeNull();
      const more = addItem(next, "crop_carrot", 2, "A");
      if (more) expect(countItem(more, "crop_carrot", "A")).toBeGreaterThanOrEqual(2);
    });
  }
});
