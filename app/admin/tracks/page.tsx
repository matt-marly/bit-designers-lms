"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { PrimaryButton } from "@/components/ui/custom/buttons";
import { TrackDetail } from "@/components/admin/tracks/track-detail";
import {
  Toast,
  cardStyle,
  controlStyle,
  errorMessage,
  fieldLabelStyle,
  focusHandlers,
  font,
  ghostButtonStyle,
  useToast,
  type ShowToast,
} from "@/components/admin/ui";
import { hasPlatformPermission } from "@/lib/access";

type TrackSummary = FunctionReturnType<typeof api.tracks.listForAdmin>[number];

export default function TracksPage() {
  const me = useQuery(api.users.me);
  const tracks = useQuery(api.tracks.listForAdmin);
  const [selectedId, setSelectedId] = useState<Id<"tracks"> | null>(null);
  const [creating, setCreating] = useState(false);
  const { toast, showToast } = useToast();

  const canCreate = me ? hasPlatformPermission(me, "tracks.manage") : false;
  const selected = tracks?.find((t) => t._id === selectedId) ?? tracks?.[0] ?? null;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 28,
          flexWrap: "wrap",
        }}
      >
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
            Tracks
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
            Each track has its own mentors and runs in cohorts.
          </p>
        </div>
        {canCreate && !creating && (
          <PrimaryButton icon={Plus} onClick={() => setCreating(true)}>
            New track
          </PrimaryButton>
        )}
      </div>

      {creating && (
        <NewTrackForm
          onCancel={() => setCreating(false)}
          onCreated={(trackId, name) => {
            setCreating(false);
            setSelectedId(trackId);
            showToast(`Created ${name}`);
          }}
          onToast={showToast}
        />
      )}

      {tracks === undefined ? (
        <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)" }}>Loading tracks…</p>
      ) : tracks.length === 0 ? (
        <div style={{ ...cardStyle, padding: 32, textAlign: "center" }}>
          <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }}>
            {canCreate ? "No tracks yet. Create the first one to start adding cohorts." : "You don't manage any tracks yet."}
          </p>
        </div>
      ) : (
        <>
          <div
            role="group"
            aria-label="Tracks"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
              gap: 10,
              marginBottom: 32,
            }}
          >
            {tracks.map((track) => (
              <TrackCard
                key={track._id}
                track={track}
                selected={selected?._id === track._id}
                onSelect={() => setSelectedId(track._id)}
              />
            ))}
          </div>

          {selected && <TrackDetail key={selected._id} trackId={selected._id} onToast={showToast} />}
        </>
      )}

      <Toast toast={toast} />
    </div>
  );
}

function TrackCard({
  track,
  selected,
  onSelect,
}: {
  track: TrackSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  const archived = track.status === "archived";
  const staffLine = track.leadName
    ? `Led by ${track.leadName}`
    : "No lead mentor";
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      style={{
        textAlign: "left",
        padding: "14px 16px",
        borderRadius: 14,
        border: `1px solid ${selected ? "rgba(99,102,241,0.55)" : "var(--color-border-subtle)"}`,
        backgroundColor: selected ? "rgba(99,102,241,0.08)" : "var(--color-bg-surface)",
        cursor: "pointer",
        opacity: archived && !selected ? 0.6 : 1,
        transitionProperty: "background-color, border-color, opacity",
        transitionDuration: "var(--duration-fast)",
        transitionTimingFunction: "var(--ease-out-quart)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span
          style={{
            fontFamily: font.body,
            fontSize: 14,
            fontWeight: 600,
            color: selected ? "#FFFFFF" : "var(--color-text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {track.name}
        </span>
        {archived && (
          <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: "0.08em", color: "var(--color-text-tertiary)" }}>
            ARCHIVED
          </span>
        )}
      </div>
      <p
        style={{
          fontFamily: font.body,
          fontSize: 12,
          color: track.leadName ? "var(--color-text-secondary)" : "#FBBF24",
          margin: 0,
          marginTop: 4,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {staffLine}
        {track.coMentorCount > 0 && (
          <span style={{ color: "var(--color-text-tertiary)" }}>
            {" "}
            + {track.coMentorCount} co-mentor{track.coMentorCount === 1 ? "" : "s"}
          </span>
        )}
      </p>
      <p
        style={{
          fontFamily: font.mono,
          fontSize: 11,
          color: "var(--color-text-tertiary)",
          margin: 0,
          marginTop: 10,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {track.cohortCount} cohort{track.cohortCount === 1 ? "" : "s"}
        {track.activeCohortCount > 0 && (
          <span style={{ color: "#4ADE80" }}> · {track.activeCohortCount} active</span>
        )}
      </p>
    </button>
  );
}

function NewTrackForm({
  onCancel,
  onCreated,
  onToast,
}: {
  onCancel: () => void;
  onCreated: (trackId: Id<"tracks">, name: string) => void;
  onToast: ShowToast;
}) {
  const createTrack = useMutation(api.tracks.create);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const trackId = await createTrack({ name, description: description || undefined });
      onCreated(trackId, name.trim());
    } catch (err) {
      onToast(errorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ ...cardStyle, padding: 24, marginBottom: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <div>
          <label htmlFor="new-track-name" style={fieldLabelStyle}>
            Track name
          </label>
          <input
            id="new-track-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Product Lab"
            autoFocus
            required
            style={controlStyle}
            {...focusHandlers}
          />
        </div>
        <div>
          <label htmlFor="new-track-description" style={fieldLabelStyle}>
            Description <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id="new-track-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What learners will work on"
            style={controlStyle}
            {...focusHandlers}
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          type="submit"
          disabled={!name.trim() || saving}
          style={{
            height: 36,
            padding: "0 16px",
            borderRadius: 10,
            border: "none",
            backgroundColor: "var(--color-indigo)",
            color: "var(--color-text-on-accent)",
            fontFamily: font.body,
            fontSize: 14,
            fontWeight: 500,
            cursor: !name.trim() || saving ? "not-allowed" : "pointer",
            opacity: !name.trim() || saving ? 0.4 : 1,
          }}
        >
          {saving ? "Creating…" : "Create track"}
        </button>
        <button type="button" onClick={onCancel} style={ghostButtonStyle}>
          Cancel
        </button>
      </div>
    </form>
  );
}
