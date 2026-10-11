"use client";

import { useState } from "react";
import type { HandsOnActivity } from "@/content/soil/curriculum/types";
import { SOURCES, type SourceId } from "@/content/soil/sources";

export function VocabCards({ vocab }: { vocab: { term: string; def: string }[] }) {
  const [open, setOpen] = useState<number[]>([]);
  return (
    <section aria-label="Vocabulary" className="space-y-2">
      <h2 className="text-xl font-black">📚 Words to know</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {vocab.map((v, i) => {
          const shown = open.includes(i);
          return (
            <li key={v.term}>
              <button
                onClick={() => setOpen(shown ? open.filter((x) => x !== i) : [...open, i])}
                aria-expanded={shown}
                className={`h-full w-full rounded-xl border-2 p-3 text-left transition ${shown ? "border-leaf bg-leaf-light" : "border-line bg-white hover:border-leaf"}`}
              >
                <div className="font-black">{v.term}</div>
                <div className={`text-sm ${shown ? "" : "text-muted"}`}>{shown ? v.def : "Tap to see what it means"}</div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ActivityCard({ activity }: { activity: HandsOnActivity }) {
  return (
    <section aria-label="Hands-on activity" className="card space-y-3 border-2 border-sun/60 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-black">🧪 Try it yourself: {activity.title}</h2>
        <span className="rounded-full bg-sun/20 px-2.5 py-0.5 text-xs font-bold">⏱ {activity.time}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-muted">You need</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {activity.materials.map((m) => <li key={m}>{m}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-muted">Steps</h3>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
            {activity.steps.map((s) => <li key={s}>{s}</li>)}
          </ol>
        </div>
      </div>
      <p className="rounded-xl bg-paper p-3 text-sm"><strong>👀 Look for:</strong> {activity.lookFor}</p>
      {activity.safety && <p className="rounded-xl bg-danger/10 p-3 text-sm text-danger"><strong>⚠️ Safety:</strong> {activity.safety}</p>}
    </section>
  );
}

export function SourceTag({ id }: { id: SourceId }) {
  const s = SOURCES[id];
  return (
    <span className="mt-1 inline-block text-xs text-muted">
      Source:{" "}
      {s.url ? (
        <a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-dotted hover:text-ink">{s.org}</a>
      ) : (
        s.org
      )}
    </span>
  );
}

export function SourcesAndStandards({ sources, standards }: { sources: SourceId[]; standards: string[] }) {
  return (
    <section aria-label="Sources and standards" className="space-y-3 rounded-2xl border border-line bg-card p-5 text-sm">
      <h2 className="text-lg font-black">📖 Sources</h2>
      <ul className="space-y-1.5">
        {sources.map((id) => {
          const s = SOURCES[id];
          return (
            <li key={id}>
              <span className="font-semibold">{s.org}</span> ({s.year}).{" "}
              {s.url ? <a href={s.url} target="_blank" rel="noreferrer" className="italic underline decoration-dotted">{s.title}</a> : <em>{s.title}</em>}
            </li>
          );
        })}
      </ul>
      <div>
        <span className="font-black">Next Generation Science Standards: </span>
        {standards.map((c) => (
          <span key={c} className="mr-1.5 inline-block rounded-full bg-sky/10 px-2 py-0.5 font-mono text-xs font-bold text-sky">{c}</span>
        ))}
      </div>
    </section>
  );
}
