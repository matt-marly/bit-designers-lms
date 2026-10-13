"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CohortsSection } from "./cohorts-section";
import { StaffSection } from "./staff-section";
import {
  StatusBadge,
  cardStyle,
  controlStyle,
  dangerButtonStyle,
  errorMessage,
  fieldLabelStyle,
  focusHandlers,
  font,
  ghostButtonStyle,
  smallButtonStyle,
  type ShowToast,
} from "../ui";

export type TrackAdmin = FunctionReturnType<typeof api.tracks.getForAdmin>;

export function TrackDetail({ trackId, onToast }: { trackId: Id<"tracks">; onToast: ShowToast }) {
  const data = useQuery(api.tracks.getForAdmin, { trackId });

  if (data === undefined) {
    return <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)" }}>Loading track…</p>;
  }

  const archived = data.track.status === "archived";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <TrackHeader data={data} onToast={onToast} />
      {archived ? (
        <p
          style={{
            fontFamily: font.body,
            fontSize: 13,
            color: "var(--color-text-secondary)",
            margin: 0,
            marginTop: -24,
          }}
        >
          This track is archived. Restore it to add cohorts or change its staff.
        </p>
      ) : null}
      <CohortsSection data={data} onToast={onToast} />
      <StaffSection data={data} onToast={onToast} />
    </div>
  );
}

function TrackHeader({ data, onToast }: { data: TrackAdmin; onToast: ShowToast }) {
  const updateTrack = useMutation(api.tracks.update);
  const { track, capabilities } = data;
  const archived = track.status === "archived";

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(track.name);
  const [description, setDescription] = useState(track.description ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const dirty = name.trim() !== track.name || description.trim() !== (track.description ?? "");

  function startEditing() {
    setName(track.name);
    setDescription(track.description ?? "");
    setEditing(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTrack({ trackId: track._id, name, description });
      onToast("Track updated");
      setEditing(false);
    } catch (err) {
      onToast(errorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleArchived() {
    setArchiving(true);
    try {
      await updateTrack({ trackId: track._id, status: archived ? "active" : "archived" });
      onToast(archived ? `${track.name} is active again` : `${track.name} archived`);
      setConfirmingArchive(false);
    } catch (err) {
      onToast(errorMessage(err), "error");
    } finally {
      setArchiving(false);
    }
  }

  if (editing) {
    return (
      <form onSubmit={save} style={{ ...cardStyle, padding: 24 }}>
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label htmlFor="track-name" style={fieldLabelStyle}>
              Track name
            </label>
            <input
              id="track-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              style={controlStyle}
              {...focusHandlers}
            />
          </div>
          <div>
            <label htmlFor="track-description" style={fieldLabelStyle}>
              Description
            </label>
            <textarea
              id="track-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ ...controlStyle, height: "auto", padding: "10px 14px", resize: "vertical", lineHeight: "22px" }}
              {...focusHandlers}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            type="submit"
            disabled={!dirty || !name.trim() || saving}
            style={{
              ...smallButtonStyle,
              height: 34,
              border: "none",
              backgroundColor: "var(--color-indigo)",
              opacity: !dirty || !name.trim() || saving ? 0.4 : 1,
              cursor: !dirty || !name.trim() || saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => setEditing(false)} style={ghostButtonStyle}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div style={{ ...cardStyle, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: "1 1 320px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2
              style={{
                fontFamily: font.display,
                fontSize: 24,
                lineHeight: "30px",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "var(--color-text-primary)",
                margin: 0,
              }}
            >
              {track.name}
            </h2>
            <StatusBadge tone={archived ? "neutral" : "success"}>{archived ? "Archived" : "Active"}</StatusBadge>
          </div>
          <p
            style={{
              fontFamily: font.body,
              fontSize: 14,
              lineHeight: "22px",
              color: track.description ? "var(--color-text-secondary)" : "var(--color-text-tertiary)",
              margin: 0,
              marginTop: 6,
            }}
          >
            {track.description || "No description yet."}
          </p>
        </div>

        {capabilities.canEditTrack && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {confirmingArchive ? (
              <>
                <span style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-secondary)" }}>
                  {archived ? "Restore this track?" : "Archive this track?"}
                </span>
                <button
                  type="button"
                  onClick={toggleArchived}
                  disabled={archiving}
                  style={archived ? smallButtonStyle : { ...dangerButtonStyle, opacity: archiving ? 0.5 : 1 }}
                >
                  {archiving ? "Working…" : archived ? "Restore" : "Archive"}
                </button>
                <button type="button" onClick={() => setConfirmingArchive(false)} style={ghostButtonStyle}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                {!archived && (
                  <button type="button" onClick={startEditing} style={smallButtonStyle}>
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmingArchive(true)}
                  style={{ ...smallButtonStyle, color: archived ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}
                >
                  {archived ? "Restore track" : "Archive"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {confirmingArchive && !archived && (
        <p style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)", margin: 0, marginTop: 12 }}>
          Learners and mentors stop seeing this track. Nothing is deleted, and you can restore it any time.
        </p>
      )}
    </div>
  );
}
