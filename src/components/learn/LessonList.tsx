"use client";

import Link from "next/link";
import { CURRICULUM, lessonsInUnit, UNITS, LEVEL_INFO } from "@/content/soil/curriculum";
import { useProgress } from "@/store/progress";
import { quizKey } from "@/store/progressLogic";
import { LevelTabs } from "../GradeSelector";

function Ring({ done, total }: { done: number; total: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  return (
    <svg viewBox="0 0 44 44" className="h-12 w-12 shrink-0" aria-label={`${done} of ${total} lessons done`}>
      <circle cx="22" cy="22" r={r} fill="none" stroke="#e3d6c1" strokeWidth="5" />
      <circle
        cx="22" cy="22" r={r} fill="none" stroke="#3f7d4e" strokeWidth="5" strokeLinecap="round"
        strokeDasharray={`${pct * c} ${c}`} transform="rotate(-90 22 22)"
      />
      <text x="22" y="26" textAnchor="middle" className="fill-ink text-[11px] font-black">{done}/{total}</text>
    </svg>
  );
}

export function LessonList() {
  const done = useProgress((s) => s.completedLessons);
  const scores = useProgress((s) => s.quizScores);
  const level = useProgress((s) => s.gradeLevel);
  const totalDone = CURRICULUM.filter((l) => done.includes(l.slug)).length;

  return (
    <div className="space-y-8">
      <section className="card space-y-3 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-black">Choose your level</h2>
          <span className="text-sm font-semibold text-muted">
            {totalDone} of {CURRICULUM.length} lessons done · switch any time
          </span>
        </div>
        <LevelTabs />
        <p className="text-xs text-muted">
          Every level covers the same big ideas. {LEVEL_INFO[level].label} lessons go {level === "elementary" ? "step by step with lots of hands-on fun" : level === "middle" ? "deeper, with models and numbers" : "deepest, with mechanisms, data, and real-world problems"}.
        </p>
      </section>

      {UNITS.map((unit) => {
        const lessons = lessonsInUnit(unit.number);
        if (lessons.length === 0) return null;
        const unitDone = lessons.filter((l) => done.includes(l.slug)).length;
        return (
          <section key={unit.number} aria-labelledby={`unit-${unit.number}`}>
            <div className="mb-3 flex items-center gap-3">
              <Ring done={unitDone} total={lessons.length} />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-leaf">Unit {unit.number} · {unit.pacing}</div>
                <h2 id={`unit-${unit.number}`} className="text-2xl font-black">{unit.icon} {unit.title}</h2>
                <p className="text-sm text-muted">{unit.blurb}</p>
              </div>
            </div>
            <ol className="grid gap-3 md:grid-cols-2">
              {lessons.map((l) => {
                const complete = done.includes(l.slug);
                const score = scores[quizKey(l.slug, level)];
                const c = l.levels[level];
                return (
                  <li key={l.slug}>
                    <Link href={`/soil/learn/${l.slug}`} className="card flex h-full gap-4 p-4 transition hover:-translate-y-0.5">
                      <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl ${complete ? "bg-leaf-light" : "bg-paper"}`}>{l.icon}</div>
                      <div className="flex-1">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted">{c.minutes} min · {LEVEL_INFO[level].label}</div>
                        <h3 className="text-lg font-black leading-tight">{l.title}</h3>
                        <p className="text-sm text-muted">{c.summary}</p>
                        {complete && (
                          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-leaf-light px-2.5 py-0.5 text-xs font-bold text-leaf">
                            ✓ Done{score ? ` · best quiz ${score.correct}/${score.total}` : ""}
                          </div>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
