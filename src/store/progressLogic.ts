import type { Level } from "@/content/soil/curriculum/types";
import { SOIL_BUILDER_ZS } from "@/data/soilElements";
import { LESSON_BADGES, UNIT_BADGES, type BadgeId } from "./badges";

export const XP_PER_LEVEL = 200;
export const LESSON_XP = 50;
export const QUIZ_XP_PER_CORRECT = 10;
export const REGION_XP = 5;
export const GLOBE_QUIZ_XP = 5;
export const ELEMENT_XP = 2;
export const TOTAL_ELEMENTS = 118;

export interface ProgressData {
  xp: number;
  completedLessons: string[];
  /** Best quiz score per lesson and level, keyed "slug:level". */
  quizScores: Record<string, { correct: number; total: number }>;
  gradeLevel: Level;
  badges: BadgeId[];
  visitedRegions: string[];
  globeQuizCorrect: number;
  /** Nature Journal pages found in Soil & Sprout. */
  natureFound: string[];
  farmHarvests: number;
  bestSoilHealth: number;
  viewedElements: number[];
}

export const EMPTY_PROGRESS: ProgressData = {
  xp: 0,
  completedLessons: [],
  quizScores: {},
  gradeLevel: "middle",
  badges: [],
  visitedRegions: [],
  globeQuizCorrect: 0,
  natureFound: [],
  farmHarvests: 0,
  bestSoilHealth: 0,
  viewedElements: [],
};

export function levelFor(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export type Update = { data: ProgressData; newBadges: BadgeId[] };

function award(data: ProgressData, ids: BadgeId[]): Update {
  const newBadges = ids.filter((id) => !data.badges.includes(id));
  return { data: { ...data, badges: [...data.badges, ...newBadges] }, newBadges };
}

export function quizKey(slug: string, level: Level): string {
  return `${slug}:${level}`;
}

/** Best number of correct answers on a lesson's quiz at any level. */
function bestCorrectAnyLevel(data: ProgressData, slug: string): number {
  return Math.max(
    0,
    ...Object.entries(data.quizScores)
      .filter(([k]) => k === slug || k.startsWith(`${slug}:`))
      .map(([, v]) => v.correct),
  );
}

/**
 * Lesson XP is paid once per lesson, whatever the level. Quiz XP is paid only for beating your
 * best score on that lesson at any level, so retaking a quiz or switching levels can't farm XP.
 */
export function completeLesson(
  data: ProgressData, slug: string, level: Level, correct: number, total: number,
  lessons: { slug: string; unit: number }[],
): Update {
  const first = !data.completedLessons.includes(slug);
  const prevBestAny = bestCorrectAnyLevel(data, slug);
  const key = quizKey(slug, level);
  const prevBestHere = data.quizScores[key]?.correct ?? 0;
  const gained = (first ? LESSON_XP : 0) + Math.max(0, correct - prevBestAny) * QUIZ_XP_PER_CORRECT;
  const completedLessons = first ? [...data.completedLessons, slug] : data.completedLessons;
  const next: ProgressData = {
    ...data,
    xp: data.xp + gained,
    completedLessons,
    quizScores: { ...data.quizScores, [key]: { correct: Math.max(correct, prevBestHere), total } },
  };
  const badges: BadgeId[] = [];
  if (LESSON_BADGES[slug]) badges.push(LESSON_BADGES[slug]);
  if (slug === "soil-texture" && correct === total) badges.push("texture-master");
  for (const [unit, badge] of Object.entries(UNIT_BADGES)) {
    const inUnit = lessons.filter((l) => l.unit === Number(unit));
    if (inUnit.length > 0 && inUnit.every((l) => completedLessons.includes(l.slug))) badges.push(badge);
  }
  if (lessons.length > 0 && lessons.every((l) => completedLessons.includes(l.slug))) badges.push("soil-scholar");
  return award(next, badges);
}

export function setGradeLevel(data: ProgressData, gradeLevel: Level): Update {
  return { data: { ...data, gradeLevel }, newBadges: [] };
}

export function visitRegion(data: ProgressData, regionId: string): Update {
  if (data.visitedRegions.includes(regionId)) return { data, newBadges: [] };
  const visitedRegions = [...data.visitedRegions, regionId];
  const next = { ...data, visitedRegions, xp: data.xp + REGION_XP };
  const badges: BadgeId[] = ["globe-trotter"];
  if (visitedRegions.length >= 10) badges.push("soil-explorer");
  return award(next, badges);
}

export function answerGlobeQuiz(data: ProgressData, correct: boolean): Update {
  if (!correct) return { data, newBadges: [] };
  const globeQuizCorrect = data.globeQuizCorrect + 1;
  const next = { ...data, globeQuizCorrect, xp: data.xp + GLOBE_QUIZ_XP };
  return award(next, globeQuizCorrect >= 10 ? ["world-soil-expert"] : []);
}

export const JOURNAL_XP = 15;
export const FIRST_HARVEST_XP = 40;
export const RESTORER_HEALTH = 70;

/** Sync what happened on the farm. XP is paid once per new journal page and for the first harvest. */
export function recordFarm(data: ProgressData, farm: { journal: string[]; harvests: number; bestSoilHealth: number }): Update {
  const fresh = farm.journal.filter((id) => !data.natureFound.includes(id));
  const firstHarvest = data.farmHarvests === 0 && farm.harvests > 0;
  const bestSoilHealth = Math.max(data.bestSoilHealth, farm.bestSoilHealth);
  if (!fresh.length && !firstHarvest && bestSoilHealth === data.bestSoilHealth && farm.harvests <= data.farmHarvests) {
    return { data, newBadges: [] };
  }
  const natureFound = [...data.natureFound, ...fresh];
  const next: ProgressData = {
    ...data,
    natureFound,
    farmHarvests: Math.max(data.farmHarvests, farm.harvests),
    bestSoilHealth,
    xp: data.xp + fresh.length * JOURNAL_XP + (firstHarvest ? FIRST_HARVEST_XP : 0),
  };
  const badges: BadgeId[] = [];
  if (next.farmHarvests > 0) badges.push("first-harvest");
  if (bestSoilHealth >= RESTORER_HEALTH) badges.push("field-restorer");
  if (natureFound.length >= 1) badges.push("naturalist");
  if (natureFound.length >= 15) badges.push("master-naturalist");
  return award(next, badges);
}

export function viewElement(data: ProgressData, z: number): Update {
  if (data.viewedElements.includes(z)) return { data, newBadges: [] };
  const viewedElements = [...data.viewedElements, z];
  const next = { ...data, viewedElements, xp: data.xp + ELEMENT_XP };
  const badges: BadgeId[] = ["element-spotter"];
  if (viewedElements.length >= 25) badges.push("lab-regular");
  if (viewedElements.length >= TOTAL_ELEMENTS) badges.push("table-master");
  if (SOIL_BUILDER_ZS.every((s) => viewedElements.includes(s))) badges.push("soil-chemist");
  return award(next, badges);
}
