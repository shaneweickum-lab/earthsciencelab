import Link from "next/link";
import { LessonList } from "@/components/learn/LessonList";

export default function LearnPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-leaf">Learn</p>
        <h1 className="font-display text-4xl font-black">Soil Science Curriculum</h1>
        <p className="mt-1 max-w-2xl text-muted">
          Five units, from what soil is made of to how we can protect it. Every lesson has a hands-on activity and a quiz, and cites the
          trusted science sources it is built on. Pick your grade level and dig in!
        </p>
        <div className="mt-2 flex gap-3 text-sm font-bold">
          <Link href="/soil/teach" className="text-sky underline">👩‍🏫 Teacher guide</Link>
          <Link href="/soil/sources" className="text-sky underline">📖 Sources</Link>
        </div>
      </header>
      <LessonList />
    </div>
  );
}
