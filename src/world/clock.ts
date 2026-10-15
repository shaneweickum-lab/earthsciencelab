import type { Season } from "./types";

export const DAY_START = 6 * 60;
/** You faint if still awake at 2 AM. */
export const DAY_END = 26 * 60;
export const SEASONS: Season[] = ["Spring", "Summer", "Fall", "Winter"];
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** The parts of the settings the calendar needs. */
export interface Calendar {
  seasons: boolean;
  /** 5 to 30 days per month, 12 months a year. */
  daysPerMonth: number;
}

/** Real milliseconds per game minute at a speed of `speed` game minutes per real minute. */
export function msPerGameMinute(speed: number): number {
  return 60000 / speed;
}

/** Day number (1-based). The day "rolls over" at 6 AM, so 1 AM still belongs to the previous day. */
export function dayOf(minute: number): number {
  return Math.floor((minute - DAY_START) / 1440) + 1;
}

/** Minutes since midnight of the current game day, from 360 (6 AM) to 1559 (1:59 AM next day). */
export function timeOfDay(minute: number): number {
  return ((minute - DAY_START) % 1440 + 1440) % 1440 + DAY_START;
}

/**
 * Seasons start on the 21st of March, June, September, and December, like the real equinoxes and
 * solstices. Shorter months move the start proportionally: the 3rd for 5-day months, the 7th for 10-day months.
 */
export function seasonStartDay(daysPerMonth: number): number {
  return Math.max(1, Math.floor((21 * daysPerMonth) / 30));
}

export const daysPerYear = (cal: Calendar) => 12 * cal.daysPerMonth;
export const daysPerSeason = (cal: Calendar) => 3 * cal.daysPerMonth;

/** Day 1 of the game is the first day of spring. Days since January 1st of year 1 for game day 1. */
function firstDayOffset(cal: Calendar) {
  return 2 * cal.daysPerMonth + seasonStartDay(cal.daysPerMonth) - 1;
}

export function dateOf(day: number, cal: Calendar): { year: number; month: number; dayOfMonth: number } {
  const n = firstDayOffset(cal) + day - 1;
  const inYear = n % daysPerYear(cal);
  return {
    year: Math.floor(n / daysPerYear(cal)) + 1,
    month: Math.floor(inYear / cal.daysPerMonth),
    dayOfMonth: (inYear % cal.daysPerMonth) + 1,
  };
}

/** Days since the spring equinox, within the year (0 = first day of spring). */
function daysSinceSpring(day: number, cal: Calendar) {
  return (((day - 1) % daysPerYear(cal)) + daysPerYear(cal)) % daysPerYear(cal);
}

/** Fraction of the year since the first day of spring, 0–1. */
export function yearFraction(day: number, cal: Calendar): number {
  return daysSinceSpring(day, cal) / daysPerYear(cal);
}

/** The season for growing and visuals. With seasons off it's always a mild growing season (drawn like summer). */
export function seasonOf(day: number, cal: Calendar): Season {
  if (!cal.seasons) return "Summer";
  return SEASONS[Math.floor(daysSinceSpring(day, cal) / daysPerSeason(cal))];
}

export function seasonLabel(day: number, cal: Calendar): string {
  return cal.seasons ? seasonOf(day, cal) : "Growing season";
}

export function dayOfSeason(day: number, cal: Calendar): number {
  return (daysSinceSpring(day, cal) % daysPerSeason(cal)) + 1;
}

export function yearOf(day: number, cal: Calendar): number {
  return dateOf(day, cal).year;
}

/** "March 21" */
export function formatDate(day: number, cal: Calendar, short = false): string {
  const d = dateOf(day, cal);
  const m = MONTHS[d.month];
  return `${short ? m.slice(0, 3) : m} ${d.dayOfMonth}`;
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
