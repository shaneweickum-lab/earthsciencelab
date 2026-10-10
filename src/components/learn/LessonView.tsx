"use client";

import Link from "next/link";
import { getLesson, LESSONS } from "@/content/soil/lessons";
import { Interactive } from "./Interactive";
import { Quiz } from "./Quiz";

export function LessonView({ slug }: { slug: string }) {
  const lesson = getLesson(slug)!;
  const index = LESSONS.findIndex((l) => l.slug === slug);
  const next = LESSONS[index + 1];

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/soil/learn" className="text-sm font-bold text-muted hover:text-ink">
          ← All lessons
        </Link>
        <div className="mt-3 flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-card text-4xl shadow-sm">{lesson.icon}</div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-leaf">
              Lesson {index + 1} of {LESSONS.length}
            </div>
            <h1 className="font-display text-3xl font-black sm:text-4xl">{lesson.title}</h1>
          </div>
        </div>
        <p className="mt-3 text-lg text-muted">{lesson.summary}</p>
      </div>

      {lesson.sections.map((s) => (
        <section key={s.heading} className="space-y-3">
          <h2 className="text-2xl font-black">{s.heading}</h2>
          {s.body.map((p, i) => (
            <p key={i} className="text-[17px] leading-relaxed">
              {p}
            </p>
          ))}
          {s.callout && (
            <aside className="rounded-2xl border-l-4 border-sun bg-sun/10 p-4">
              <div className="font-black">💡 {s.callout.title}</div>
              <p className="mt-1">{s.callout.text}</p>
            </aside>
          )}
        </section>
      ))}

      <section className="card space-y-3 p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-sky">Try it</div>
        <h2 className="text-2xl font-black">{lesson.interactive.title}</h2>
        <p className="text-muted">{lesson.interactive.intro}</p>
        <Interactive type={lesson.interactive.type} />
      </section>

      <Quiz slug={lesson.slug} questions={lesson.quiz} />

      <nav className="flex justify-between gap-3">
        <Link href="/soil/learn" className="btn btn-ghost">
          All lessons
        </Link>
        {next ? (
          <Link href={`/soil/learn/${next.slug}`} className="btn btn-soil">
            Next: {next.title} →
          </Link>
        ) : (
          <Link href="/soil/game" className="btn btn-primary">
            Play Regenerate the Field →
          </Link>
        )}
      </nav>
    </article>
  );
}
