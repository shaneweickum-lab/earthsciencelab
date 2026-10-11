"use client";

import Link from "next/link";
import { useState } from "react";
import { lessonsInUnit, LEVEL_INFO, LEVELS, UNITS, type Level } from "@/content/soil/curriculum";
import { SOURCES } from "@/content/soil/sources";

export function TeacherGuide() {
  const [level, setLevel] = useState<Level>("middle");
  return (
    <div className="space-y-8">
      <header className="space-y-2 print:hidden">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-clay">For teachers & families</p>
        <h1 className="font-display text-4xl font-black">Soil Science Teacher Guide</h1>
        <p className="max-w-2xl text-muted">
          Five units and sixteen lessons, each written at three levels with the same big ideas. Every lesson cites its sources, lists Next Generation Science Standards, and includes a hands-on activity. Print this page for a unit plan.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold">Show plans for:</span>
          {LEVELS.map((l) => (
            <button key={l} onClick={() => setLevel(l)} aria-pressed={level === l}
              className={`rounded-full border-2 px-3 py-1 text-sm font-bold ${level === l ? "border-leaf bg-leaf-light" : "border-line bg-card"}`}>
              {LEVEL_INFO[l].icon} {LEVEL_INFO[l].label} ({LEVEL_INFO[l].grades})
            </button>
          ))}
          <button onClick={() => window.print()} className="btn btn-ghost ml-auto px-3 py-1 text-sm">🖨️ Print</button>
          <Link href="/soil/sources" className="btn btn-ghost px-3 py-1 text-sm">📖 All sources</Link>
        </div>
      </header>

      <h2 className="hidden text-2xl font-black print:block">Soil Science · {LEVEL_INFO[level].label} ({LEVEL_INFO[level].grades})</h2>

      {UNITS.map((unit) => {
        const lessons = lessonsInUnit(unit.number);
        const standards = [...new Set(lessons.flatMap((l) => l.standards[level]))];
        return (
          <section key={unit.number} className="card space-y-4 p-5 print:break-inside-avoid print:shadow-none">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-leaf">Unit {unit.number} · {unit.pacing}</div>
              <h2 className="text-2xl font-black">{unit.icon} {unit.title}</h2>
              <p className="mt-1"><strong>Driving question:</strong> {unit.drivingQuestion}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {standards.map((c) => <span key={c} className="rounded-full bg-sky/10 px-2 py-0.5 font-mono text-xs font-bold text-sky">{c}</span>)}
              </div>
            </div>
            <ol className="space-y-4">
              {lessons.map((l) => {
                const c = l.levels[level];
                return (
                  <li key={l.slug} className="rounded-xl border border-line bg-white p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-lg font-black">{l.icon} {l.title}</h3>
                      <span className="text-xs font-bold text-muted">{c.minutes} min reading · activity {c.activity.time}</span>
                    </div>
                    <p className="text-sm italic">{l.bigIdea}</p>
                    <div className="mt-2 grid gap-3 text-sm md:grid-cols-2">
                      <div>
                        <div className="font-black">Objectives</div>
                        <ul className="list-disc pl-5">{c.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
                        <div className="mt-2 font-black">Vocabulary</div>
                        <p>{c.vocab.map((v) => v.term).join(" · ")}</p>
                      </div>
                      <div>
                        <div className="font-black">Hands-on: {c.activity.title}</div>
                        <p><strong>Materials:</strong> {c.activity.materials.join("; ")}</p>
                        <ol className="list-decimal pl-5">{c.activity.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                        {c.activity.safety && <p className="text-danger"><strong>Safety:</strong> {c.activity.safety}</p>}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted">
                      Standards: {l.standards[level].join(", ")} · Sources: {[...new Set(l.sources.map((s) => SOURCES[s].org.split(",")[0]))].join("; ")}
                      <Link href={`/soil/learn/${l.slug}`} className="ml-2 font-bold text-sky underline print:hidden">Open lesson</Link>
                    </div>
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
