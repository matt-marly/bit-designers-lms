"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ArrowDown, ArrowUp, ExternalLink, FileText, Link2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  MAX_RESOURCE_FILE_BYTES,
  RESOURCE_CATEGORIES,
  RESOURCE_FILE_TYPES,
  RESOURCE_LIMITS,
  type ResourceKind,
} from "@/convex/lib/resources";
import {
  ConfirmStrip,
  SectionHeader,
  StatusBadge,
  Toast,
  cardStyle,
  controlStyle,
  errorMessage,
  fieldLabelStyle,
  focusHandlers,
  font,
  ghostButtonStyle,
  smallButtonStyle,
  useToast,
  type ShowToast,
} from "@/components/admin/ui";
import { uploadToConvex } from "@/lib/upload";

type AdminData = FunctionReturnType<typeof api.resources.listForAdmin>;
type Resource = AdminData["resources"][number];

const kindTabs: { kind: ResourceKind; label: string; blurb: string }[] = [
  { kind: "material", label: "Materials", blurb: "Readings, guides and PDFs on the learner Materials page." },
  { kind: "reference", label: "Reference", blurb: "Videos and talks on the learner Reference page." },
];

export default function ResourcesPage() {
  const [kind, setKind] = useState<ResourceKind>("material");
  const data = useQuery(api.resources.listForAdmin, { kind });
  const { toast, showToast } = useToast();
  const [editing, setEditing] = useState<Resource | null>(null);
  const tab = kindTabs.find((t) => t.kind === kind)!;

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
        Resources
      </h1>
      <p style={{ fontFamily: font.body, fontSize: 15, color: "var(--color-text-secondary)", margin: "8px 0 24px" }}>
        {tab.blurb}
      </p>

      <div role="tablist" aria-label="Resource type" style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {kindTabs.map((t) => {
          const selected = t.kind === kind;
          return (
            <button
              key={t.kind}
              role="tab"
              aria-selected={selected}
              type="button"
              onClick={() => {
                setKind(t.kind);
                setEditing(null);
              }}
              style={{
                height: 34,
                padding: "0 16px",
                borderRadius: 999,
                border: `1px solid ${selected ? "rgba(99,102,241,0.55)" : "var(--color-border-strong)"}`,
                backgroundColor: selected ? "rgba(99,102,241,0.12)" : "transparent",
                color: selected ? "#A5B4FC" : "var(--color-text-secondary)",
                fontFamily: font.body,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {data === undefined ? (
        <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)" }}>Loading resources…</p>
      ) : (
        <>
          <ResourceForm
            key={`${kind}-${editing?._id ?? "new"}`}
            kind={kind}
            tracks={data.tracks}
            editing={editing}
            onDone={() => setEditing(null)}
            showToast={showToast}
          />
          {RESOURCE_CATEGORIES[kind].map((category) => {
            const items = data.resources.filter((r) => r.category === category.id);
            return (
              <section key={category.id} style={{ marginTop: 40 }}>
                <SectionHeader title={category.label} meta={items.length} />
                {items.length === 0 ? (
                  <div style={{ ...cardStyle, padding: 20 }}>
                    <p style={{ fontFamily: font.body, fontSize: 14, color: "var(--color-text-tertiary)", margin: 0 }}>
                      Nothing in this section yet.
                    </p>
                  </div>
                ) : (
                  <div style={{ ...cardStyle, overflow: "hidden" }}>
                    {items.map((r, i) => (
                      <ResourceRow
                        key={r._id}
                        resource={r}
                        first={i === 0}
                        last={i === items.length - 1}
                        trackName={data.tracks.find((t) => t._id === r.trackId)?.name ?? null}
                        onEdit={() => {
                          setEditing(r);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        showToast={showToast}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </>
      )}

      <Toast toast={toast} />
    </div>
  );
}

function ResourceForm({
  kind,
  tracks,
  editing,
  onDone,
  showToast,
}: {
  kind: ResourceKind;
  tracks: AdminData["tracks"];
  editing: Resource | null;
  onDone: () => void;
  showToast: ShowToast;
}) {
  const create = useMutation(api.resources.create);
  const update = useMutation(api.resources.update);
  const generateUploadUrl = useMutation(api.resources.generateUploadUrl);
  const fileInput = useRef<HTMLInputElement>(null);
  const categories = RESOURCE_CATEGORIES[kind];

  const [category, setCategory] = useState(editing?.category ?? categories[0].id);
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [resourceType, setResourceType] = useState<"link" | "file">(editing?.resourceType ?? "link");
  const [url, setUrl] = useState(editing?.resourceType === "link" ? (editing.url ?? "") : "");
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState(editing?.meta ?? "");
  const [source, setSource] = useState(editing?.source ?? "");
  const [trackId, setTrackId] = useState<string>(editing?.trackId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasFile = file !== null || (editing?.resourceType === "file" && resourceType === "file");
  const canSave = title.trim() !== "" && (resourceType === "link" ? url.trim() !== "" : hasFile);

  function pickFile(next: File | undefined) {
    setError(null);
    if (!next) return;
    if (!(RESOURCE_FILE_TYPES as readonly string[]).includes(next.type)) {
      setError("Upload a PDF");
      return;
    }
    if (next.size > MAX_RESOURCE_FILE_BYTES) {
      setError("Files must be 20 MB or smaller");
      return;
    }
    setFile(next);
  }

  async function save() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      let fileId: Id<"_storage"> | undefined;
      if (resourceType === "file" && file) {
        fileId = await uploadToConvex(await generateUploadUrl({}), file);
      }
      const fields = {
        category,
        title,
        description,
        resourceType,
        url: resourceType === "link" ? url : undefined,
        fileId,
        fileName: resourceType === "file" ? (file?.name ?? editing?.fileName ?? undefined) : undefined,
        meta,
        source: kind === "reference" ? source : undefined,
        trackId: trackId ? (trackId as Id<"tracks">) : undefined,
      };
      const result = editing ? await update({ resourceId: editing._id, ...fields }) : await create({ kind, ...fields });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      showToast(editing ? "Resource updated" : "Resource added");
      if (editing) {
        onDone();
      } else {
        setTitle("");
        setDescription("");
        setUrl("");
        setFile(null);
        setMeta("");
        setSource("");
      }
    } catch (err) {
      setError(err instanceof Error && err.message === "Upload failed" ? "The upload failed. Try again." : errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ ...cardStyle, padding: 24 }}>
      <h2 style={{ ...fieldLabelStyle, color: "var(--color-text-tertiary)", marginBottom: 20 }}>
        {editing ? "Edit resource" : kind === "material" ? "Add material" : "Add reference"}
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <Field label="Section" htmlFor="resource-category">
          <select
            id="resource-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ ...controlStyle, cursor: "pointer" }}
            {...focusHandlers}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Shown in" htmlFor="resource-track">
          <select
            id="resource-track"
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            style={{ ...controlStyle, cursor: "pointer" }}
            {...focusHandlers}
          >
            <option value="">Every track</option>
            {tracks.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} only
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div style={{ marginTop: 16 }}>
        <Field label="Title" htmlFor="resource-title">
          <input
            id="resource-title"
            value={title}
            maxLength={RESOURCE_LIMITS.title}
            onChange={(e) => setTitle(e.target.value)}
            style={controlStyle}
            {...focusHandlers}
          />
        </Field>
      </div>

      <div style={{ marginTop: 16 }}>
        <Field label="Description" htmlFor="resource-description">
          <textarea
            id="resource-description"
            rows={2}
            value={description}
            maxLength={RESOURCE_LIMITS.description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ ...controlStyle, height: "auto", padding: "10px 14px", lineHeight: "22px", resize: "vertical" }}
            {...focusHandlers}
          />
        </Field>
      </div>

      {kind === "material" && (
        <div style={{ marginTop: 16 }}>
          <span style={fieldLabelStyle}>Format</span>
          <div role="radiogroup" aria-label="Format" style={{ display: "flex", gap: 8 }}>
            {(["link", "file"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={resourceType === t}
                onClick={() => setResourceType(t)}
                style={{
                  ...smallButtonStyle,
                  height: 34,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  borderColor: resourceType === t ? "rgba(99,102,241,0.55)" : "var(--color-border-strong)",
                  backgroundColor: resourceType === t ? "rgba(99,102,241,0.12)" : "transparent",
                  color: resourceType === t ? "#A5B4FC" : "var(--color-text-secondary)",
                }}
              >
                {t === "link" ? <Link2 aria-hidden style={{ width: 14, height: 14 }} /> : <FileText aria-hidden style={{ width: 14, height: 14 }} />}
                {t === "link" ? "Link" : "PDF upload"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        {resourceType === "link" ? (
          <Field label={kind === "reference" ? "Video link" : "Link"} htmlFor="resource-url">
            <input
              id="resource-url"
              type="url"
              inputMode="url"
              value={url}
              placeholder="https://"
              onChange={(e) => setUrl(e.target.value)}
              style={controlStyle}
              {...focusHandlers}
            />
          </Field>
        ) : (
          <div>
            <span style={fieldLabelStyle}>PDF (up to 20 MB)</span>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" style={{ ...smallButtonStyle, height: 36 }} onClick={() => fileInput.current?.click()}>
                {hasFile ? "Replace file" : "Choose file"}
              </button>
              <span style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-secondary)" }}>
                {file?.name ?? (editing?.resourceType === "file" ? editing.fileName ?? "Current file" : "No file chosen")}
              </span>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept={RESOURCE_FILE_TYPES.join(",")}
              hidden
              onChange={(e) => {
                pickFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 16 }}>
        <Field label={kind === "reference" ? "Duration" : "Read time"} htmlFor="resource-meta">
          <input
            id="resource-meta"
            value={meta}
            maxLength={RESOURCE_LIMITS.meta}
            placeholder={kind === "reference" ? "25 min" : "10 min"}
            onChange={(e) => setMeta(e.target.value)}
            style={controlStyle}
            {...focusHandlers}
          />
        </Field>
        {kind === "reference" && (
          <Field label="Source" htmlFor="resource-source">
            <input
              id="resource-source"
              value={source}
              maxLength={RESOURCE_LIMITS.source}
              placeholder="YouTube"
              onChange={(e) => setSource(e.target.value)}
              style={controlStyle}
              {...focusHandlers}
            />
          </Field>
        )}
      </div>

      {error && (
        <p role="alert" style={{ fontFamily: font.body, fontSize: 13, color: "#F87171", margin: "16px 0 0" }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
        {editing && (
          <button type="button" style={ghostButtonStyle} onClick={onDone} disabled={saving}>
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={save}
          disabled={!canSave || saving}
          style={{
            ...smallButtonStyle,
            height: 36,
            padding: "0 16px",
            backgroundColor: "var(--color-indigo)",
            borderColor: "var(--color-indigo)",
            color: "#fff",
            opacity: !canSave || saving ? 0.5 : 1,
            cursor: !canSave || saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving…" : editing ? "Save changes" : "Add resource"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} style={fieldLabelStyle}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ResourceRow({
  resource: r,
  first,
  last,
  trackName,
  onEdit,
  showToast,
}: {
  resource: Resource;
  first: boolean;
  last: boolean;
  trackName: string | null;
  onEdit: () => void;
  showToast: ShowToast;
}) {
  const move = useMutation(api.resources.move);
  const remove = useMutation(api.resources.remove);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleMove(direction: "up" | "down") {
    try {
      await move({ resourceId: r._id, direction });
    } catch (err) {
      showToast(errorMessage(err), "error");
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await remove({ resourceId: r._id });
      showToast("Resource deleted");
    } catch (err) {
      showToast(errorMessage(err), "error");
      setBusy(false);
    }
  }

  const iconButton: React.CSSProperties = { ...ghostButtonStyle, width: 30, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" };

  return (
    <div style={{ borderTop: first ? "none" : "1px solid var(--color-border-subtle)" }}>
      <div style={{ padding: "14px 20px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <button type="button" aria-label="Move up" disabled={first} style={{ ...iconButton, height: 18, opacity: first ? 0.3 : 1 }} onClick={() => handleMove("up")}>
            <ArrowUp aria-hidden style={{ width: 13, height: 13 }} />
          </button>
          <button type="button" aria-label="Move down" disabled={last} style={{ ...iconButton, height: 18, opacity: last ? 0.3 : 1 }} onClick={() => handleMove("down")}>
            <ArrowDown aria-hidden style={{ width: 13, height: 13 }} />
          </button>
        </div>
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <p style={{ fontFamily: font.body, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>{r.title}</p>
          <p style={{ fontFamily: font.mono, fontSize: 11, color: "var(--color-text-tertiary)", margin: "4px 0 0" }}>
            {[r.resourceType === "file" ? "PDF" : "Link", r.meta, r.source].filter(Boolean).join(" · ")}
          </p>
        </div>
        <StatusBadge tone={trackName ? "warning" : "neutral"}>{trackName ? `${trackName} only` : "Every track"}</StatusBadge>
        <div style={{ display: "flex", gap: 8 }}>
          {r.url && (
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${r.title}`}
              style={{ ...iconButton, height: 30, color: "var(--color-text-secondary)" }}
            >
              <ExternalLink aria-hidden style={{ width: 14, height: 14 }} />
            </a>
          )}
          <button type="button" style={smallButtonStyle} onClick={onEdit}>
            Edit
          </button>
          <button type="button" style={ghostButtonStyle} onClick={() => setConfirming(true)}>
            Delete
          </button>
        </div>
      </div>
      {confirming && (
        <ConfirmStrip
          message={`Delete "${r.title}"? Learners won't see it anymore.`}
          confirmLabel="Delete"
          danger
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
