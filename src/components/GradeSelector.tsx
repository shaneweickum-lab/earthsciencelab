"use client";

import { LEVEL_INFO, LEVELS, type Level } from "@/content/soil/curriculum/types";
import { useProgress } from "@/store/progress";

/** Site-wide grade level. Lessons and quizzes change depth to match. */
export function GradeSelector({ compact = false }: { compact?: boolean }) {
  const level = useProgress((s) => s.gradeLevel);
  const setLevel = useProgress((s) => s.setGradeLevel);
  return (
    <label className="flex items-center gap-1.5 text-sm font-bold" title="Choose your grade level. Lessons and quizzes change to match.">
      <span aria-hidden>🎒</span>
      <span className="sr-only">Grade level</span>
      <select
        aria-label="Grade level"
        value={level}
        onChange={(e) => setLevel(e.target.value as Level)}
        className="rounded-full border-2 border-line bg-card px-2 py-1 text-sm font-bold hover:border-leaf focus:border-leaf focus:outline-none"
      >
        {LEVELS.map((l) => (
          <option key={l} value={l}>
            {compact ? `${LEVEL_INFO[l].short} (${LEVEL_INFO[l].grades})` : `${LEVEL_INFO[l].label} (${LEVEL_INFO[l].grades})`}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Big tabs for picking a level, shown at the top of the learn pages. */
export function LevelTabs() {
  const level = useProgress((s) => s.gradeLevel);
  const setLevel = useProgress((s) => s.setGradeLevel);
  return (
    <div role="radiogroup" aria-label="Grade level" className="grid grid-cols-3 gap-2">
      {LEVELS.map((l) => (
        <button
          key={l}
          role="radio"
          aria-checked={level === l}
          onClick={() => setLevel(l)}
          className={`rounded-2xl border-2 px-3 py-2 text-left transition ${
            level === l ? "border-leaf bg-leaf-light" : "border-line bg-card hover:border-leaf"
          }`}
        >
          <div className="text-xl">{LEVEL_INFO[l].icon}</div>
          <div className="text-sm font-black leading-tight">{LEVEL_INFO[l].label}</div>
          <div className="text-xs font-semibold text-muted">Grades {LEVEL_INFO[l].grades}</div>
        </button>
      ))}
    </div>
  );
}
