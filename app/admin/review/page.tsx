"use client";

import { Suspense } from "react";
import { CheckCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Toast, cardStyle, font, useToast } from "@/components/admin/ui";
import { ReviewCard } from "@/components/admin/review/review-card";

type Tab = "to_review" | "in_review" | "reviewed";

const TABS: { value: Tab; label: string }[] = [
  { value: "to_review", label: "To review" },
  { value: "in_review", label: "In review" },
  { value: "reviewed", label: "Reviewed" },
];

const EMPTY: Record<Tab, string> = {
  to_review: "Nothing waiting for review.",
  in_review: "Nobody is in the middle of a review.",
  reviewed: "No reviews yet.",
};

export default function ReviewQueuePage() {
  return (
    <Suspense fallback={null}>
      <ReviewQueue />
    </Suspense>
  );
}

function ReviewQueue() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast, showToast } = useToast();
  const tracks = useQuery(api.reviews.reviewableTracks);

  const requestedTab = searchParams.get("tab");
  const tab: Tab = TABS.some((t) => t.value === requestedTab) ? (requestedTab as Tab) : "to_review";
  const requestedTrack = searchParams.get("track");
  const trackId = tracks?.find((t) => t._id === requestedTrack)?._id;
  const entries = useQuery(api.reviews.queue, tracks === undefined ? "skip" : { tab, trackId });

  const waiting = (tracks ?? [])
    .filter((t) => trackId === undefined || t._id === trackId)
    .reduce((sum, t) => sum + t.waiting, 0);

  function setParams(next: { tab?: Tab; track?: Id<"tracks"> | null }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.tab) params.set("tab", next.tab);
    if (next.track === null) params.delete("track");
    else if (next.track) params.set("track", next.track);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div>
      <h1
        style={{
          fontFamily: font.display,
          fontSize: 36,
          lineHeight: "42px",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--color-text-primary)",
          margin: 0,
        }}
      >
        Review Queue
      </h1>
      <p style={{ fontFamily: font.body, fontSize: 14, lineHeight: "22px", color: "var(--color-text-secondary)", margin: "6px 0 0" }}>
        {tracks === undefined
          ? "Loading…"
          : waiting === 0
            ? "You're all caught up."
            : `${waiting >= 100 ? "100+" : waiting} submission${waiting === 1 ? "" : "s"} waiting for review, oldest first.`}
      </p>

      {tracks !== undefined && tracks.length > 1 && (
        <div role="group" aria-label="Track" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 24 }}>
          {[{ _id: null, name: "All tracks", waiting: 0 }, ...tracks].map((t) => {
            const selected = (t._id ?? undefined) === trackId;
            return (
              <button
                key={t._id ?? "all"}
                type="button"
                aria-pressed={selected}
                onClick={() => setParams({ track: t._id })}
                style={{
                  height: 34,
                  padding: "0 14px",
                  borderRadius: 999,
                  border: `1px solid ${selected ? "rgba(99,102,241,0.55)" : "var(--color-border-strong)"}`,
                  backgroundColor: selected ? "rgba(99,102,241,0.12)" : "transparent",
                  color: selected ? "#A5B4FC" : "var(--color-text-secondary)",
                  fontFamily: font.body,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {t.name}
                {t._id !== null && t.waiting > 0 && (
                  <span style={{ fontFamily: font.mono, fontSize: 11, color: "var(--color-text-tertiary)" }}>{t.waiting}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div
        role="tablist"
        aria-label="Review status"
        style={{ display: "flex", borderBottom: "1px solid var(--color-border-subtle)", marginTop: 24, marginBottom: 24 }}
      >
        {TABS.map((t) => {
          const selected = t.value === tab;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setParams({ tab: t.value })}
              style={{
                padding: "10px 14px",
                marginBottom: -1,
                fontFamily: font.body,
                fontSize: 13,
                fontWeight: 500,
                color: selected ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                background: "none",
                border: "none",
                borderBottom: selected ? "2px solid var(--color-indigo)" : "2px solid transparent",
                cursor: "pointer",
              }}
            >
              {t.label}
              {t.value === "to_review" && waiting > 0 && (
                <span style={{ fontFamily: font.mono, fontSize: 11, color: "var(--color-text-tertiary)", marginLeft: 6 }}>
                  {waiting >= 100 ? "99+" : waiting}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tracks !== undefined && tracks.length === 0 ? (
        <div style={{ ...cardStyle, padding: 32, textAlign: "center" }}>
          <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }}>
            You don&apos;t review work in any track.
          </p>
        </div>
      ) : entries === undefined ? (
        <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)" }}>Loading submissions…</p>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          {tab === "to_review" && <CheckCircle size={32} aria-hidden style={{ display: "block", color: "#22C55E", margin: "0 auto 12px" }} />}
          <p style={{ fontFamily: font.body, fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>{EMPTY[tab]}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {entries.map((entry) => (
            <ReviewCard key={entry._id} entry={entry} onToast={showToast} />
          ))}
          {entries.length >= 50 && (
            <p style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)", textAlign: "center", margin: 0 }}>
              {tab === "reviewed" ? "Showing the 50 most recent reviews." : "Showing the oldest 50."}
            </p>
          )}
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}
