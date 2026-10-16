import type { CropId } from "@/game/crops";

/**
 * How each crop looks as it grows, built from Kenney Nature Kit plants and Food Kit produce.
 * Each part is placed relative to the tile center. Small details with no model (bean pods, potato
 * tubers, buckwheat and clover blossoms) are simple shapes.
 */
export type Shape = "pod" | "tuber" | "blossomWhite" | "blossomPink" | "sunPetals" | "sunSeeds";

export interface CropPart {
  /** Model as "pack/name", e.g. "nature/plant_bush". */
  m?: string;
  shape?: Shape;
  x: number;
  y?: number;
  z: number;
  s: number;
  ry?: number;
  /** Tilt, for flower heads that face the sun. */
  rx?: number;
}

export type Stage = "sprout" | "young" | "mature" | "ripe";

export function stageOf(growth: number): Stage | null {
  if (growth < 0.1) return null; // just seeds in the soil
  if (growth < 0.35) return "sprout";
  if (growth < 0.7) return "young";
  if (growth < 1) return "mature";
  return "ripe";
}

const FOUR: [number, number][] = [[-0.22, -0.2], [0.22, -0.18], [-0.2, 0.22], [0.2, 0.2]];
const TWO: [number, number][] = [[-0.18, -0.12], [0.18, 0.14]];
const ONE: [number, number][] = [[0, 0]];

const at = (spots: [number, number][], m: string, s: number, y = 0): CropPart[] =>
  spots.map(([x, z], i) => ({ m, x, z, y, s, ry: i * 1.7 }));

/** A few small things scattered around a spot (fruit on a bush, pods, blossoms). */
const around = (spots: [number, number][], part: Omit<CropPart, "x" | "z">, n: number, r: number, y: number): CropPart[] =>
  spots.flatMap(([x, z], k) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + k;
      return { ...part, x: x + Math.cos(a) * r, z: z + Math.sin(a) * r, y: y + (i % 2) * 0.08, ry: a };
    }),
  );

/**
 * A crop drawn with Quaternius's Ultimate Crops models: stages 1–4 are the growing plant
 * (stage 4 is the full plant with fruit, our "ripe"). Their "_Crop" models are loose
 * harvested produce, so they aren't used in the field.
 */
const quaternius = (name: string, spots: [number, number][], s: number): Record<Stage, CropPart[]> => ({
  sprout: at(spots, `crops/${name}_1`, s),
  young: at(spots, `crops/${name}_2`, s),
  mature: at(spots, `crops/${name}_3`, s),
  ripe: at(spots, `crops/${name}_4`, s),
});

const sprout = (spots: [number, number][], s = 1.1) => at(spots, "nature/crops_leafsStageA", s);

export const CROP_LOOKS: Record<CropId, Record<Stage, CropPart[]>> = {
  corn: quaternius("Corn", FOUR, 0.55),
  wheat: quaternius("Wheat", FOUR, 1.1),
  // Ripe carrots show their orange shoulders at the soil line; the root is underground.
  carrot: quaternius("Carrot", FOUR, 0.75),
  tomato: quaternius("Tomato", ONE, 0.62),
  beans: {
    sprout: sprout(TWO, 1.2),
    young: at(TWO, "nature/plant_bushSmall", 1.8),
    // Bean flowers are often purple or white.
    mature: [...at(TWO, "nature/plant_bush", 2), ...around(TWO, { m: "nature/flower_purpleA", s: 1 }, 3, 0.2, 0.15)],
    ripe: [...at(TWO, "nature/plant_bush", 2), ...around(TWO, { shape: "pod", s: 1 }, 5, 0.22, 0.25)],
  },
  potato: {
    sprout: sprout(TWO, 1.2),
    young: at(TWO, "nature/plant_bushSmall", 1.9),
    // Potato plants bloom with small purple or white flowers while tubers form underground.
    mature: [...at(TWO, "nature/plant_bushDetailed", 1.4), ...around(TWO, { m: "nature/flower_purpleA", s: 1 }, 3, 0.18, 0.25)],
    ripe: [...at(TWO, "nature/plant_bushDetailed", 1.3), ...around(TWO, { shape: "tuber", s: 1 }, 3, 0.26, 0)],
  },
  // A sprawling vine with one big pumpkin.
  squash: quaternius("Pumpkin", ONE, 0.75),
  sunflower: {
    sprout: sprout(TWO, 1.2),
    young: at(TWO, "nature/crops_leafsStageB", 1.3),
    mature: at(TWO, "nature/plant_flatTall", 3),
    // A tall stalk topped by a big flower head of yellow petals around a brown disk of seeds.
    ripe: [
      ...at(TWO, "nature/plant_flatTall", 3.2),
      ...TWO.map(([x, z]) => ({ shape: "sunPetals" as const, x, z: z + 0.04, y: 0.95, s: 1, rx: 1.1 })),
      ...TWO.map(([x, z]) => ({ shape: "sunSeeds" as const, x, z: z + 0.07, y: 0.96, s: 1, rx: 1.1 })),
    ],
  },
  buckwheat: {
    sprout: sprout(FOUR),
    young: at(FOUR, "nature/plant_flatShort", 1.4),
    // Buckwheat is covered in tiny white flowers that bees love.
    mature: [...at(FOUR, "nature/plant_flatShort", 1.7), ...around(FOUR, { shape: "blossomWhite", s: 1 }, 3, 0.07, 0.38)],
    ripe: [...at(FOUR, "nature/plant_flatShort", 1.8), ...around(FOUR, { shape: "blossomWhite", s: 1.2 }, 4, 0.08, 0.4)],
  },
  clover: {
    sprout: at(FOUR, "nature/grass_leafs", 1),
    young: at(FOUR, "nature/grass_leafs", 1.5),
    mature: [...at(FOUR, "nature/grass_leafs", 1.8), ...around(FOUR, { shape: "blossomPink", s: 1 }, 2, 0.08, 0.2)],
    ripe: [...at(FOUR, "nature/grass_leafs", 2), ...around(FOUR, { shape: "blossomPink", s: 1.2 }, 3, 0.09, 0.22)],
  },
};

/** Every model the crops use, for preloading and tests. */
export const CROP_MODELS = [...new Set(Object.values(CROP_LOOKS).flatMap((st) => Object.values(st).flatMap((ps) => ps.flatMap((p) => (p.m ? [p.m] : [])))))];
