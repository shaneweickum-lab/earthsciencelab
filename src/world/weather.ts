import { nextRandom } from "@/game/rng";
import { seasonOf } from "./clock";
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

const WEIGHTS: Record<Season, [WeatherId, number][]> = {
  Spring: [["sunny", 4], ["cloudy", 2], ["rain", 3], ["storm", 1], ["fog", 1]],
  Summer: [["sunny", 5], ["cloudy", 1], ["rain", 2], ["storm", 2], ["heat", 2]],
  Fall: [["sunny", 3], ["cloudy", 3], ["rain", 3], ["fog", 2], ["frost", 1]],
  Winter: [["sunny", 2], ["cloudy", 3], ["snow", 3], ["frost", 3]],
};

/** Deterministic weather for a day. Day 1 is always sunny so new players can learn in peace. */
export function weatherFor(seed: number, day: number): WeatherId {
  if (day === 1) return "sunny";
  const w = WEIGHTS[seasonOf(day)];
  const total = w.reduce((s, [, n]) => s + n, 0);
  let [r] = nextRandom((seed ^ (day * 2654435761)) >>> 0);
  r *= total;
  for (const [id, n] of w) {
    r -= n;
    if (r < 0) return id;
  }
  return w[0][0];
}

export function isWet(w: WeatherId) {
  return w === "rain" || w === "storm";
}
