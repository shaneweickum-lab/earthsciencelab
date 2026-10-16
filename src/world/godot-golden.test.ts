// Golden fixtures for the Godot port (godot/tests/golden). The TS engine is the reference:
// the GDScript tests replay these inputs and must produce the same results.
// This test fails when a fixture is stale; regenerate with GOLDEN=1 npx vitest run godot-golden.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { nextRandom } from "@/game/rng";

const DIR = path.resolve(__dirname, "../../godot/tests/golden");
const WRITE = process.env.GOLDEN === "1";

function golden(name: string, data: unknown) {
  const file = path.join(DIR, `${name}.json`);
  const text = JSON.stringify(data) + "\n";
  if (WRITE) {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(file, text);
    return;
  }
  expect(existsSync(file), `${file} is missing: run GOLDEN=1 npx vitest run godot-golden`).toBe(true);
  expect(readFileSync(file, "utf8") === text, `${name}.json is stale: run GOLDEN=1 npx vitest run godot-golden`).toBe(true);
}

describe("Godot golden fixtures", () => {
  it("rng", () => {
    const out: Record<string, number[]> = {};
    for (const seed of [0, 1, 42, 123456789, 2147483646, 4294967295]) {
      let s = seed;
      out[seed] = Array.from({ length: 40 }, () => {
        const [v, n] = nextRandom(s);
        s = n;
        return v * 4294967296; // exact as an integer; Godot's JSON parser can be off by an ulp on long decimals
      });
    }
    golden("rng", out);
  });

  it("imul", () => {
    const vals = [0, 1, 7, 40503, 2654435761, 0x9e3779b1, 0x7fffffff, 0x80000000, 0xffffffff, 123456789, 987654321];
    golden("imul", vals.flatMap((a) => vals.map((b) => [a, b, Math.imul(a, b) >>> 0])));
  });
});
