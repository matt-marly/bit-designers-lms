"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Trash2, Video } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  ConfirmStrip,
  controlStyle,
  errorMessage,
  fieldLabelStyle,
  focusHandlers,
  font,
  ghostButtonStyle,
  smallButtonStyle,
  type ShowToast,
} from "../ui";
import { IconButton, InlineTitleForm, MonoLabel, padNumber, primarySmallButtonStyle, type OutlineModule } from "./shared";
import { ModuleMissions } from "./module-missions";

export function ModulePanel({
  mod,
  isFirst,
  isLast,
  onDeleted,
  onToast,
}: {
  mod: OutlineModule;
  isFirst: boolean;
  isLast: boolean;
  onDeleted: () => void;
  onToast: ShowToast;
}) {
  const router = useRouter();
  const lessons = useQuery(api.curriculumEditor.listLessons, { moduleId: mod._id });
  const missions = useQuery(api.missionsEditor.listForModule, { moduleId: mod._id });
  const setStatus = useMutation(api.curriculumEditor.setModuleStatus);
  const moveModule = useMutation(api.curriculumEditor.moveModule);
  const deleteModule = useMutation(api.curriculumEditor.deleteModule);
  const createLesson = useMutation(api.curriculumEditor.createLesson);
  const moveLesson = useMutation(api.curriculumEditor.moveLesson);
  const deleteLesson = useMutation(api.curriculumEditor.deleteLesson);
  const [confirm, setConfirm] = useState<{ kind: "module" } | { kind: "lesson"; id: Id<"lessons">; title: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>, success?: string) {
    setBusy(true);
    try {
      await action();
      if (success) onToast(success);
      return true;
    } catch (err) {
      onToast(errorMessage(err), "error");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const published = mod.status === "published";

  return (
    <div style={{ padding: "8px 20px 20px 49px", backgroundColor: "#0D0D0D" }} className="max-md:!pl-5">
      <ModuleDetails mod={mod} onToast={onToast} />

      <div style={{ marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ ...fieldLabelStyle, marginBottom: 0 }}>Lessons</span>
          <span style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)" }}>
            Learners go through lessons in this order.
          </span>
        </div>

        {lessons === undefined ? (
          <p style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)", margin: 0 }}>Loading lessons…</p>
        ) : (
          <div style={{ border: "1px solid var(--color-border-subtle)", borderRadius: 10, overflow: "hidden" }}>
            {lessons.length === 0 && (
              <p style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)", margin: 0, padding: "12px 14px" }}>
                No lessons yet. Add one below, then write it in the lesson editor.
              </p>
            )}
            {lessons.map((lesson, i) => (
              <div key={lesson._id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 8px 8px 14px" }}>
                  <MonoLabel>{padNumber(i + 1)}</MonoLabel>
                  <Link
                    href={`/admin/curriculum/lessons/${lesson._id}`}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontFamily: font.body,
                      fontSize: 14,
                      color: "var(--color-text-primary)",
                      textDecoration: "none",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {lesson.title}
                  </Link>
                  {lesson.hasVideo && (
                    <Video size={14} aria-label="Has video" style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }} />
                  )}
                  <span
                    style={{
                      fontFamily: font.mono,
                      fontSize: 11,
                      color: lesson.wordCount === 0 ? "#FBBF24" : "var(--color-text-tertiary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {lesson.wordCount === 0 ? "Empty" : `${lesson.wordCount.toLocaleString("en-US")} words`}
                  </span>
                  <div style={{ display: "flex", gap: 2 }}>
                    <IconButton
                      label={`Move ${lesson.title} up`}
                      icon={ArrowUp}
                      disabled={busy || i === 0}
                      onClick={() => run(() => moveLesson({ lessonId: lesson._id, direction: "up" }))}
                    />
                    <IconButton
                      label={`Move ${lesson.title} down`}
                      icon={ArrowDown}
                      disabled={busy || i === lessons.length - 1}
                      onClick={() => run(() => moveLesson({ lessonId: lesson._id, direction: "down" }))}
                    />
                    <IconButton
                      label={`Edit ${lesson.title}`}
                      icon={Pencil}
                      onClick={() => router.push(`/admin/curriculum/lessons/${lesson._id}`)}
                    />
                    <IconButton
                      label={`Delete ${lesson.title}`}
                      icon={Trash2}
                      tone="danger"
                      onClick={() => setConfirm({ kind: "lesson", id: lesson._id, title: lesson.title })}
                    />
                  </div>
                </div>
                {confirm?.kind === "lesson" && confirm.id === lesson._id && (
                  <ConfirmStrip
                    message={
                      lessons.length === 1 && published
                        ? `Delete “${lesson.title}”? It's the only lesson, so the module goes back to draft and learners lose access to it.`
                        : `Delete “${lesson.title}”? Learners' progress on this lesson is removed too.`
                    }
                    confirmLabel="Delete lesson"
                    danger
                    busy={busy}
                    onConfirm={async () => {
                      const ok = await run(() => deleteLesson({ lessonId: lesson._id }), "Lesson deleted");
                      if (ok) setConfirm(null);
                    }}
                    onCancel={() => setConfirm(null)}
                    style={{ padding: "4px 14px 12px", backgroundColor: "transparent" }}
                  />
                )}
              </div>
            ))}
            <div style={{ padding: "10px 14px" }}>
              <InlineTitleForm
                id={`new-lesson-${mod._id}`}
                label={`New lesson in ${mod.title}`}
                placeholder="New lesson title"
                submitLabel="Add lesson"
                busyLabel="Adding…"
                onSubmit={(title) => run(() => createLesson({ moduleId: mod._id, title }), "Lesson added")}
              />
            </div>
          </div>
        )}
      </div>

      <ModuleMissions mod={mod} missions={missions} onToast={onToast} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 20,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          disabled={busy || (!published && mod.lessonCount === 0)}
          title={!published && mod.lessonCount === 0 ? "Add at least one lesson before publishing" : undefined}
          onClick={() =>
            run(
              () => setStatus({ moduleId: mod._id, status: published ? "draft" : "published" }),
              published ? "Module moved back to draft" : "Module published",
            )
          }
          style={{
            ...(published ? smallButtonStyle : primarySmallButtonStyle),
            height: 34,
            opacity: busy || (!published && mod.lessonCount === 0) ? 0.4 : 1,
            cursor: busy || (!published && mod.lessonCount === 0) ? "not-allowed" : "pointer",
          }}
        >
          {published ? "Unpublish" : "Publish"}
        </button>
        {mod.lessonCount > 0 && (
          <Link
            href={`/learn/${mod.slug}`}
            target="_blank"
            style={{
              ...ghostButtonStyle,
              height: 34,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "none",
            }}
          >
            Preview as learner <ExternalLink size={13} aria-hidden />
          </Link>
        )}
        <span style={{ flex: 1 }} />
        <IconButton
          label="Move module up"
          icon={ArrowUp}
          disabled={busy || isFirst}
          onClick={() => run(() => moveModule({ moduleId: mod._id, direction: "up" }))}
        />
        <IconButton
          label="Move module down"
          icon={ArrowDown}
          disabled={busy || isLast}
          onClick={() => run(() => moveModule({ moduleId: mod._id, direction: "down" }))}
        />
        <IconButton
          label={
            mod.lessonCount > 0
              ? "Delete this module's lessons first"
              : (missions?.length ?? 0) > 0
                ? "Delete this module's missions first"
                : "Delete module"
          }
          icon={Trash2}
          tone="danger"
          disabled={mod.lessonCount > 0 || (missions?.length ?? 0) > 0}
          onClick={() => setConfirm({ kind: "module" })}
        />
      </div>
      {!published && (
        <p style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)", margin: 0, marginTop: 8 }}>
          Drafts are only visible to people who can edit this track&apos;s curriculum.
        </p>
      )}
      {confirm?.kind === "module" && (
        <ConfirmStrip
          message={`Delete “${mod.title}”? This can't be undone.`}
          confirmLabel="Delete module"
          danger
          busy={busy}
          onConfirm={async () => {
            const ok = await run(() => deleteModule({ moduleId: mod._id }), "Module deleted");
            if (ok) onDeleted();
          }}
          onCancel={() => setConfirm(null)}
          style={{ padding: "12px 0 0", backgroundColor: "transparent" }}
        />
      )}
    </div>
  );
}

function ModuleDetails({ mod, onToast }: { mod: OutlineModule; onToast: ShowToast }) {
  const updateModule = useMutation(api.curriculumEditor.updateModule);
  const [title, setTitle] = useState(mod.title);
  const [description, setDescription] = useState(mod.description ?? "");
  const [objectives, setObjectives] = useState(mod.objectives.join("\n"));
  const [saving, setSaving] = useState(false);

  const objectiveList = objectives.split("\n").map((o) => o.trim()).filter(Boolean);
  const dirty =
    title.trim() !== mod.title ||
    description.trim() !== (mod.description ?? "") ||
    objectiveList.join("\n") !== mod.objectives.join("\n");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || !title.trim()) return;
    setSaving(true);
    try {
      await updateModule({ moduleId: mod._id, title, description, objectives: objectiveList });
      onToast("Module saved");
    } catch (err) {
      onToast(errorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setTitle(mod.title);
    setDescription(mod.description ?? "");
    setObjectives(mod.objectives.join("\n"));
  }

  return (
    <form onSubmit={save} style={{ display: "grid", gap: 16, paddingTop: 12 }}>
      <div>
        <label htmlFor={`module-title-${mod._id}`} style={fieldLabelStyle}>
          Title
        </label>
        <input
          id={`module-title-${mod._id}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          required
          style={controlStyle}
          {...focusHandlers}
        />
      </div>
      <div>
        <label htmlFor={`module-description-${mod._id}`} style={fieldLabelStyle}>
          Description <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}>(optional)</span>
        </label>
        <textarea
          id={`module-description-${mod._id}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="One or two sentences shown at the top of the module"
          style={{ ...controlStyle, height: "auto", padding: "10px 14px", resize: "vertical", lineHeight: "22px" }}
          {...focusHandlers}
        />
      </div>
      <div>
        <label htmlFor={`module-objectives-${mod._id}`} style={fieldLabelStyle}>
          Learning objectives <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}>(one per line)</span>
        </label>
        <textarea
          id={`module-objectives-${mod._id}`}
          value={objectives}
          onChange={(e) => setObjectives(e.target.value)}
          rows={3}
          placeholder={"Explain what a seed phrase is\nCompare custodial and self-custodial wallets"}
          style={{ ...controlStyle, height: "auto", padding: "10px 14px", resize: "vertical", lineHeight: "22px" }}
          {...focusHandlers}
        />
      </div>
      {dirty && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            style={{ ...primarySmallButtonStyle, opacity: saving || !title.trim() ? 0.4 : 1 }}
          >
            {saving ? "Saving…" : "Save module"}
          </button>
          <button type="button" onClick={reset} disabled={saving} style={ghostButtonStyle}>
            Discard
          </button>
        </div>
      )}
    </form>
  );
}
