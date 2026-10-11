"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CURRICULUM, type Level } from "@/content/soil/curriculum";
import type { BadgeId } from "./badges";
import * as logic from "./progressLogic";

interface ProgressStore extends logic.ProgressData {
  /** Badges waiting to be shown as toasts. Not saved. */
  toasts: BadgeId[];
  completeLesson: (slug: string, level: Level, correct: number, total: number) => void;
  setGradeLevel: (level: Level) => void;
  visitRegion: (id: string) => void;
  answerGlobeQuiz: (correct: boolean) => void;
  finishGame: (stars: number, health: number) => void;
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
        finishGame: (stars, health) => run((d) => logic.finishGame(d, stars, health)),
        viewElement: (z) => run((d) => logic.viewElement(d, z)),
        dismissToast: () => set((s) => ({ toasts: s.toasts.slice(1) })),
        reset: () => set({ ...logic.EMPTY_PROGRESS, toasts: [] }),
      };
    },
    {
      name: "earthsciencelab-progress",
      version: 3,
      // v2 added viewedElements. Fill in any new fields with defaults.
      migrate: (saved) => ({ ...logic.EMPTY_PROGRESS, ...(saved as Partial<logic.ProgressData>) }),
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
    bestGameStars: s.bestGameStars,
    bestGameHealth: s.bestGameHealth,
    gamesPlayed: s.gamesPlayed,
    viewedElements: s.viewedElements,
    gradeLevel: s.gradeLevel,
  };
}
