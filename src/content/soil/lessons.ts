/**
 * Lightweight list of soil lessons for places that only need titles and links.
 * The full leveled curriculum lives in ./curriculum.
 */
import { CURRICULUM } from "./curriculum";

export interface LessonSummary {
  slug: string;
  title: string;
  icon: string;
  unit: number;
}

export const LESSONS: LessonSummary[] = CURRICULUM.map((l) => ({ slug: l.slug, title: l.title, icon: l.icon, unit: l.unit }));

export function getLesson(slug: string): LessonSummary | undefined {
  return LESSONS.find((l) => l.slug === slug);
}
