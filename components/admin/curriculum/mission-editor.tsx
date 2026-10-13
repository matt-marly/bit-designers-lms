"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, Plus, X } from "lucide-react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  StatusBadge,
  Toast,
  cardStyle,
  controlStyle,
  errorMessage,
  fieldLabelStyle,
  focusHandlers,
  font,
  formatDate,
  ghostButtonStyle,
  smallButtonStyle,
  toDateInput,
  useToast,
  type ShowToast,
} from "../ui";
import { IconButton, MarkdownField, UnsavedBar } from "./shared";

type EditableMission = NonNullable<FunctionReturnType<typeof api.missionsEditor.getMission>>;
type Fields = Pick<EditableMission, "title" | "brief" | "rubric" | "reviewType">;

const BRIEF_LIMIT = 20_000;
const MAX_CRITERIA = 12;
const WEEK = 7 * 24 * 60 * 60 * 1000;

function fieldsOf(mission: EditableMission): Fields {
  return { title: mission.title, brief: mission.brief, rubric: mission.rubric, reviewType: mission.reviewType };
}

function cleanRubric(rubric: string[]) {
  return rubric.map((c) => c.trim()).filter(Boolean);
}

function changes(fields: Fields, saved: Fields) {
  const result: Partial<Fields> = {};
  if (fields.title.trim() !== saved.title) result.title = fields.title;
  if (fields.brief !== saved.brief) result.brief = fields.brief;
  if (fields.reviewType !== saved.reviewType) result.reviewType = fields.reviewType;
  const rubric = cleanRubric(fields.rubric);
  if (rubric.join("\n") !== saved.rubric.join("\n")) result.rubric = rubric;
  return result;
}

/** End of the chosen day in local time, so a deadline "on the 14th" covers the whole day. */
function endOfDay(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

export function MissionEditor({ mission }: { mission: EditableMission }) {
  const updateMission = useMutation(api.missionsEditor.updateMission);
  const { toast, showToast } = useToast();
  const [saved, setSaved] = useState<Fields>(() => fieldsOf(mission));
  const [fields, setFields] = useState<Fields>(saved);
  const [saving, setSaving] = useState(false);

  const pending = changes(fields, saved);
  const dirty = Object.keys(pending).length > 0;
  const canSave = dirty && !saving && fields.title.trim() !== "" && fields.brief.length <= BRIEF_LIMIT;

  const save = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await updateMission({ missionId: mission._id, ...pending });
      const next = { ...fields, title: fields.title.trim(), rubric: cleanRubric(fields.rubric) };
      setSaved(next);
      setFields(next);
      showToast("Mission saved");
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }, [canSave, fields, mission._id, pending, showToast, updateMission]);

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function setCriterion(index: number, value: string) {
    set("rubric", fields.rubric.map((c, i) => (i === index ? value : c)));
  }

  function moveCriterion(index: number, delta: -1 | 1) {
    const next = [...fields.rubric];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    set("rubric", next);
  }

  const backHref = `/admin/curriculum?track=${mission.track._id}&module=${mission.module._id}`;

  return (
    <div style={{ paddingBottom: 96 }}>
      <Link
        href={backHref}
        onClick={(e) => {
          if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) e.preventDefault();
        }}
        style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)", textDecoration: "none" }}
      >
        &larr; Back to {mission.module.title}
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
            {mission.track.name} · {mission.module.title} · Mission
            <StatusBadge tone={mission.module.status === "published" ? "success" : "neutral"}>
              {mission.module.status === "published" ? "Published" : "Draft module"}
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
          href={`/missions/${mission.slug}`}
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

      <div style={{ display: "grid", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          <div>
            <label htmlFor="mission-title" style={fieldLabelStyle}>
              Title
            </label>
            <input
              id="mission-title"
              value={fields.title}
              onChange={(e) => set("title", e.target.value)}
              maxLength={120}
              required
              style={controlStyle}
              {...focusHandlers}
            />
          </div>
          <fieldset style={{ border: "none", margin: 0, padding: 0, minWidth: 0 }}>
            <legend style={fieldLabelStyle}>How it&apos;s checked</legend>
            <div
              role="radiogroup"
              style={{ display: "flex", border: "1px solid var(--color-border-strong)", borderRadius: 10, overflow: "hidden" }}
            >
              {(
                [
                  { value: "reviewed", label: "Reviewed by a mentor" },
                  { value: "completion_only", label: "Done on submit" },
                ] as const
              ).map((option, i) => {
                const selected = fields.reviewType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => set("reviewType", option.value)}
                    style={{
                      flex: 1,
                      height: 38,
                      border: "none",
                      borderRight: i === 0 ? "1px solid var(--color-border-strong)" : "none",
                      backgroundColor: selected ? "rgba(99,102,241,0.12)" : "transparent",
                      color: selected ? "#A5B4FC" : "var(--color-text-tertiary)",
                      fontFamily: font.body,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)", margin: "6px 0 0" }}>
              {fields.reviewType === "reviewed"
                ? "Submissions go to the review queue. The mission counts once a mentor passes it."
                : "The mission counts as soon as the learner submits. Nothing goes to the review queue."}
            </p>
          </fieldset>
        </div>

        <MarkdownField
          id="mission-brief"
          label="Brief"
          value={fields.brief}
          onChange={(value) => set("brief", value)}
          limit={BRIEF_LIMIT}
          minHeight={300}
          placeholder={"What should learners make, and how should they hand it in?\n\n## Deliverable\n- A Figma file with…"}
        />

        <div>
          <span id="mission-rubric-label" style={fieldLabelStyle}>
            Rubric <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}>(optional)</span>
          </span>
          <p style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)", margin: "0 0 10px" }}>
            Learners see these criteria with the brief. Reviewers tick them off when they review.
            {mission.hasSubmissions && " Changes apply to reviews from now on."}
          </p>
          <div role="list" aria-labelledby="mission-rubric-label" style={{ display: "grid", gap: 8 }}>
            {fields.rubric.map((criterion, i) => (
              <div key={i} role="listitem" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 22,
                    fontFamily: font.mono,
                    fontSize: 11,
                    color: "var(--color-text-tertiary)",
                    fontVariantNumeric: "tabular-nums",
                    flexShrink: 0,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <input
                  aria-label={`Criterion ${i + 1}`}
                  value={criterion}
                  onChange={(e) => setCriterion(i, e.target.value)}
                  maxLength={300}
                  placeholder="e.g. Identifies at least two real usability problems"
                  style={{ ...controlStyle, height: 36, fontSize: 13 }}
                  {...focusHandlers}
                />
                <IconButton label={`Move criterion ${i + 1} up`} icon={ArrowUp} disabled={i === 0} onClick={() => moveCriterion(i, -1)} />
                <IconButton
                  label={`Move criterion ${i + 1} down`}
                  icon={ArrowDown}
                  disabled={i === fields.rubric.length - 1}
                  onClick={() => moveCriterion(i, 1)}
                />
                <IconButton
                  label={`Remove criterion ${i + 1}`}
                  icon={X}
                  tone="danger"
                  onClick={() => set("rubric", fields.rubric.filter((_, j) => j !== i))}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={fields.rubric.length >= MAX_CRITERIA}
            onClick={() => set("rubric", [...fields.rubric, ""])}
            style={{
              ...smallButtonStyle,
              height: 34,
              marginTop: fields.rubric.length > 0 ? 10 : 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              opacity: fields.rubric.length >= MAX_CRITERIA ? 0.4 : 1,
            }}
          >
            <Plus size={14} aria-hidden /> Add criterion
          </button>
        </div>

        <Deadlines mission={mission} onToast={showToast} />
      </div>

      <UnsavedBar
        dirty={dirty}
        saving={saving}
        canSave={canSave}
        saveLabel="Save mission"
        onSave={() => void save()}
        onDiscard={() => setFields(saved)}
      />

      <Toast toast={toast} />
    </div>
  );
}

function Deadlines({ mission, onToast }: { mission: EditableMission; onToast: ShowToast }) {
  const setDeadline = useMutation(api.missionsEditor.setDeadline);
  const [busy, setBusy] = useState<Id<"cohorts"> | null>(null);

  async function update(cohortId: Id<"cohorts">, dueAt: number | null) {
    setBusy(cohortId);
    try {
      await setDeadline({ missionId: mission._id, cohortId, dueAt });
      onToast(dueAt === null ? "Deadline cleared" : "Deadline saved");
    } catch (err) {
      onToast(errorMessage(err), "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <span style={fieldLabelStyle}>Deadlines</span>
      <p style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)", margin: "0 0 10px" }}>
        Each cohort can have its own due date. Late work is still accepted, but flagged for reviewers. Saved as you pick.
      </p>
      {mission.deadlines.length === 0 ? (
        <div style={{ ...cardStyle, padding: "14px 16px" }}>
          <p style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)", margin: 0 }}>
            This track has no cohorts yet. Add one under{" "}
            <Link href="/admin/tracks" style={{ color: "#A5B4FC" }}>
              Tracks
            </Link>{" "}
            to set deadlines.
          </p>
        </div>
      ) : (
        <div style={{ border: "1px solid var(--color-border-subtle)", borderRadius: 10, overflow: "hidden" }}>
          {mission.deadlines.map((row, i) => {
            const week = row.dueAt !== null ? Math.max(1, Math.floor((row.dueAt - row.startsAt) / WEEK) + 1) : null;
            return (
              <div
                key={row.cohortId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderTop: i === 0 ? "none" : "1px solid var(--color-border-subtle)",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                  <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-primary)", margin: 0 }}>{row.cohortName}</p>
                  <p style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)", margin: "2px 0 0" }}>
                    Starts {formatDate(row.startsAt)}
                    {row.cohortStatus !== "active" && ` · ${row.cohortStatus === "draft" ? "Draft" : "Completed"}`}
                  </p>
                </div>
                {week !== null && (
                  <span style={{ fontFamily: font.mono, fontSize: 11, color: "var(--color-text-tertiary)" }}>Week {week}</span>
                )}
                <label htmlFor={`due-${row.cohortId}`} className="sr-only">
                  Due date for {row.cohortName}
                </label>
                <input
                  id={`due-${row.cohortId}`}
                  type="date"
                  value={toDateInput(row.dueAt ?? undefined)}
                  disabled={busy === row.cohortId}
                  onChange={(e) => {
                    if (e.target.value) void update(row.cohortId, endOfDay(e.target.value));
                  }}
                  style={{ ...controlStyle, width: 170, height: 34, fontSize: 13 }}
                  {...focusHandlers}
                />
                <button
                  type="button"
                  disabled={row.dueAt === null || busy === row.cohortId}
                  onClick={() => void update(row.cohortId, null)}
                  style={{ ...ghostButtonStyle, opacity: row.dueAt === null ? 0.3 : 1 }}
                >
                  Clear
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
