"use client";

import Link from "next/link";
import { LESSONS } from "@/content/soil/lessons";
import { useProgress } from "@/store/progress";

export function LessonList() {
  const done = useProgress((s) => s.completedLessons);
  const scores = useProgress((s) => s.quizScores);
  return (
    <ol className="grid gap-4 md:grid-cols-2">
      {LESSONS.map((l, i) => {
        const complete = done.includes(l.slug);
        const score = scores[l.slug];
        return (
          <li key={l.slug}>
            <Link href={`/soil/learn/${l.slug}`} className="card flex h-full gap-4 p-5 transition hover:-translate-y-0.5">
              <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-3xl ${complete ? "bg-leaf-light" : "bg-paper"}`}>
                {l.icon}
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-wider text-muted">
                  Lesson {i + 1} · {l.minutes} min
                </div>
                <h2 className="text-lg font-black">{l.title}</h2>
                <p className="text-sm text-muted">{l.summary}</p>
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
  );
}
