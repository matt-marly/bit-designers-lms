import { getModuleContent } from "@/lib/content";
import { LessonDocClient } from "./lesson-client";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ moduleSlug: string }>;
}) {
  const { moduleSlug } = await params;
  const content = await getModuleContent(moduleSlug);
  return <LessonDocClient content={content} />;
}
