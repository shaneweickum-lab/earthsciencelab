/**
 * USDA soil texture classification.
 * Boundaries follow the NRCS Soil Survey Manual texture triangle rules.
 */

export type TextureClass =
  | "sand"
  | "loamy sand"
  | "sandy loam"
  | "loam"
  | "silt loam"
  | "silt"
  | "sandy clay loam"
  | "clay loam"
  | "silty clay loam"
  | "sandy clay"
  | "silty clay"
  | "clay";

export const TEXTURE_CLASSES: TextureClass[] = [
  "sand",
  "loamy sand",
  "sandy loam",
  "loam",
  "silt loam",
  "silt",
  "sandy clay loam",
  "clay loam",
  "silty clay loam",
  "sandy clay",
  "silty clay",
  "clay",
];

export interface TextureInfo {
  label: string;
  color: string;
  feel: string;
  drainage: string;
}

export const TEXTURE_INFO: Record<TextureClass, TextureInfo> = {
  sand: { label: "Sand", color: "#e8cf8f", feel: "Gritty. Won't hold a shape at all.", drainage: "Drains very fast, holds little water or food for plants." },
  "loamy sand": { label: "Loamy Sand", color: "#dcc07a", feel: "Gritty, barely holds a ball that crumbles when touched.", drainage: "Drains fast, dries out quickly." },
  "sandy loam": { label: "Sandy Loam", color: "#c9a865", feel: "Gritty but forms a weak ball.", drainage: "Drains well and warms up quickly in spring." },
  loam: { label: "Loam", color: "#9c7a4c", feel: "Soft and a little gritty, forms a ball that holds.", drainage: "A great balance of drainage and water holding." },
  "silt loam": { label: "Silt Loam", color: "#b3906a", feel: "Smooth and floury, like flour or talc.", drainage: "Holds lots of water. Can form a crust if left bare." },
  silt: { label: "Silt", color: "#c8b08f", feel: "Very smooth and silky, not sticky.", drainage: "Holds water well but erodes easily." },
  "sandy clay loam": { label: "Sandy Clay Loam", color: "#b0714a", feel: "Gritty and a bit sticky, makes a short ribbon.", drainage: "Moderate drainage, holds nutrients fairly well." },
  "clay loam": { label: "Clay Loam", color: "#8c5a3c", feel: "Sticky, makes a ribbon about 1 to 2 inches long.", drainage: "Holds water and nutrients well, drains slowly." },
  "silty clay loam": { label: "Silty Clay Loam", color: "#7d6650", feel: "Smooth and sticky, makes a medium ribbon.", drainage: "Holds lots of water, can get compacted." },
  "sandy clay": { label: "Sandy Clay", color: "#a35b3a", feel: "Gritty and very sticky.", drainage: "Drains slowly. Rare in nature." },
  "silty clay": { label: "Silty Clay", color: "#6b5a4a", feel: "Smooth, very sticky, long ribbon.", drainage: "Drains slowly, swells when wet." },
  clay: { label: "Clay", color: "#5e4232", feel: "Very sticky, makes a long ribbon over 2 inches.", drainage: "Holds lots of water and nutrients, drains very slowly." },
};

export interface Composition {
  sand: number;
  silt: number;
  clay: number;
}

/** Classify a composition (percentages that sum to ~100) into a USDA texture class. */
export function classifyTexture({ sand, silt, clay }: Composition): TextureClass {
  const total = sand + silt + clay;
  if (total <= 0) throw new Error("Composition must have a positive total");
  // Normalize so small rounding errors don't matter.
  sand = (sand / total) * 100;
  silt = (silt / total) * 100;
  clay = (clay / total) * 100;

  if (silt + 1.5 * clay < 15) return "sand";
  if (silt + 2 * clay < 30) return "loamy sand";
  if (clay >= 40) {
    if (silt >= 40) return "silty clay";
    if (sand > 45) return "sandy clay";
    return "clay";
  }
  if (clay >= 35 && sand > 45) return "sandy clay";
  if (clay >= 27) {
    if (sand <= 20) return "silty clay loam";
    if (sand <= 45) return "clay loam";
    return "sandy clay loam";
  }
  if (clay >= 20 && silt < 28 && sand > 45) return "sandy clay loam";
  if (silt >= 80 && clay < 12) return "silt";
  if (silt >= 50) return "silt loam";
  if (clay >= 7 && silt >= 28 && sand <= 52) return "loam";
  return "sandy loam";
}

/** Clamp slider input to a valid composition, giving silt whatever is left. */
export function compositionFromSandClay(sand: number, clay: number): Composition {
  const s = Math.max(0, Math.min(100, Math.round(sand)));
  const c = Math.max(0, Math.min(100 - s, Math.round(clay)));
  return { sand: s, clay: c, silt: 100 - s - c };
}
