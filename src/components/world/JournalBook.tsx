"use client";

import Link from "next/link";
import { useState } from "react";
import { GradeSelector } from "@/components/GradeSelector";
import { getCurriculumLesson } from "@/content/soil/curriculum";
import { CATEGORY_INFO, JOURNAL, journalEntry, MUSHROOM_SAFETY, type JournalCategory } from "@/world/journal";
import { useProgress } from "@/store/progress";
import { Modal } from "./Menus";
import { useWorld } from "./useWorld";

export function JournalBook() {
  const found = useWorld((s) => s.world!.journal);
  const close = useWorld((s) => s.close);
  const level = useProgress((s) => s.gradeLevel);
  const [open, setOpen] = useState<string | null>(found[found.length - 1] ?? null);
  const entry = open ? journalEntry(open) : undefined;
  const cats = Object.keys(CATEGORY_INFO) as JournalCategory[];
  const lesson = entry?.lesson ? getCurriculumLesson(entry.lesson) : undefined;
  return (
    <Modal title={`Nature Journal · ${found.length}/${JOURNAL.length} pages`} icon="📓" onClose={close} wide>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          {cats.map((c) => (
            <div key={c}>
              <p className="mb-1 text-xs font-black uppercase tracking-wider text-muted">{CATEGORY_INFO[c].icon} {CATEGORY_INFO[c].label}</p>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                {JOURNAL.filter((e) => e.category === c).map((e) => {
                  const has = found.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      onClick={() => setOpen(e.id)}
                      title={has ? e.name : `Not found yet. ${e.hint}`}
                      aria-label={has ? e.name : "Undiscovered page"}
                      className={`grid aspect-square place-items-center rounded-xl text-2xl transition ${
                        open === e.id ? "ring-2 ring-soil" : ""
                      } ${has ? "bg-leaf-light hover:bg-white" : "bg-paper text-muted hover:bg-white"}`}
                    >
                      {has ? e.icon : "?"}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-[#fdf6e3] p-4 shadow-inner">
          {!entry ? (
            <p className="text-muted">Explore the farm, the forest edge, and the pond. Press Space next to a creature to add it to your journal.</p>
          ) : !found.includes(entry.id) ? (
            <div className="space-y-2">
              <p className="font-display text-xl font-black text-muted">??? Undiscovered</p>
              <p className="text-sm"><b>Hint:</b> {entry.hint}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-5xl" aria-hidden>{entry.icon}</span>
                <div>
                  <p className="font-display text-2xl font-black">{entry.name}</p>
                  <p className="text-xs font-bold uppercase text-muted">{CATEGORY_INFO[entry.category].label}</p>
                </div>
              </div>
              <p className="leading-relaxed">{entry.fact[level]}</p>
              {entry.category === "fungus" && entry.id !== "mycorrhizae" && (
                <p className="rounded-lg bg-danger/10 p-2 text-sm font-bold text-danger">⚠️ {MUSHROOM_SAFETY}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <GradeSelector compact />
                {lesson && (
                  <Link href={`/soil/learn/${lesson.slug}`} className="font-bold text-leaf underline">
                    📖 Lesson: {lesson.title}
                  </Link>
                )}
              </div>
              <p className="text-[11px] text-muted">
                Source: <a href={entry.source.url} target="_blank" rel="noreferrer" className="underline">{entry.source.org}</a>
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
