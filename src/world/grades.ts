import { nextRandom } from "@/game/rng";
import { CROPS } from "@/game/crops";
import { cropDays, GRADE_PRICE, WORLD_CROPS } from "./items";
import { on } from "./settings";
import type { Grade, Tile, WorldState } from "./types";

/** Crop grades from lowest to highest. */
export const GRADES: Grade[] = ["E", "D", "C", "B", "A", "S"];

export const GRADE_INFO: Record<Grade, { price: number; yieldLo: number; yieldHi: number; color: string; text: string }> = {
  E: { price: GRADE_PRICE.E, yieldLo: 0.5, yieldHi: 0.5, color: "#8a7a6a", text: "#fff" },
  D: { price: GRADE_PRICE.D, yieldLo: 0.75, yieldHi: 0.75, color: "#b58a5a", text: "#fff" },
  C: { price: GRADE_PRICE.C, yieldLo: 1, yieldHi: 1, color: "#6f9a5a", text: "#fff" },
  B: { price: GRADE_PRICE.B, yieldLo: 1.25, yieldHi: 1.25, color: "#3f86b0", text: "#fff" },
  A: { price: GRADE_PRICE.A, yieldLo: 1.5, yieldHi: 1.5, color: "#8a5ad6", text: "#fff" },
  // S-grade harvests can be anywhere from 1.5× up to triple.
  S: { price: GRADE_PRICE.S, yieldLo: 1.5, yieldHi: 3, color: "#e0a83a", text: "#2a2017" },
};

/** Score cut-offs (0–100) for D, C, B, A, and S when grades come from soil health. */
const CUTOFFS = [20, 35, 50, 65, 80];

/** Points each amendment adds toward the next harvest's grade. */
export function amendmentPoints(id: string, tile: Tile): number {
  switch (id) {
    case "compost": case "biochar": case "synthFert": return 2;
    case "mulch": return 1;
    case "lime": return tile.soil.ph < 6 ? 2 : 1;
    default: return 0;
  }
}

export const MAX_BOOST = 10;

/** Overall soil health, 0–100: organic matter, life, structure, water holding, nutrients, and pH. */
export function soilHealth(t: Tile): number {
  const s = t.soil;
  const ph = Math.max(0, Math.min(100, 100 - 30 * Math.abs(s.ph - 6.5)));
  return Math.round((0.25 * s.om + 0.2 * s.life + 0.2 * s.structure + 0.15 * s.water + 0.1 * s.nutrients + 0.1 * ph) * 10) / 10;
}

export interface GradeEstimate {
  grade: Grade;
  score: number;
  parts: string[];
}

/** The grade a crop on this tile would get if harvested now, and why. */
export function expectedGrade(state: WorldState, t: Tile): GradeEstimate {
  const boost = t.boost ?? 0;
  if (!on(state, "cropGrades")) {
    const grade = GRADES[Math.min(5, boost)];
    return { grade, score: boost, parts: [boost ? `Amendments +${boost} grade${boost > 1 ? "s" : ""}` : "Add compost or other amendments to raise the grade"] };
  }
  const parts: string[] = [];
  const soil = Math.round(soilHealth(t));
  parts.push(`Soil health ${soil}`);
  let score = soil;
  const c = t.crop;
  if (c && c.stress) {
    const hours = cropDays(c.id, state.settings.daysPerMonth, c.harvests > 0) * 24;
    const penalty = Math.round(Math.min(40, (40 * c.stress) / hours));
    if (penalty > 0) {
      score -= penalty;
      parts.push(`Stressed while growing −${penalty}`);
    }
  }
  if (boost) {
    score += boost * 4;
    parts.push(`Amendments +${boost * 4}`);
  }
  const idx = CUTOFFS.filter((cut) => score >= cut).length;
  return { grade: GRADES[idx], score: Math.round(score), parts };
}

/** How many to harvest: a seeded roll in the crop's per-tile range, scaled by grade. */
export function harvestAmount(state: WorldState, tileIndex: number, cropId: keyof typeof CROPS, grade: Grade): number {
  const [lo, hi] = WORLD_CROPS[cropId].yield;
  let s = (state.seed ^ Math.imul(state.minute + 1, 2654435761) ^ Math.imul(tileIndex + 7, 40503)) >>> 0;
  const roll = () => {
    const [v, n] = nextRandom(s);
    s = n;
    return v;
  };
  const base = lo + Math.floor(roll() * (hi - lo + 1));
  const g = GRADE_INFO[grade];
  const mult = g.yieldLo + roll() * (g.yieldHi - g.yieldLo);
  return Math.max(1, Math.round(base * mult));
}
