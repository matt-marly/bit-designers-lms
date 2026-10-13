"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import {
  StatusBadge,
  Toast,
  controlStyle,
  errorMessage,
  fieldLabelStyle,
  focusHandlers,
  font,
  ghostButtonStyle,
  useToast,
} from "../ui";
import { MarkdownField, UnsavedBar, textareaStyle } from "./shared";

type EditableLesson = NonNullable<FunctionReturnType<typeof api.curriculumEditor.getLesson>>;
type Fields = Pick<EditableLesson, "title" | "body" | "videoUrl" | "summary" | "transcript">;

const BODY_LIMIT = 50_000;

function fieldsOf(lesson: EditableLesson): Fields {
  return {
    title: lesson.title,
    body: lesson.body,
    videoUrl: lesson.videoUrl,
    summary: lesson.summary,
    transcript: lesson.transcript,
  };
}

function changedKeys(fields: Fields, saved: Fields) {
  return (Object.keys(fields) as (keyof Fields)[]).filter((key) => fields[key] !== saved[key]);
}

export function LessonEditor({ lesson }: { lesson: EditableLesson }) {
  const updateLesson = useMutation(api.curriculumEditor.updateLesson);
  const { toast, showToast } = useToast();
  const [saved, setSaved] = useState<Fields>(() => fieldsOf(lesson));
  const [fields, setFields] = useState<Fields>(saved);
  const [saving, setSaving] = useState(false);

  const dirty = changedKeys(fields, saved).length > 0;
  const overLimit = fields.body.length > BODY_LIMIT;
  const canSave = dirty && !saving && fields.title.trim() !== "" && !overLimit;

  const save = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await updateLesson({
        lessonId: lesson._id,
        ...Object.fromEntries(changedKeys(fields, saved).map((key) => [key, fields[key]])),
      });
      setSaved(fields);
      showToast("Lesson saved");
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }, [canSave, fields, saved, lesson._id, showToast, updateLesson]);

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  const backHref = `/admin/curriculum?track=${lesson.track._id}&module=${lesson.module._id}`;

  return (
    <div style={{ paddingBottom: 96 }}>
      <Link
        href={backHref}
        onClick={(e) => {
          if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) e.preventDefault();
        }}
        style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)", textDecoration: "none" }}
      >
        &larr; Back to {lesson.module.title}
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginTop: 16,
          marginBottom: 28,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontFamily: font.mono,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "var(--color-text-tertiary)",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {lesson.track.name} · {lesson.module.title}
            <StatusBadge tone={lesson.module.status === "published" ? "success" : "neutral"}>
              {lesson.module.status === "published" ? "Published" : "Draft"}
            </StatusBadge>
          </p>
          <h1
            style={{
              fontFamily: font.display,
              fontSize: 30,
              lineHeight: "36px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--color-text-primary)",
              margin: 0,
              marginTop: 8,
              overflowWrap: "anywhere",
            }}
          >
            {saved.title}
          </h1>
        </div>
        <Link
          href={`/learn/${lesson.module.slug}/${lesson.slug}`}
          target="_blank"
          style={{
            ...ghostButtonStyle,
            height: 34,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            textDecoration: "none",
            border: "1px solid var(--color-border-strong)",
            color: "var(--color-text-secondary)",
          }}
        >
          Preview as learner <ExternalLink size={13} aria-hidden />
        </Link>
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          <div>
            <label htmlFor="lesson-title" style={fieldLabelStyle}>
              Title
            </label>
            <input
              id="lesson-title"
              value={fields.title}
              onChange={(e) => set("title", e.target.value)}
              maxLength={120}
              required
              style={controlStyle}
              {...focusHandlers}
            />
          </div>
          <div>
            <label htmlFor="lesson-video" style={fieldLabelStyle}>
              Video link <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              id="lesson-video"
              type="url"
              inputMode="url"
              value={fields.videoUrl}
              onChange={(e) => set("videoUrl", e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              maxLength={500}
              aria-describedby="lesson-video-hint"
              style={controlStyle}
              {...focusHandlers}
            />
            <p id="lesson-video-hint" style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)", margin: "6px 0 0" }}>
              YouTube and Vimeo links play inside the lesson. Other links open in a new tab.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="lesson-summary" style={fieldLabelStyle}>
            Summary <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            id="lesson-summary"
            value={fields.summary}
            onChange={(e) => set("summary", e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="The one idea learners should take away. Shown under the title."
            style={textareaStyle}
            {...focusHandlers}
          />
        </div>

        <MarkdownField
          id="lesson-body"
          label="Lesson"
          value={fields.body}
          onChange={(value) => set("body", value)}
          limit={BODY_LIMIT}
          placeholder={"## A heading\n\nWrite the lesson in Markdown. Use **bold**, lists, > callouts, tables and [links](https://bitcoin.design)."}
        />

        <details>
          <summary
            style={{
              ...fieldLabelStyle,
              marginBottom: 0,
              cursor: "pointer",
              display: "list-item",
            }}
          >
            Video transcript {fields.transcript.trim() ? "" : "(optional)"}
          </summary>
          <textarea
            aria-label="Video transcript"
            value={fields.transcript}
            onChange={(e) => set("transcript", e.target.value)}
            rows={8}
            maxLength={50_000}
            placeholder="Paste the transcript so learners can read along or search it."
            style={{ ...textareaStyle, marginTop: 10 }}
            {...focusHandlers}
          />
        </details>
      </div>

      <UnsavedBar
        dirty={dirty}
        saving={saving}
        canSave={canSave}
        saveLabel="Save lesson"
        onSave={() => void save()}
        onDiscard={() => setFields(saved)}
      />

      <Toast toast={toast} />
    </div>
  );
}
