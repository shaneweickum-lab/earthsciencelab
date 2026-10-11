import { notFound } from "next/navigation";
import { LessonView } from "@/components/learn/LessonView";
import { CURRICULUM, getCurriculumLesson } from "@/content/soil/curriculum";

export function generateStaticParams() {
  return CURRICULUM.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const lesson = getCurriculumLesson((await params).slug);
  return { title: lesson ? `${lesson.title} · Earth Science Lab` : "Lesson" };
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getCurriculumLesson(slug)) notFound();
  return <LessonView slug={slug} />;
}
