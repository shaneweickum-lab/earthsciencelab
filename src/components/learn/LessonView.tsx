"use client";

import Link from "next/link";
import { CURRICULUM, getCurriculumLesson, LEVEL_INFO, UNITS } from "@/content/soil/curriculum";
import { useProgress } from "@/store/progress";
import { LevelTabs } from "../GradeSelector";
import { linkElements } from "../elements/linkElements";
import { Interactive } from "./Interactive";
import { ActivityCard, SourcesAndStandards, SourceTag, VocabCards } from "./LessonParts";
import { Quiz } from "./Quiz";

export function LessonView({ slug }: { slug: string }) {
  const level = useProgress((s) => s.gradeLevel);
  const lesson = getCurriculumLesson(slug)!;
  const index = CURRICULUM.findIndex((l) => l.slug === slug);
  const next = CURRICULUM[index + 1];
  const unit = UNITS.find((u) => u.number === lesson.unit)!;
  const c = lesson.levels[level];

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/soil/learn" className="text-sm font-bold text-muted hover:text-ink">
          ← All lessons
        </Link>
        <div className="mt-3 flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-card text-4xl shadow-sm">{lesson.icon}</div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-leaf">
              Unit {unit.number}: {unit.title} · Lesson {index + 1} of {CURRICULUM.length} · {c.minutes} min
            </div>
            <h1 className="font-display text-3xl font-black sm:text-4xl">{lesson.title}</h1>
          </div>
        </div>
        <p className="mt-3 text-lg text-muted">{c.summary}</p>
      </div>

      <details className="card p-4" open={false}>
        <summary className="cursor-pointer font-bold">
          🎒 Reading at the <span className="text-leaf">{LEVEL_INFO[level].label} ({LEVEL_INFO[level].grades})</span> level. Tap to change.
        </summary>
        <div className="mt-3"><LevelTabs /></div>
      </details>

      <section className="rounded-2xl bg-leaf-light p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-leaf">Big idea</div>
        <p className="mt-1 text-lg font-bold">{lesson.bigIdea}</p>
        <div className="mt-3 text-xs font-bold uppercase tracking-wider text-leaf">By the end, you can say…</div>
        <ul className="mt-1 space-y-1">
          {c.objectives.map((o) => <li key={o} className="flex gap-2"><span>✅</span><span>{o}</span></li>)}
        </ul>
      </section>

      <VocabCards key={`v-${level}`} vocab={c.vocab} />

      {c.sections.map((s) => (
        <section key={s.heading} className="space-y-3">
          <h2 className="text-2xl font-black">{s.heading}</h2>
          {s.body.map((p, i) => (
            <p key={i} className="text-[17px] leading-relaxed">{linkElements(p)}</p>
          ))}
          {s.callout && (
            <aside className="rounded-2xl border-l-4 border-sun bg-sun/10 p-4">
              <div className="font-black">💡 {s.callout.title}</div>
              <p className="mt-1">{s.callout.text}</p>
            </aside>
          )}
          {s.source && <SourceTag id={s.source} />}
        </section>
      ))}

      {lesson.interactive && (
        <section className="card space-y-3 p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-sky">Explore</div>
          <h2 className="text-2xl font-black">{lesson.interactive.title}</h2>
          <p className="text-muted">{lesson.interactive.intro}</p>
          <Interactive type={lesson.interactive.type} level={level} />
        </section>
      )}

      <ActivityCard activity={c.activity} />

      <Quiz key={`q-${slug}-${level}`} slug={lesson.slug} level={level} questions={c.quiz} />

      <SourcesAndStandards sources={lesson.sources} standards={lesson.standards[level]} />

      <nav className="flex justify-between gap-3">
        <Link href="/soil/learn" className="btn btn-ghost">All lessons</Link>
        {next ? (
          <Link href={`/soil/learn/${next.slug}`} className="btn btn-soil">Next: {next.title} →</Link>
        ) : (
          <Link href="/soil/game" className="btn btn-primary">Play Regenerate the Field →</Link>
        )}
      </nav>
    </article>
  );
}
