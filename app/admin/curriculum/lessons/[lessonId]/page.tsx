"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LessonEditor } from "@/components/admin/curriculum/lesson-editor";
import { cardStyle, font } from "@/components/admin/ui";

export default function LessonEditorPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const lesson = useQuery(api.curriculumEditor.getLesson, { lessonId: lessonId as Id<"lessons"> });

  if (lesson === undefined) {
    return <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)" }}>Loading lesson…</p>;
  }
  if (lesson === null) {
    return (
      <div style={{ ...cardStyle, padding: 32, textAlign: "center" }}>
        <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }}>
          This lesson was deleted, or you can&apos;t edit it.
        </p>
        <Link
          href="/admin/curriculum"
          style={{ display: "inline-block", marginTop: 12, fontFamily: font.body, fontSize: 14, color: "#A5B4FC" }}
        >
          Back to Curriculum
        </Link>
      </div>
    );
  }
  return <LessonEditor key={lesson._id} lesson={lesson} />;
}
