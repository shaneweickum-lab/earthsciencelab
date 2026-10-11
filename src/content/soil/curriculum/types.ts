import type { SourceId } from "../sources";

export type Level = "elementary" | "middle" | "high";

export const LEVELS: Level[] = ["elementary", "middle", "high"];

export const LEVEL_INFO: Record<Level, { label: string; grades: string; icon: string; short: string }> = {
  elementary: { label: "Elementary", grades: "K-5", icon: "🌱", short: "Elem" },
  middle: { label: "Middle School", grades: "6-8", icon: "🌿", short: "Middle" },
  high: { label: "High School", grades: "9-12", icon: "🌳", short: "High" },
};

export type InteractiveType =
  | "soil-pie"
  | "texture-triangle"
  | "soil-profile"
  | "health-sort"
  | "erosion-sim"
  | "principles"
  | "formation-timeline"
  | "food-web"
  | "carbon-cycle"
  | "nitrogen-cycle"
  | "ph-scale"
  | "color-chart"
  | "soil-orders";

export interface QuizQuestion {
  prompt: string;
  options: string[];
  /** Index into options. */
  answer: number;
  explain: string;
}

export interface LessonSection {
  heading: string;
  body: string[];
  callout?: { title: string; text: string };
  /** The source this section's facts come from. */
  source?: SourceId;
}

export interface HandsOnActivity {
  title: string;
  /** Roughly how long it takes, e.g. "20 minutes" or "1 week of observations". */
  time: string;
  materials: string[];
  steps: string[];
  /** What students should notice or record. */
  lookFor: string;
  safety?: string;
}

export interface LevelContent {
  minutes: number;
  /** One or two sentences that hook the student. */
  summary: string;
  /** "I can…" statements. */
  objectives: string[];
  vocab: { term: string; def: string }[];
  sections: LessonSection[];
  activity: HandsOnActivity;
  quiz: QuizQuestion[];
}

export interface CurriculumLesson {
  slug: string;
  unit: number;
  title: string;
  icon: string;
  /** The one idea every level shares. */
  bigIdea: string;
  interactive?: { type: InteractiveType; title: string; intro: string };
  sources: SourceId[];
  standards: Record<Level, string[]>;
  levels: Record<Level, LevelContent>;
}

export interface Unit {
  number: number;
  title: string;
  icon: string;
  /** Short description for students. */
  blurb: string;
  /** Driving question for the unit, shown to teachers and students. */
  drivingQuestion: string;
  /** Suggested pacing for teachers. */
  pacing: string;
}
