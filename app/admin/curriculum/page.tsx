"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Toast, cardStyle, errorMessage, font, useToast } from "@/components/admin/ui";
import { InlineTitleForm } from "@/components/admin/curriculum/shared";
import { UnitCard } from "@/components/admin/curriculum/unit-card";

export default function CurriculumPage() {
  return (
    <Suspense fallback={null}>
      <Curriculum />
    </Suspense>
  );
}

function Curriculum() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tracks = useQuery(api.curriculumEditor.listEditableTracks);
  const { toast, showToast } = useToast();

  const requestedTrack = searchParams.get("track");
  const track = tracks?.find((t) => t._id === requestedTrack) ?? tracks?.[0] ?? null;
  const openModuleId = (searchParams.get("module") as Id<"modules"> | null) ?? null;

  function setParams(next: { track?: string; module?: string | null }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.track) params.set("track", next.track);
    if (next.module === null) params.delete("module");
    else if (next.module) params.set("module", next.module);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
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
          Curriculum
        </h1>
        <p
          style={{
            fontFamily: font.body,
            fontSize: 14,
            lineHeight: "22px",
            color: "var(--color-text-secondary)",
            margin: 0,
            marginTop: 6,
          }}
        >
          Units group modules, and modules hold lessons. Learners only see modules once they&apos;re published.
        </p>
      </div>

      {tracks === undefined ? (
        <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)" }}>Loading…</p>
      ) : track === null ? (
        <div style={{ ...cardStyle, padding: 32, textAlign: "center" }}>
          <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }}>
            You can&apos;t edit the curriculum of any active track.
          </p>
        </div>
      ) : (
        <>
          {tracks.length > 1 && (
            <div role="group" aria-label="Track" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
              {tracks.map((t) => {
                const selected = t._id === track._id;
                return (
                  <button
                    key={t._id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setParams({ track: t._id, module: null })}
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
                    }}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          )}
          <TrackOutline
            key={track._id}
            trackId={track._id}
            trackName={track.name}
            openModuleId={openModuleId}
            onToggleModule={(moduleId) =>
              setParams({ track: track._id, module: moduleId === openModuleId ? null : moduleId })
            }
            onToast={showToast}
          />
        </>
      )}

      <Toast toast={toast} />
    </div>
  );
}

function TrackOutline({
  trackId,
  trackName,
  openModuleId,
  onToggleModule,
  onToast,
}: {
  trackId: Id<"tracks">;
  trackName: string;
  openModuleId: Id<"modules"> | null;
  onToggleModule: (moduleId: Id<"modules">) => void;
  onToast: ReturnType<typeof useToast>["showToast"];
}) {
  const outline = useQuery(api.curriculumEditor.outline, { trackId });
  const createUnit = useMutation(api.curriculumEditor.createUnit);
  const [adding, setAdding] = useState(false);

  if (outline === undefined) {
    return <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)" }}>Loading curriculum…</p>;
  }

  const moduleCount = outline.reduce((sum, unit) => sum + unit.modules.length, 0);
  const publishedCount = outline.reduce(
    (sum, unit) => sum + unit.modules.filter((m) => m.status === "published").length,
    0,
  );

  return (
    <div>
      <p
        style={{
          fontFamily: font.mono,
          fontSize: 12,
          color: "var(--color-text-tertiary)",
          margin: 0,
          marginBottom: 16,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {trackName} · {outline.length} unit{outline.length === 1 ? "" : "s"} · {moduleCount} module
        {moduleCount === 1 ? "" : "s"} · {publishedCount} published
      </p>

      {outline.length === 0 && (
        <div style={{ ...cardStyle, padding: 32, textAlign: "center", marginBottom: 16 }}>
          <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }}>
            No units yet. Start with a unit, then add modules and lessons to it.
          </p>
        </div>
      )}

      <div style={{ display: "grid", gap: 16 }}>
        {outline.map((unit, i) => (
          <UnitCard
            key={unit._id}
            unit={unit}
            index={i}
            total={outline.length}
            openModuleId={openModuleId}
            onToggleModule={onToggleModule}
            onToast={onToast}
          />
        ))}
      </div>

      <div style={{ ...cardStyle, padding: "14px 20px", marginTop: 16, borderStyle: "dashed" }}>
        {adding || outline.length === 0 ? (
          <InlineTitleForm
            id="new-unit"
            label="New unit title"
            placeholder="New unit title, e.g. Bitcoin Foundations"
            submitLabel="Add unit"
            busyLabel="Adding…"
            onSubmit={async (title) => {
              try {
                await createUnit({ trackId, title });
                onToast("Unit added");
                setAdding(false);
                return true;
              } catch (err) {
                onToast(errorMessage(err), "error");
                return false;
              }
            }}
            onCancel={outline.length > 0 ? () => setAdding(false) : undefined}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            style={{
              border: "none",
              background: "none",
              padding: 0,
              fontFamily: font.body,
              fontSize: 14,
              fontWeight: 500,
              color: "#A5B4FC",
              cursor: "pointer",
            }}
          >
            + Add unit
          </button>
        )}
      </div>
    </div>
  );
}
