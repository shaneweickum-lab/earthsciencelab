import { nextRandom } from "@/game/rng";
import { seasonOf, yearFraction, type Calendar } from "./clock";
import type { Season, WeatherId } from "./types";

export const WEATHER: Record<WeatherId, { name: string; icon: string; tv: string; science: string }> = {
  sunny: {
    name: "Sunny", icon: "☀️", tv: "Clear skies and sunshine.",
    science: "High pressure brings sinking air, which keeps clouds from forming. Sunny days dry soil out fast, so check your crops' water.",
  },
  cloudy: {
    name: "Cloudy", icon: "☁️", tv: "A gray, cloudy day.",
    science: "Clouds form when rising air cools and its water vapor condenses into tiny droplets. Flat gray stratus clouds rarely bring heavy rain.",
  },
  rain: {
    name: "Rain", icon: "🌧️", tv: "Rain all day. Your outdoor crops will be watered for you!",
    science: "Rain falls when cloud droplets bump together and grow too heavy to float. Covered soil soaks rain in; bare soil can wash away.",
  },
  storm: {
    name: "Thunderstorm", icon: "⛈️", tv: "Thunderstorms! Heavy rain can wash bare soil away.",
    science: "Tall cumulonimbus clouds build when warm, moist air rises fast. Lightning even turns some nitrogen in the air into plant food that rain carries to the soil.",
  },
  heat: {
    name: "Heat wave", icon: "🥵", tv: "Very hot and dry. Soil will dry out fast. Mulch helps!",
    science: "In a heat wave, water evaporates from soil and leaves much faster. Mulch shades the ground, and soil rich in organic matter holds more water.",
  },
  fog: {
    name: "Foggy", icon: "🌫️", tv: "Foggy and damp. A good day for mushrooms.",
    science: "Fog is a cloud touching the ground. It forms when moist air cools to its dew point. Damp, still days are when mushrooms pop up.",
  },
  frost: {
    name: "Frost", icon: "🥶", tv: "Frost tonight! Tender crops outside could freeze.",
    science: "Frost forms on clear, calm nights when the ground loses heat to the sky and drops below freezing. Ice crystals inside plant cells can burst them.",
  },
  snow: {
    name: "Snow", icon: "❄️", tv: "Snow is falling. Only the greenhouse can grow crops now.",
    science: "Snow forms when water vapor freezes straight into ice crystals high in cold clouds. A snow blanket actually insulates the soil below.",
  },
};

type Sky = "sunny" | "cloudy" | "rain" | "storm" | "fog";

const WEIGHTS: Record<Season, [Sky, number][]> = {
  Spring: [["sunny", 4], ["cloudy", 2], ["rain", 3], ["storm", 1], ["fog", 1]],
  Summer: [["sunny", 6], ["cloudy", 1], ["rain", 2], ["storm", 2]],
  Fall: [["sunny", 3], ["cloudy", 3], ["rain", 3], ["fog", 2]],
  Winter: [["sunny", 3], ["cloudy", 3], ["rain", 3], ["fog", 1]],
};

/** The year-round mix when seasons are off. */
const MILD: [Sky, number][] = [["sunny", 5], ["cloudy", 2], ["rain", 3], ["storm", 1], ["fog", 1]];

/** How far the high and low swing from the day's average. Clouds and rain keep days and nights closer together. */
const RANGE: Record<Sky, number> = { sunny: 11, cloudy: 7, rain: 6, storm: 8, fog: 5 };

export interface DayWeather {
  kind: WeatherId;
  /** Daytime high and nighttime low, °F. */
  high: number;
  low: number;
}

/**
 * Average temperature (°F) through the year for a temperate farm: coldest in mid-January (about 30°F)
 * and warmest in late July (about 78°F), because sunlight is lower and days are shorter in winter.
 * `f` is the fraction of the year since the first day of spring.
 */
export function seasonalMeanF(f: number): number {
  return 54 + 24 * Math.sin(2 * Math.PI * f - 0.52);
}

function rand(seed: number, day: number, salt: number) {
  let s = (seed ^ Math.imul(day, 2654435761) ^ salt) >>> 0;
  return () => {
    const [v, n] = nextRandom(s);
    s = n;
    return v;
  };
}

/**
 * Deterministic weather for a day: the sky, then temperatures, then what falls.
 * Rain on a day that stays near freezing falls as snow; a clear night below freezing brings frost.
 * Day 1 is always a mild, sunny day so new players can learn in peace.
 */
export function weatherFor(seed: number, day: number, cal: Calendar): DayWeather {
  if (day === 1) return { kind: "sunny", high: cal.seasons ? 64 : 74, low: cal.seasons ? 42 : 58 };
  const r = rand(seed, day, 0x5ea);
  const weights = cal.seasons ? WEIGHTS[seasonOf(day, cal)] : MILD;
  const total = weights.reduce((sum, [, n]) => sum + n, 0);
  let pick = r() * total;
  let sky: Sky = weights[0][0];
  for (const [id, n] of weights) {
    pick -= n;
    if (pick < 0) {
      sky = id;
      break;
    }
  }
  const noise = (r() - 0.5) * 16;
  const mean = cal.seasons ? seasonalMeanF(yearFraction(day, cal)) + noise : 70 + noise * 0.5;
  const range = cal.seasons ? RANGE[sky] : Math.min(RANGE[sky], 8);
  const high = Math.round(mean + range);
  const low = Math.round(mean - range);
  let kind: WeatherId = sky;
  if ((sky === "rain" || sky === "storm") && high <= 34) kind = "snow";
  else if (sky !== "rain" && sky !== "storm" && low <= 32) kind = "frost";
  else if (sky === "sunny" && high >= 92) kind = "heat";
  return { kind, high, low };
}

/** Temperature at a time of day: coolest around 6 AM, warmest around 3 PM. */
export function tempAt(w: DayWeather, minuteOfDay: number): number {
  const h = (minuteOfDay % 1440) / 60;
  const t = h >= 6 && h <= 15 ? (h - 6) / 9 : h > 15 ? 1 - (h - 15) / 15 : 1 - (h + 9) / 15;
  const smooth = (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, t)))) / 2;
  return w.low + (w.high - w.low) * smooth;
}

export function isWet(w: WeatherId) {
  return w === "rain" || w === "storm";
}
