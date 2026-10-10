/**
 * Elements that naturally make up soil, and the job each one does there.
 * soilPercent is a typical world-average share of soil by dry weight
 * (after Bowen 1979 and Vinogradov 1959), rounded. Real soils vary widely.
 */

export type SoilRole = "framework" | "organic" | "macro" | "micro" | "harmful";

export const SOIL_ROLES: Record<SoilRole, { label: string; icon: string; color: string; blurb: string; lesson: string }> = {
  framework: {
    label: "Mineral framework", icon: "🪨", color: "#b07a4a",
    blurb: "The skeleton of soil. These elements build sand, silt, and clay.",
    lesson: "soil-texture",
  },
  organic: {
    label: "Organic matter & life", icon: "🍂", color: "#4a7c3a",
    blurb: "The living part of soil: humus, roots, fungi, and microbes.",
    lesson: "what-is-soil",
  },
  macro: {
    label: "Plant macronutrients", icon: "🌱", color: "#6aa84f",
    blurb: "Plant food needed in big amounts, like N-P-K.",
    lesson: "healthy-soil",
  },
  micro: {
    label: "Micronutrients", icon: "🔬", color: "#3f86b0",
    blurb: "Needed in tiny amounts, but plants and microbes can't live without them.",
    lesson: "healthy-soil",
  },
  harmful: {
    label: "Found in soil, but harmful", icon: "⚠️", color: "#b8432f",
    blurb: "Natural in small traces, but pollution can build them up to toxic levels.",
    lesson: "soil-threats",
  },
};

export interface SoilElementInfo {
  z: number;
  roles: SoilRole[];
  /** Typical % of soil by dry weight. Omitted when a single number would mislead. */
  soilPercent?: number;
  soilJob: string;
  forms: string;
}

export const SOIL_ELEMENTS: SoilElementInfo[] = [
  { z: 8, roles: ["framework", "organic"], soilPercent: 49,
    soilJob: "Almost half of soil's weight. Oxygen locks onto silicon, aluminum, and iron to build nearly every mineral grain, and it fills the air pores roots breathe from.",
    forms: "Quartz (SiO₂), clays, iron oxides, water, pore air" },
  { z: 14, roles: ["framework"], soilPercent: 33,
    soilJob: "Silicon and oxygen link into quartz sand grains and the stacked sheets that make up clay. Silicon is the backbone of soil texture.",
    forms: "Quartz sand, feldspar, kaolinite and smectite clays" },
  { z: 13, roles: ["framework"], soilPercent: 7.1,
    soilJob: "Builds the thin, layered sheets of clay minerals that hold water and nutrients. In very acidic soil it can dissolve and harm roots.",
    forms: "Kaolinite and other clays, feldspar, gibbsite" },
  { z: 26, roles: ["framework", "micro"], soilPercent: 4,
    soilJob: "Iron oxides paint soil red, orange, and yellow and help glue soil crumbs together. Plants also need a little to make chlorophyll.",
    forms: "Hematite (red), goethite (yellow-brown), rust coatings on grains" },
  { z: 6, roles: ["organic"], soilPercent: 2,
    soilJob: "The heart of organic matter. Carbon from roots, leaves, and microbes becomes humus, which holds water and feeds soil life. Soils store more carbon than all plants and the air combined.",
    forms: "Humus, roots, microbes, charcoal, limestone (calcium carbonate)" },
  { z: 20, roles: ["framework", "macro"], soilPercent: 1.5,
    soilJob: "Calcium links clay and humus into stable crumbs and keeps soil from getting too acidic. Plants use it to build strong cell walls.",
    forms: "Limestone, calcite, gypsum, calcium held on clay surfaces" },
  { z: 19, roles: ["framework", "macro"], soilPercent: 1.4,
    soilJob: "The 'K' in N-P-K. Released slowly as feldspar and mica weather. Plants use it to control water and fight disease.",
    forms: "Feldspar, mica, illite clay, potassium held on clay" },
  { z: 11, roles: ["framework"], soilPercent: 0.5,
    soilJob: "Part of feldspar minerals. Too much sodium makes clay swell and seal up, so water can't soak in.",
    forms: "Feldspar, salt crusts in dry soils" },
  { z: 12, roles: ["framework", "macro"], soilPercent: 0.5,
    soilJob: "Sits at the center of every chlorophyll molecule. In soil it comes from weathering minerals and helps hold clay together.",
    forms: "Dolomite, olivine, smectite clays" },
  { z: 22, roles: ["framework"], soilPercent: 0.5,
    soilJob: "Forms tough mineral grains that barely weather, so scientists use them to track how old and worn a soil is.",
    forms: "Rutile and ilmenite grains" },
  { z: 1, roles: ["organic"],
    soilJob: "Part of every water molecule in the pores and of every sugar, protein, and humus molecule. Hydrogen ions also decide how acidic the soil is (pH).",
    forms: "Soil water, organic matter, H⁺ ions" },
  { z: 7, roles: ["organic", "macro"], soilPercent: 0.2,
    soilJob: "The 'N' in N-P-K and the nutrient plants need most. Soil bacteria pull it from the air and recycle it from dead plants into nitrate that roots can drink.",
    forms: "Organic matter, nitrate, ammonium" },
  { z: 15, roles: ["organic", "macro"], soilPercent: 0.08,
    soilJob: "The 'P' in N-P-K. Builds DNA and energy molecules. It sticks tightly to soil, and fungi on roots help plants reach it.",
    forms: "Apatite, phosphate stuck to iron and aluminum, organic phosphorus" },
  { z: 16, roles: ["organic", "macro"], soilPercent: 0.07,
    soilJob: "Needed to make proteins. Most soil sulfur sits in organic matter until microbes release it as sulfate.",
    forms: "Organic matter, sulfate, gypsum" },
  { z: 25, roles: ["micro"], soilPercent: 0.1,
    soilJob: "Helps plants split water during photosynthesis. The black specks and coatings in some soils are manganese oxides.",
    forms: "Manganese oxides" },
  { z: 17, roles: ["micro"], soilPercent: 0.01,
    soilJob: "A tiny amount helps leaves open and close their pores. Too much makes soil salty.",
    forms: "Chloride dissolved in soil water" },
  { z: 30, roles: ["micro"], soilPercent: 0.009,
    soilJob: "Helps plants make growth hormones. Zinc-poor soils grow stunted corn and rice.",
    forms: "Zinc held on clay and organic matter" },
  { z: 28, roles: ["micro"], soilPercent: 0.005,
    soilJob: "Needed in very tiny amounts by plants and by microbes that break down urea.",
    forms: "Weathered rock minerals" },
  { z: 82, roles: ["harmful"], soilPercent: 0.0035,
    soilJob: "Natural traces are harmless, but old paint and leaded gasoline left high levels in many city soils. Test garden soil before growing food.",
    forms: "Lead stuck tightly to soil particles" },
  { z: 29, roles: ["micro"], soilPercent: 0.003,
    soilJob: "A micronutrient that helps plants use energy and build lignin. Organic matter holds onto it tightly.",
    forms: "Copper held by humus" },
  { z: 5, roles: ["micro"], soilPercent: 0.001,
    soilJob: "Helps build cell walls and pollen. It washes out of sandy soils easily.",
    forms: "Borate in soil water and organic matter" },
  { z: 27, roles: ["micro"], soilPercent: 0.0008,
    soilJob: "Plants barely need it, but the bacteria in legume root nodules need it to turn air into fertilizer.",
    forms: "Weathered rock minerals" },
  { z: 33, roles: ["harmful"], soilPercent: 0.0006,
    soilJob: "Natural in some rocks, and added by old pesticides. Rice paddies can pick it up from soil and water.",
    forms: "Arsenate stuck to iron oxides" },
  { z: 42, roles: ["micro"], soilPercent: 0.00012,
    soilJob: "The rarest nutrient plants need, but nitrogen-fixing bacteria can't work without it.",
    forms: "Molybdate, more available in less acidic soil" },
  { z: 48, roles: ["harmful"], soilPercent: 0.000035,
    soilJob: "Builds up from some phosphate fertilizers and pollution. Plants can absorb it, so it can end up in food.",
    forms: "Cadmium held on clay and organic matter" },
  { z: 80, roles: ["harmful"], soilPercent: 0.000006,
    soilJob: "Falls from the air after coal burning and mining. Microbes in wet soils can turn it into a more toxic form.",
    forms: "Mercury bound to organic matter" },
];

export const SOIL_BY_Z: Map<number, SoilElementInfo> = new Map(SOIL_ELEMENTS.map((s) => [s.z, s]));

/** Elements that build soil (everything except the pollutants), used for the Soil Chemist badge. */
export const SOIL_BUILDER_ZS: number[] = SOIL_ELEMENTS.filter((s) => !s.roles.includes("harmful")).map((s) => s.z);

/** Top elements of soil by weight, for the "what soil is made of" bar. */
export const SOIL_RECIPE: { z: number; percent: number }[] = SOIL_ELEMENTS.filter((s) => (s.soilPercent ?? 0) >= 0.5)
  .map((s) => ({ z: s.z, percent: s.soilPercent! }))
  .sort((a, b) => b.percent - a.percent);

export function formatSoilPercent(p: number): string {
  if (p >= 1) return `about ${Math.round(p)}%`;
  if (p >= 0.1) return `about ${p}%`;
  const ppm = p * 10000;
  return ppm >= 1 ? `about ${Math.round(ppm)} parts per million` : `about ${ppm.toPrecision(1)} parts per million`;
}
