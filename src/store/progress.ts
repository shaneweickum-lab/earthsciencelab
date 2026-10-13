"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CURRICULUM, type Level } from "@/content/soil/curriculum";
import { BADGES, type BadgeId } from "./badges";
import * as logic from "./progressLogic";

interface ProgressStore extends logic.ProgressData {
  /** Badges waiting to be shown as toasts. Not saved. */
  toasts: BadgeId[];
  completeLesson: (slug: string, level: Level, correct: number, total: number) => void;
  setGradeLevel: (level: Level) => void;
  visitRegion: (id: string) => void;
  answerGlobeQuiz: (correct: boolean) => void;
  recordFarm: (farm: { journal: string[]; harvests: number; bestSoilHealth: number }) => void;
  viewElement: (z: number) => void;
  dismissToast: () => void;
  reset: () => void;
}

const lessonList = CURRICULUM.map((l) => ({ slug: l.slug, unit: l.unit }));

export const useProgress = create<ProgressStore>()(
  persist(
    (set, get) => {
      const run = (fn: (d: logic.ProgressData) => logic.Update) => {
        const { toasts, ...rest } = get();
        const { data, newBadges } = fn(pickData(rest));
        set({ ...data, toasts: [...toasts, ...newBadges] });
      };
      return {
        ...logic.EMPTY_PROGRESS,
        toasts: [],
        completeLesson: (slug, level, correct, total) =>
          run((d) => logic.completeLesson(d, slug, level, correct, total, lessonList)),
        setGradeLevel: (level) => run((d) => logic.setGradeLevel(d, level)),
        visitRegion: (id) => run((d) => logic.visitRegion(d, id)),
        answerGlobeQuiz: (correct) => run((d) => logic.answerGlobeQuiz(d, correct)),
        recordFarm: (farm) => run((d) => logic.recordFarm(d, farm)),
        viewElement: (z) => run((d) => logic.viewElement(d, z)),
        dismissToast: () => set((s) => ({ toasts: s.toasts.slice(1) })),
        reset: () => set({ ...logic.EMPTY_PROGRESS, toasts: [] }),
      };
    },
    {
      name: "earthsciencelab-progress",
      version: 4,
      // v2 added viewedElements; v4 replaced the old turn-based game's stats with Soil & Sprout's.
      // Fill in any new fields with defaults and drop badges that no longer exist.
      migrate: (saved) => {
        const data = { ...logic.EMPTY_PROGRESS, ...(saved as Partial<logic.ProgressData>) };
        return { ...data, badges: data.badges.filter((b) => b in BADGES) };
      },
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => pickData(s),
      // Rehydrated manually after mount so the server and first client render match.
      skipHydration: true,
    },
  ),
);

function pickData(s: logic.ProgressData): logic.ProgressData {
  return {
    xp: s.xp,
    completedLessons: s.completedLessons,
    quizScores: s.quizScores,
    badges: s.badges,
    visitedRegions: s.visitedRegions,
    globeQuizCorrect: s.globeQuizCorrect,
    natureFound: s.natureFound,
    farmHarvests: s.farmHarvests,
    bestSoilHealth: s.bestSoilHealth,
    viewedElements: s.viewedElements,
    gradeLevel: s.gradeLevel,
  };
}
