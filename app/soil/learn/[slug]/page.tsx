import { notFound } from "next/navigation";
import { LessonView } from "@/components/learn/LessonView";
import { getLesson, LESSONS } from "@/content/soil/lessons";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const lesson = getLesson((await params).slug);
  return { title: lesson ? `${lesson.title} · Earth Science Lab` : "Lesson" };
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) notFound();
  return <LessonView slug={lesson.slug} />;
}
