import type { Season } from "./types";

export const DAY_START = 6 * 60;
/** You faint if still awake at 2 AM. */
export const DAY_END = 26 * 60;
export const DAYS_PER_SEASON = 7;
export const SEASONS: Season[] = ["Spring", "Summer", "Fall", "Winter"];
/** Real milliseconds per game minute (a 20-hour day takes about 10 real minutes). */
export const MS_PER_GAME_MINUTE = 500;

/** Day number (1-based). The day "rolls over" at 6 AM, so 1 AM still belongs to the previous day. */
export function dayOf(minute: number): number {
  return Math.floor((minute - DAY_START) / 1440) + 1;
}

/** Minutes since midnight of the current game day, from 360 (6 AM) to 1559 (1:59 AM next day). */
export function timeOfDay(minute: number): number {
  return ((minute - DAY_START) % 1440 + 1440) % 1440 + DAY_START;
}

export function seasonOf(day: number): Season {
  return SEASONS[Math.floor((day - 1) / DAYS_PER_SEASON) % 4];
}

export function dayOfSeason(day: number): number {
  return ((day - 1) % DAYS_PER_SEASON) + 1;
}

export function yearOf(day: number): number {
  return Math.floor((day - 1) / (DAYS_PER_SEASON * 4)) + 1;
}

export function formatTime(minute: number): string {
  const t = timeOfDay(minute) % 1440;
  const h = Math.floor(t / 60);
  const m = Math.floor(t % 60);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** First minute of a given day (6 AM). */
export function startOfDay(day: number): number {
  return (day - 1) * 1440 + DAY_START;
}

/** 0 at night, 1 at midday, smooth sunrise around 6–8 AM and sunset around 6–8 PM. */
export function daylight(minute: number): number {
  const h = (timeOfDay(minute) % 1440) / 60;
  if (h < 5 || h >= 21) return 0;
  if (h < 8) return (h - 5) / 3;
  if (h > 18) return (21 - h) / 3;
  return 1;
}
