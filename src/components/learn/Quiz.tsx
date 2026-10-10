"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/content/soil/lessons";
import { useProgress } from "@/store/progress";
import { QUIZ_XP_PER_CORRECT } from "@/store/progressLogic";

export function Quiz({ slug, questions }: { slug: string; questions: QuizQuestion[] }) {
  const completeLesson = useProgress((s) => s.completeLesson);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[index];

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setCorrect((c) => c + 1);
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
    } else {
      setFinished(true);
      completeLesson(slug, correct, questions.length);
    }
  }

  function restart() {
    setIndex(0);
    setPicked(null);
    setCorrect(0);
    setFinished(false);
  }

  if (finished) {
    const perfect = correct === questions.length;
    return (
      <section className="card animate-pop-in p-6 text-center">
        <div className="text-6xl">{perfect ? "🏆" : correct >= questions.length / 2 ? "🌱" : "🪱"}</div>
        <h2 className="mt-2 text-2xl font-black">
          You got {correct} of {questions.length}!
        </h2>
        <p className="mt-1 text-muted">
          {perfect ? "Perfect score. You really dig soil!" : "Nice work. Try again any time to beat your best score."}
        </p>
        <p className="mt-2 text-sm font-semibold text-leaf">
          Lesson XP is earned once, plus {QUIZ_XP_PER_CORRECT} XP for each new correct answer.
        </p>
        {!perfect && (
          <button onClick={restart} className="btn btn-ghost mt-4">
            Retake quiz
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black">📝 Quiz</h2>
        <span className="text-sm font-bold text-muted">
          {index + 1} / {questions.length}
        </span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-line">
        <div className="h-full bg-sun transition-all" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
      <p className="text-lg font-bold">{q.prompt}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {q.options.map((opt, i) => {
          const state =
            picked === null ? "idle" : i === q.answer ? "right" : i === picked ? "wrong" : "dim";
          return (
            <button
              key={opt}
              onClick={() => choose(i)}
              disabled={picked !== null}
              className={`rounded-xl border-2 px-4 py-3 text-left font-semibold transition ${
                state === "idle" ? "border-line bg-white hover:border-leaf" :
                state === "right" ? "border-leaf bg-leaf-light" :
                state === "wrong" ? "border-danger bg-danger/10" : "border-line bg-white opacity-50"
              }`}
            >
              {state === "right" && "✓ "}
              {state === "wrong" && "✗ "}
              {opt}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="animate-pop-in mt-4 flex flex-col gap-3 rounded-xl bg-paper p-4 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <strong>{picked === q.answer ? "Correct! " : "Not quite. "}</strong>
            {q.explain}
          </p>
          <button onClick={next} className="btn btn-primary shrink-0">
            {index + 1 < questions.length ? "Next →" : "Finish"}
          </button>
        </div>
      )}
    </section>
  );
}
