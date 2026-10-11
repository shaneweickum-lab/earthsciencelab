import type { CurriculumLesson, Level } from "./types";
import { UNIT1 } from "./unit1";
import { UNIT1_MORE } from "./unit1-more";
import { UNIT2 } from "./unit2";
import { UNIT3 } from "./unit3";
import { UNIT4 } from "./unit4";
import { UNIT5 } from "./unit5";
import { UNITS } from "./units";

export * from "./types";
export { UNITS };

/** Lesson order within each unit. */
const ORDER = [
  "what-is-soil", "soil-formation", "soil-horizons",
  "soil-texture", "soil-structure", "soil-color", "soil-chemistry",
  "soil-food-web", "decomposition", "roots-and-nitrogen",
  "soil-orders", "soils-and-climate",
  "healthy-soil", "soil-threats", "regenerative-principles", "soil-food-climate",
];

const all = [...UNIT1, ...UNIT1_MORE, ...UNIT2, ...UNIT3, ...UNIT4, ...UNIT5];

export const CURRICULUM: CurriculumLesson[] = [...all].sort(
  (a, b) => (ORDER.indexOf(a.slug) + 1 || 999) - (ORDER.indexOf(b.slug) + 1 || 999),
);

export const PLANNED_SLUGS = ORDER;

export function getCurriculumLesson(slug: string): CurriculumLesson | undefined {
  return CURRICULUM.find((l) => l.slug === slug);
}

export function lessonsInUnit(unit: number): CurriculumLesson[] {
  return CURRICULUM.filter((l) => l.unit === unit);
}

export function levelContent(lesson: CurriculumLesson, level: Level) {
  return lesson.levels[level];
}
