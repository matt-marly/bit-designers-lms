"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useMutation, usePaginatedQuery } from "convex/react";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import type { TrackAdmin } from "./track-detail";
import {
  Avatar,
  SectionHeader,
  StatusBadge,
  cardStyle,
  controlStyle,
  dangerButtonStyle,
  errorMessage,
  fieldLabelStyle,
  focusHandlers,
  font,
  formatDate,
  fromDateInput,
  ghostButtonStyle,
  smallButtonStyle,
  toDateInput,
  type BadgeTone,
  type ShowToast,
} from "../ui";

type Cohort = Doc<"cohorts">;
type CohortStatus = Cohort["status"];

const STUDENTS_PAGE_SIZE = 20;

const cohortStatusInfo: Record<CohortStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Draft", tone: "neutral" },
  active: { label: "Active", tone: "success" },
  completed: { label: "Completed", tone: "indigo" },
  archived: { label: "Archived", tone: "neutral" },
};

function dateRange(cohort: Cohort) {
  return cohort.endsAt
    ? `${formatDate(cohort.startsAt)} – ${formatDate(cohort.endsAt)}`
    : `Starts ${formatDate(cohort.startsAt)}`;
}

export function CohortsSection({ data, onToast }: { data: TrackAdmin; onToast: ShowToast }) {
  const { track, capabilities, cohorts } = data;
  const trackActive = track.status === "active";
  const canCreate = capabilities.canManageCohorts && trackActive;
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<{ cohortId: Id<"cohorts">; view: "students" | "edit" } | null>(null);

  function toggle(cohortId: Id<"cohorts">, view: "students" | "edit") {
    setExpanded((prev) => (prev?.cohortId === cohortId && prev.view === view ? null : { cohortId, view }));
  }

  return (
    <section aria-labelledby="cohorts-heading">
      <SectionHeader
        title="Cohorts"
        meta={cohorts.length > 0 ? cohorts.length : undefined}
        action={
          canCreate && !creating ? (
            <button type="button" onClick={() => setCreating(true)} style={{ ...smallButtonStyle, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Plus style={{ width: 14, height: 14 }} />
              New cohort
            </button>
          ) : undefined
        }
      />

      {creating && (
        <div style={{ ...cardStyle, padding: 20, marginBottom: 12 }}>
          <CohortForm
            trackId={track._id}
            onDone={(message) => {
              setCreating(false);
              if (message) onToast(message);
            }}
            onToast={onToast}
          />
        </div>
      )}

      {cohorts.length === 0 ? (
        !creating && (
          <div style={{ ...cardStyle, padding: 24, textAlign: "center" }}>
            <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }}>
              No cohorts yet.
              {canCreate ? " Create one to start enrolling students." : ""}
            </p>
          </div>
        )
      ) : (
        <div style={{ border: "1px solid var(--color-border-subtle)", borderRadius: 14, overflow: "hidden" }}>
          {cohorts.map(({ cohort, studentCount, studentCountCapped }, i) => {
            const view = expanded?.cohortId === cohort._id ? expanded.view : null;
            const status = cohortStatusInfo[cohort.status];
            return (
              <div
                key={cohort._id}
                style={{ borderBottom: i < cohorts.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 20px",
                    flexWrap: "wrap",
                    backgroundColor: view ? "#141414" : "transparent",
                    transitionProperty: "background-color",
                    transitionDuration: "var(--duration-fast)",
                    transitionTimingFunction: "var(--ease-out-quart)",
                  }}
                >
                  <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: font.body, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {cohort.name}
                      </span>
                      <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                    </div>
                    <p
                      style={{
                        fontFamily: font.mono,
                        fontSize: 12,
                        color: "var(--color-text-tertiary)",
                        margin: 0,
                        marginTop: 4,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {dateRange(cohort)}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => toggle(cohort._id, "students")}
                      aria-expanded={view === "students"}
                      style={{
                        ...smallButtonStyle,
                        borderColor: view === "students" ? "rgba(99,102,241,0.55)" : "var(--color-border-strong)",
                        color: view === "students" ? "#A5B4FC" : "var(--color-text-primary)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {studentCount}
                      {studentCountCapped ? "+" : ""} student{studentCount === 1 && !studentCountCapped ? "" : "s"}
                    </button>
                    {capabilities.canManageCohorts && (
                      <button
                        type="button"
                        onClick={() => toggle(cohort._id, "edit")}
                        aria-expanded={view === "edit"}
                        style={{
                          ...smallButtonStyle,
                          borderColor: view === "edit" ? "rgba(99,102,241,0.55)" : "var(--color-border-strong)",
                          color: view === "edit" ? "#A5B4FC" : "var(--color-text-primary)",
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {view === "edit" && (
                  <div style={{ padding: "4px 20px 20px", backgroundColor: "#141414" }}>
                    <CohortForm
                      trackId={track._id}
                      cohort={cohort}
                      onDone={(message) => {
                        setExpanded(null);
                        if (message) onToast(message);
                      }}
                      onToast={onToast}
                    />
                  </div>
                )}
                {view === "students" && (
                  <CohortStudents
                    cohort={cohort}
                    data={data}
                    onToast={onToast}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CohortForm({
  trackId,
  cohort,
  onDone,
  onToast,
}: {
  trackId: Id<"tracks">;
  cohort?: Cohort;
  onDone: (message?: string) => void;
  onToast: ShowToast;
}) {
  const createCohort = useMutation(api.tracks.createCohort);
  const updateCohort = useMutation(api.tracks.updateCohort);

  const [name, setName] = useState(cohort?.name ?? "");
  const [startsAt, setStartsAt] = useState(toDateInput(cohort?.startsAt));
  const [endsAt, setEndsAt] = useState(toDateInput(cohort?.endsAt));
  const [status, setStatus] = useState<CohortStatus>(cohort?.status ?? "draft");
  const [saving, setSaving] = useState(false);

  const start = fromDateInput(startsAt);
  const end = fromDateInput(endsAt);
  const datesInvalid = start !== undefined && end !== undefined && end < start;
  const canSubmit = name.trim() !== "" && start !== undefined && !datesInvalid && !saving;
  const statusOptions: CohortStatus[] = cohort ? ["draft", "active", "completed", "archived"] : ["draft", "active"];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || start === undefined) return;
    setSaving(true);
    try {
      if (cohort) {
        await updateCohort({ cohortId: cohort._id, name, startsAt: start, endsAt: end ?? null, status });
        onDone(`${name.trim()} updated`);
      } else {
        await createCohort({ trackId, name, startsAt: start, endsAt: end, status });
        onDone(`${name.trim()} created`);
      }
    } catch (err) {
      onToast(errorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  const idPrefix = cohort ? `cohort-${cohort._id}` : "new-cohort";

  return (
    <form onSubmit={submit}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16 }}>
        <div style={{ gridColumn: "span 2" }}>
          <label htmlFor={`${idPrefix}-name`} style={fieldLabelStyle}>
            Name
          </label>
          <input
            id={`${idPrefix}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cohort 02"
            required
            autoFocus={!cohort}
            style={controlStyle}
            {...focusHandlers}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-start`} style={fieldLabelStyle}>
            Starts
          </label>
          <input
            id={`${idPrefix}-start`}
            type="date"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
            style={controlStyle}
            {...focusHandlers}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-end`} style={fieldLabelStyle}>
            Ends <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id={`${idPrefix}-end`}
            type="date"
            value={endsAt}
            min={startsAt || undefined}
            onChange={(e) => setEndsAt(e.target.value)}
            aria-invalid={datesInvalid}
            style={{ ...controlStyle, borderColor: datesInvalid ? "rgba(239,68,68,0.70)" : undefined }}
            {...focusHandlers}
          />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <span style={fieldLabelStyle}>Status</span>
        <div role="group" aria-label="Cohort status" style={{ display: "inline-flex", border: "1px solid var(--color-border-strong)", borderRadius: 10, overflow: "hidden" }}>
          {statusOptions.map((option, i) => {
            const selected = status === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => setStatus(option)}
                style={{
                  height: 34,
                  padding: "0 14px",
                  border: "none",
                  borderRight: i < statusOptions.length - 1 ? "1px solid var(--color-border-strong)" : "none",
                  backgroundColor: selected ? "rgba(99,102,241,0.12)" : "transparent",
                  color: selected ? "#A5B4FC" : "var(--color-text-tertiary)",
                  fontFamily: font.body,
                  fontSize: 13,
                  fontWeight: selected ? 500 : 400,
                  cursor: "pointer",
                }}
              >
                {cohortStatusInfo[option].label}
              </button>
            );
          })}
        </div>
        <p style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)", margin: 0, marginTop: 8 }}>
          {datesInvalid
            ? "The end date must be after the start date."
            : status === "draft"
              ? "Draft cohorts can take students but aren't running yet."
              : status === "active"
                ? "Active cohorts are running now."
                : status === "completed"
                  ? "Completed cohorts have finished. Students keep their progress."
                  : "Archived cohorts are hidden from new invitations."}
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            ...smallButtonStyle,
            height: 34,
            border: "none",
            backgroundColor: "var(--color-indigo)",
            opacity: canSubmit ? 1 : 0.4,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {saving ? "Saving…" : cohort ? "Save cohort" : "Create cohort"}
        </button>
        <button type="button" onClick={() => onDone()} style={ghostButtonStyle}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function CohortStudents({
  cohort,
  data,
  onToast,
}: {
  cohort: Cohort;
  data: TrackAdmin;
  onToast: ShowToast;
}) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.tracks.listCohortStudents,
    { cohortId: cohort._id },
    { initialNumItems: STUDENTS_PAGE_SIZE },
  );
  const moveStudent = useMutation(api.tracks.moveStudent);
  const unenroll = useMutation(api.tracks.unenroll);
  const [busyId, setBusyId] = useState<Id<"enrollments"> | null>(null);
  const [confirmingId, setConfirmingId] = useState<Id<"enrollments"> | null>(null);

  const { capabilities, track } = data;
  const otherCohorts = data.cohorts
    .map((c) => c.cohort)
    .filter((c) => c._id !== cohort._id && c.status !== "archived");
  const canAdd =
    capabilities.canAddStudents &&
    track.status === "active" &&
    (cohort.status === "draft" || cohort.status === "active");

  async function run(enrollmentId: Id<"enrollments">, action: () => Promise<null>, success: string) {
    setBusyId(enrollmentId);
    try {
      await action();
      onToast(success);
    } catch (err) {
      onToast(errorMessage(err), "error");
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  }

  return (
    <div style={{ padding: "4px 20px 20px", backgroundColor: "#141414" }}>
      {canAdd && <AddStudentForm trackId={track._id} cohort={cohort} onToast={onToast} />}

      {status === "LoadingFirstPage" ? (
        <p style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)", margin: 0, padding: "12px 0" }}>
          Loading students…
        </p>
      ) : results.length === 0 ? (
        <p style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)", margin: 0, padding: "12px 0" }}>
          No students in {cohort.name} yet.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, marginTop: canAdd ? 16 : 0 }}>
          {results.map((student) => {
            const busy = busyId === student.enrollmentId;
            const firstName = student.fullName.split(" ")[0] || student.fullName;
            return (
              <li
                key={student.enrollmentId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 0",
                  borderTop: "1px solid var(--color-border-subtle)",
                  flexWrap: "wrap",
                  opacity: busy ? 0.5 : 1,
                }}
              >
                <Avatar name={student.fullName} size={28} />
                <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontFamily: font.body,
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--color-text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {student.fullName}
                    </span>
                    {student.userStatus === "suspended" && <StatusBadge tone="warning">Suspended</StatusBadge>}
                    {student.enrollmentStatus === "completed" && <StatusBadge tone="success">Completed</StatusBadge>}
                  </div>
                  <p
                    style={{
                      fontFamily: font.mono,
                      fontSize: 11,
                      color: "var(--color-text-tertiary)",
                      margin: 0,
                      marginTop: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {student.email}
                  </p>
                </div>

                {capabilities.canManageCohorts && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {confirmingId === student.enrollmentId ? (
                      <>
                        <span style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-secondary)" }}>
                          Remove {firstName} from {cohort.name}?
                        </span>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            run(student.enrollmentId, () => unenroll({ enrollmentId: student.enrollmentId }), `${firstName} removed from ${cohort.name}`)
                          }
                          style={dangerButtonStyle}
                        >
                          Remove
                        </button>
                        <button type="button" onClick={() => setConfirmingId(null)} style={ghostButtonStyle}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {otherCohorts.length > 0 && (
                          <select
                            aria-label={`Move ${student.fullName} to another cohort`}
                            value=""
                            disabled={busy}
                            onChange={(e) => {
                              const target = otherCohorts.find((c) => c._id === e.target.value);
                              if (!target) return;
                              void run(
                                student.enrollmentId,
                                () => moveStudent({ enrollmentId: student.enrollmentId, cohortId: target._id }),
                                `${firstName} moved to ${target.name}`,
                              );
                            }}
                            style={{ ...controlStyle, width: "auto", height: 30, padding: "0 10px", fontSize: 13 }}
                            {...focusHandlers}
                          >
                            <option value="" disabled>
                              Move to…
                            </option>
                            {otherCohorts.map((c) => (
                              <option key={c._id} value={c._id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        )}
                        <button type="button" onClick={() => setConfirmingId(student.enrollmentId)} style={ghostButtonStyle}>
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {status === "CanLoadMore" && (
        <button type="button" onClick={() => loadMore(STUDENTS_PAGE_SIZE)} style={{ ...smallButtonStyle, marginTop: 12 }}>
          Load more
        </button>
      )}
    </div>
  );
}

function AddStudentForm({
  trackId,
  cohort,
  onToast,
}: {
  trackId: Id<"tracks">;
  cohort: Cohort;
  onToast: ShowToast;
}) {
  const createInvitation = useMutation(api.invitations.create);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const address = email.trim();
    if (!address) return;
    setSaving(true);
    try {
      const result = await createInvitation({
        email: address,
        platformRole: "member",
        permissions: [],
        trackGrants: [{ trackId, role: "student", cohortId: cohort._id, permissions: [] }],
      });
      onToast(result === "applied" ? `Added ${address} to ${cohort.name}` : `Invitation sent to ${address}`);
      setEmail("");
    } catch (err) {
      onToast(errorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ paddingTop: 12 }}>
      <label htmlFor={`add-student-${cohort._id}`} style={fieldLabelStyle}>
        Add a student
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          id={`add-student-${cohort._id}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          style={{ ...controlStyle, height: 36 }}
          {...focusHandlers}
        />
        <button
          type="submit"
          disabled={!email.trim() || saving}
          style={{
            ...smallButtonStyle,
            height: 36,
            opacity: !email.trim() || saving ? 0.4 : 1,
            cursor: !email.trim() || saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Adding…" : "Add"}
        </button>
      </div>
      <p style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)", margin: 0, marginTop: 6 }}>
        People who already have an account join right away. Anyone else gets an invitation email.
      </p>
    </form>
  );
}
