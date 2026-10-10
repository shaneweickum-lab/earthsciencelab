import { LessonList } from "@/components/learn/LessonList";

export default function LearnPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-leaf">Learn</p>
        <h1 className="font-display text-4xl font-black">Soil Health &amp; Quality</h1>
        <p className="mt-1 max-w-2xl text-muted">
          Work through the lessons in order or jump around. Each one ends with a quiz. Get answers right to earn XP and badges.
        </p>
      </header>
      <LessonList />
    </div>
  );
}
