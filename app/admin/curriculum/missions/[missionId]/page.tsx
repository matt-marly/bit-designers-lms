"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { MissionEditor } from "@/components/admin/curriculum/mission-editor";
import { cardStyle, font } from "@/components/admin/ui";

export default function MissionEditorPage() {
  const { missionId } = useParams<{ missionId: string }>();
  const mission = useQuery(api.missionsEditor.getMission, { missionId: missionId as Id<"missions"> });

  if (mission === undefined) {
    return <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)" }}>Loading mission…</p>;
  }
  if (mission === null) {
    return (
      <div style={{ ...cardStyle, padding: 32, textAlign: "center" }}>
        <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }}>
          This mission was deleted, or you can&apos;t edit it.
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
  return <MissionEditor key={mission._id} mission={mission} />;
}
