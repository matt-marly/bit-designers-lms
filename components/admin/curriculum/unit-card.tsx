"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ConfirmStrip, StatusBadge, cardStyle, errorMessage, font, type ShowToast } from "../ui";
import { IconButton, InlineTitleForm, MonoLabel, padNumber, type OutlineModule, type OutlineUnit } from "./shared";
import { ModulePanel } from "./module-panel";

export function UnitCard({
  unit,
  index,
  total,
  openModuleId,
  onToggleModule,
  onToast,
}: {
  unit: OutlineUnit;
  index: number;
  total: number;
  openModuleId: Id<"modules"> | null;
  onToggleModule: (moduleId: Id<"modules">) => void;
  onToast: ShowToast;
}) {
  const updateUnit = useMutation(api.curriculumEditor.updateUnit);
  const moveUnit = useMutation(api.curriculumEditor.moveUnit);
  const deleteUnit = useMutation(api.curriculumEditor.deleteUnit);
  const createModule = useMutation(api.curriculumEditor.createModule);
  const [mode, setMode] = useState<"idle" | "rename" | "delete">("idle");
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

  const isEmpty = unit.modules.length === 0;

  return (
    <section aria-labelledby={`unit-${unit._id}`} style={{ ...cardStyle, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 16px 16px 20px",
          borderBottom: "1px solid var(--color-border-subtle)",
          flexWrap: "wrap",
        }}
      >
        <MonoLabel>Unit {padNumber(index + 1)}</MonoLabel>
        {mode === "rename" ? (
          <div style={{ flex: "1 1 320px" }}>
            <InlineTitleForm
              id={`rename-unit-${unit._id}`}
              label="Unit title"
              initial={unit.title}
              submitLabel="Save"
              busyLabel="Saving…"
              onSubmit={async (title) => {
                const ok = await run(() => updateUnit({ unitId: unit._id, title }), "Unit renamed");
                if (ok) setMode("idle");
                return ok;
              }}
              onCancel={() => setMode("idle")}
            />
          </div>
        ) : (
          <>
            <h2
              id={`unit-${unit._id}`}
              style={{
                fontFamily: font.display,
                fontSize: 17,
                lineHeight: "24px",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                margin: 0,
                flex: "1 1 200px",
                minWidth: 0,
              }}
            >
              {unit.title}
            </h2>
            <div style={{ display: "flex", gap: 2 }}>
              <IconButton
                label="Move unit up"
                icon={ArrowUp}
                disabled={busy || index === 0}
                onClick={() => run(() => moveUnit({ unitId: unit._id, direction: "up" }))}
              />
              <IconButton
                label="Move unit down"
                icon={ArrowDown}
                disabled={busy || index === total - 1}
                onClick={() => run(() => moveUnit({ unitId: unit._id, direction: "down" }))}
              />
              <IconButton label="Rename unit" icon={Pencil} onClick={() => setMode("rename")} />
              <IconButton
                label={isEmpty ? "Delete unit" : "Delete this unit's modules first"}
                icon={Trash2}
                tone="danger"
                disabled={!isEmpty}
                onClick={() => setMode("delete")}
              />
            </div>
          </>
        )}
      </div>

      {mode === "delete" && (
        <ConfirmStrip
          message={`Delete “${unit.title}”? It has no modules, so nothing else is affected.`}
          confirmLabel="Delete unit"
          danger
          busy={busy}
          onConfirm={() => run(() => deleteUnit({ unitId: unit._id }), "Unit deleted")}
          onCancel={() => setMode("idle")}
          style={{ padding: "12px 20px" }}
        />
      )}

      {isEmpty ? (
        <p style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)", margin: 0, padding: "16px 20px" }}>
          No modules yet.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {unit.modules.map((mod, i) => (
            <li key={mod._id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
              <ModuleRow
                mod={mod}
                number={`${padNumber(index + 1)}.${padNumber(i + 1)}`}
                open={openModuleId === mod._id}
                onToggle={() => onToggleModule(mod._id)}
              />
              {openModuleId === mod._id && (
                <ModulePanel
                  key={mod._id}
                  mod={mod}
                  isFirst={i === 0}
                  isLast={i === unit.modules.length - 1}
                  onDeleted={() => onToggleModule(mod._id)}
                  onToast={onToast}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <div style={{ padding: "14px 20px", backgroundColor: "#0D0D0D" }}>
        <InlineTitleForm
          id={`new-module-${unit._id}`}
          label={`New module in ${unit.title}`}
          placeholder="New module title"
          submitLabel="Add module"
          busyLabel="Adding…"
          onSubmit={async (title) => {
            let moduleId: Id<"modules"> | null = null;
            const ok = await run(async () => {
              moduleId = (await createModule({ unitId: unit._id, title })).moduleId;
            }, "Module added as a draft");
            if (ok && moduleId) onToggleModule(moduleId);
            return ok;
          }}
        />
      </div>
    </section>
  );
}

function ModuleRow({
  mod,
  number,
  open,
  onToggle,
}: {
  mod: OutlineModule;
  number: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onToggle}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 20px",
        border: "none",
        backgroundColor: open ? "rgba(99,102,241,0.06)" : "transparent",
        cursor: "pointer",
        textAlign: "left",
        transitionProperty: "background-color",
        transitionDuration: "var(--duration-fast)",
      }}
      onMouseEnter={(e) => {
        if (!open) e.currentTarget.style.backgroundColor = "var(--color-bg-surface-2)";
      }}
      onMouseLeave={(e) => {
        if (!open) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <ChevronRight
        size={15}
        aria-hidden
        style={{
          color: "var(--color-text-tertiary)",
          flexShrink: 0,
          transform: open ? "rotate(90deg)" : "none",
          transition: "transform var(--duration-fast) var(--ease-out-quart)",
        }}
      />
      <MonoLabel>{number}</MonoLabel>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: font.body,
          fontSize: 14,
          fontWeight: 500,
          color: "var(--color-text-primary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {mod.title}
      </span>
      <span style={{ fontFamily: font.mono, fontSize: 11, color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>
        {mod.lessonCount} lesson{mod.lessonCount === 1 ? "" : "s"}
      </span>
      <StatusBadge tone={mod.status === "published" ? "success" : "neutral"}>
        {mod.status === "published" ? "Published" : "Draft"}
      </StatusBadge>
    </button>
  );
}
