/**
 * Game settings: which science features are switched on, how fast time runs, and the calendar.
 *
 * Every mechanic that adds scientific realism is listed in SCIENCE_FEATURES and checked with
 * `on(state, "id")` in the engine, so players can switch each one on or off by itself.
 * To add a new one: add it to SCIENCE_FEATURES, gate its code with `on(state, "yourId")`,
 * and give it a test showing what changes when it's off. A test fails if a feature is
 * registered but never checked, or checked but never registered.
 */

export type FeatureCategory = "Soil" | "Water" | "Plants" | "Weeds & pests" | "Climate" | "Daily life";

export interface ScienceFeature {
  id: string;
  category: FeatureCategory;
  icon: string;
  label: string;
  /** The real-world science, in a sentence a kid can follow. */
  science: string;
  /** What changes in the game when it's on. */
  on: string;
  /** What happens instead when it's off. */
  off: string;
}

export const SCIENCE_FEATURES = [
  {
    id: "soilTesting", category: "Soil", icon: "🧪", label: "Hidden soil",
    science: "You can't see nutrients or pH by looking. Farmers test soil to find out.",
    on: "Soil numbers stay hidden until you run a lab, shovel, or ring test.", off: "Every tile's soil numbers are always visible.",
  },
  {
    id: "ph", category: "Soil", icon: "⚗️", label: "Soil pH",
    science: "Soil that is too acidic or too alkaline locks up nutrients so roots can't take them in.",
    on: "pH far from 6.5 slows growth. Lime raises pH.", off: "pH has no effect on plants.",
  },
  {
    id: "nutrients", category: "Soil", icon: "🌱", label: "Nutrients",
    science: "Plants pull nitrogen, phosphorus, and potassium from the soil as they grow.",
    on: "Low nutrients slow growth and harvests use nutrients up. Compost and legumes put them back.", off: "Soil never runs out of food.",
  },
  {
    id: "tillage", category: "Soil", icon: "⛏️", label: "Tillage damage",
    science: "Digging breaks apart soil crumbs (aggregates) and speeds up the loss of organic matter.",
    on: "Each tilling lowers structure, organic matter, and soil life a little.", off: "Tilling doesn't hurt the soil.",
  },
  {
    id: "soilLife", category: "Soil", icon: "🪱", label: "Living soil",
    science: "Worms, fungi, and bacteria feed on organic matter and glue soil into crumbs.",
    on: "Overnight, soil life grows with organic matter and builds structure; mulch adds organic matter.", off: "Soil stays the same overnight.",
  },
  {
    id: "erosion", category: "Soil", icon: "🌊", label: "Erosion",
    science: "Hard rain washes bare soil away, taking topsoil and nutrients with it.",
    on: "Storms wash away bare, tilled soil. Mulch and plant cover protect it.", off: "Storms never wash soil away.",
  },
  {
    id: "watering", category: "Water", icon: "💧", label: "Thirsty plants",
    science: "Sun and wind dry the soil, and roots need water to carry nutrients up into the plant.",
    on: "Soil dries out and dry crops nearly stop growing. Water them or wait for rain.", off: "Crops never get thirsty.",
  },
  {
    id: "waterlogging", category: "Water", icon: "🫧", label: "Waterlogging",
    science: "Roots breathe oxygen from air spaces in soil. Soggy, packed soil fills those spaces with water.",
    on: "Soaked soil with poor structure slows growth. Compost and good structure help it drain.", off: "Plants never mind extra water.",
  },
  {
    id: "rotation", category: "Plants", icon: "🔄", label: "Crop rotation",
    science: "Growing the same plant family in one spot builds up its pests and drains the same nutrients.",
    on: "Planting the same family twice in a row invites pests and uses extra nutrients.", off: "Plant anything anywhere, any number of times.",
  },
  {
    id: "plantingSeasons", category: "Plants", icon: "📅", label: "Planting seasons",
    science: "Each crop has seasons when the weather suits it.",
    on: "Crops can only be planted outdoors in their seasons, and die when their season ends.", off: "Plant any crop in any season.",
  },
  {
    id: "pollinators", category: "Plants", icon: "🐝", label: "Pollinators",
    science: "Bees carry pollen between flowers, which many crops need to make fruit.",
    on: "Crops near a beehive grow a little faster.", off: "Beehives only make honey.",
  },
  {
    id: "weeds", category: "Weeds & pests", icon: "🌿", label: "Weeds",
    science: "Weed seeds sprout on bare soil and compete with crops for water, light, and nutrients.",
    on: "Weeds sprout overnight on uncovered soil and slow your crops.", off: "No new weeds.",
  },
  {
    id: "pests", category: "Weeds & pests", icon: "🐛", label: "Pests",
    science: "Insects like aphids feed on crops; predators like ladybugs and birds keep them in check.",
    on: "Pests show up and slow crops. Bug hotels and bird houses help.", off: "No pests.",
  },
  {
    id: "temperature", category: "Climate", icon: "🌡️", label: "Temperature",
    science: "Cool-season crops like carrots like it mild; warm-season crops like beans need warm soil.",
    on: "Crops grow faster or slower with the day's temperature.", off: "Temperature never changes how fast crops grow.",
  },
  {
    id: "frost", category: "Climate", icon: "🥶", label: "Frost & snow",
    science: "Ice crystals inside plant cells burst them. Hardy crops can survive a light frost.",
    on: "A freezing night kills tender crops outdoors. A greenhouse protects them.", off: "Cold never kills crops.",
  },
  {
    id: "energy", category: "Daily life", icon: "⚡", label: "Energy",
    science: "Farm work is hard work!",
    on: "Tools use energy. Sleep to restore it.", off: "Unlimited energy.",
  },
  {
    id: "bedtime", category: "Daily life", icon: "🌙", label: "Bedtime",
    science: "Rest matters.",
    on: "Stay up past 2 AM and you faint and lose some coins.", off: "The clock waits at 2 AM until you go to bed.",
  },
] as const satisfies readonly ScienceFeature[];

export type FeatureId = (typeof SCIENCE_FEATURES)[number]["id"];

export const FEATURE_IDS = SCIENCE_FEATURES.map((f) => f.id) as FeatureId[];

export type Units = "F" | "C";

export interface GameSettings {
  science: Record<FeatureId, boolean>;
  /** Game minutes per real minute: 1 (real time) to 60 (1 game hour per real minute). */
  speed: number;
  /** Seasons and weather that change through the year. Off: an endless mild growing season. */
  seasons: boolean;
  /** 5 to 30 days per month; 12 months a year. */
  daysPerMonth: number;
  units: Units;
}

export const SPEED_MIN = 1;
export const SPEED_MAX = 60;
export const SPEED_PRESETS = [1, 5, 10, 30, 60];
export const MONTH_MIN = 5;
export const MONTH_MAX = 30;

const all = (value: boolean) => Object.fromEntries(FEATURE_IDS.map((id) => [id, value])) as Record<FeatureId, boolean>;

export type PresetId = "sandbox" | "classic" | "science";

export const PRESETS: Record<PresetId, { label: string; icon: string; desc: string; science: Record<FeatureId, boolean> }> = {
  sandbox: { label: "Sandbox", icon: "🏖️", desc: "Every science feature off. Just build and grow.", science: all(false) },
  classic: {
    label: "Classic", icon: "🌻", desc: "The recommended mix: real soil science without the hardest challenges.",
    science: { ...all(true), waterlogging: false, temperature: false },
  },
  science: { label: "Real Science", icon: "🔬", desc: "Every feature on. The most realistic and the hardest.", science: all(true) },
};

export function presetOf(science: Record<FeatureId, boolean>): PresetId | "custom" {
  for (const [id, p] of Object.entries(PRESETS) as [PresetId, (typeof PRESETS)[PresetId]][]) {
    if (FEATURE_IDS.every((f) => p.science[f] === science[f])) return id;
  }
  return "custom";
}

export const DEFAULT_SETTINGS: GameSettings = {
  science: PRESETS.classic.science,
  speed: 60,
  seasons: true,
  daysPerMonth: 5,
  units: "F",
};

const clampInt = (v: unknown, lo: number, hi: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : fallback;

/** Fill in missing or out-of-range values (old saves, hand-edited storage). */
export function normalizeSettings(s: Partial<GameSettings> | undefined): GameSettings {
  const science = { ...DEFAULT_SETTINGS.science };
  for (const id of FEATURE_IDS) if (typeof s?.science?.[id] === "boolean") science[id] = s.science[id];
  return {
    science,
    speed: clampInt(s?.speed, SPEED_MIN, SPEED_MAX, DEFAULT_SETTINGS.speed),
    seasons: typeof s?.seasons === "boolean" ? s.seasons : DEFAULT_SETTINGS.seasons,
    daysPerMonth: clampInt(s?.daysPerMonth, MONTH_MIN, MONTH_MAX, DEFAULT_SETTINGS.daysPerMonth),
    units: s?.units === "C" ? "C" : "F",
  };
}

/** Is this science feature switched on? */
export function on(state: { settings: GameSettings }, id: FeatureId): boolean {
  return state.settings.science[id];
}

export function speedLabel(speed: number): string {
  if (speed === 1) return "Real time: 1 game minute = 1 real minute";
  if (speed === 60) return "1 game hour = 1 real minute";
  const realMinutesPerHour = 60 / speed;
  return `1 game hour = ${realMinutesPerHour % 1 ? realMinutesPerHour.toFixed(1) : realMinutesPerHour} real minutes`;
}

export function formatTemp(f: number, units: Units): string {
  return units === "F" ? `${Math.round(f)}°F` : `${Math.round(((f - 32) * 5) / 9)}°C`;
}
