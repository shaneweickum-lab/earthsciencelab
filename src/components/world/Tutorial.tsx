"use client";

import { useState } from "react";
import { tutorialStep } from "@/world/quests";
import { useWorld } from "./useWorld";

/** Grandma Rosa's note for the lesson you're on: what to do, how, and the reward to claim. */
export function TutorialCard() {
  const w = useWorld((s) => s.world!);
  const run = useWorld((s) => s.run);
  const [open, setOpen] = useState(true);
  const [skipping, setSkipping] = useState(false);
  const step = tutorialStep(w);
  if (!step) return null;
  const { have, need, done } = step.progress;
  return (
    <section className="pointer-events-auto w-72 max-w-[60vw] rounded-2xl border-2 border-sun/70 bg-card/95 p-3 text-sm shadow-lg" aria-label="Grandma's note">
      <button className="flex w-full items-center gap-2 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span aria-hidden>✉️</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-black uppercase tracking-wider text-muted">Grandma&apos;s lesson {step.number} of {step.of}</span>
          <span className="block truncate font-black">{step.title}</span>
        </span>
        <span className="text-xs text-muted">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <p className="font-serif leading-snug">{step.ask}</p>
          <p className="rounded-lg bg-paper px-2 py-1 text-xs text-muted">💡 {step.hint}</p>
          <div>
            <p className="text-xs font-bold">{step.step.label}</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={have} aria-valuemax={need} aria-label="Lesson progress">
                <div className={`h-full ${done ? "bg-leaf" : "bg-sun"}`} style={{ width: `${(have / need) * 100}%` }} />
              </div>
              <span className="text-xs font-black tabular-nums">{have}/{need}</span>
            </div>
          </div>
          {done ? (
            <button className="btn btn-primary w-full animate-pulse text-sm" onClick={() => run("claimLesson")}>
              {step.rewardText ? `Claim: ${step.rewardText}` : "Next lesson"}
            </button>
          ) : step.rewardText ? (
            <p className="text-xs text-muted">Reward: {step.rewardText}</p>
          ) : null}
          {skipping ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="flex-1">Skip the lessons and take all of Grandma&apos;s tools now?</span>
              <button className="btn btn-soil px-2 py-1 text-xs" onClick={() => run("skipTutorial")}>Skip</button>
              <button className="btn btn-ghost px-2 py-1 text-xs" onClick={() => setSkipping(false)}>Keep going</button>
            </div>
          ) : (
            <button className="text-[11px] font-semibold text-muted underline" onClick={() => setSkipping(true)}>Skip tutorial</button>
          )}
        </div>
      )}
    </section>
  );
}
