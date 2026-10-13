"use client";

import { AlertCircle, CheckCircle, Circle, Clock } from "lucide-react";
import { font } from "./ui";

export type MissionStatus = "not_started" | "submitted" | "in_review" | "passed" | "needs_revision";
export type ReviewType = "completion_only" | "reviewed";

/** Completion-only work is stored as passed, but learners should read it as "Submitted". */
export function missionStatusLabel(status: MissionStatus, reviewType: ReviewType) {
  switch (status) {
    case "passed":
      return reviewType === "completion_only" ? "Submitted" : "Passed";
    case "needs_revision":
      return "Needs revision";
    case "submitted":
      return "Waiting for review";
    case "in_review":
      return "In review";
    case "not_started":
      return "Not started";
  }
}

export function MissionStatusIndicator({
  status,
  reviewType,
  size = 13,
}: {
  status: MissionStatus;
  reviewType: ReviewType;
  size?: number;
}) {
  const label = missionStatusLabel(status, reviewType);
  const color =
    status === "passed" ? "#4ADE80" : status === "needs_revision" ? "#FBBF24" : "var(--color-text-tertiary)";
  const Icon =
    status === "passed" ? CheckCircle : status === "needs_revision" ? AlertCircle : status === "not_started" ? Circle : Clock;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <Icon aria-hidden style={{ width: size, height: size, color, flexShrink: 0 }} />
      <span style={{ fontFamily: font.body, fontSize: 12, fontWeight: 500, lineHeight: "16px", color }}>{label}</span>
    </span>
  );
}

export function shortDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function longDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

/** Overdue means past the due date with nothing that counts yet. */
export function isOverdue(dueAt: number | null, satisfied: boolean, status: MissionStatus) {
  if (dueAt === null || satisfied) return false;
  if (status === "submitted" || status === "in_review") return false;
  return Date.now() > dueAt;
}

export function daysUntil(ms: number) {
  return Math.ceil((ms - Date.now()) / 86_400_000);
}
