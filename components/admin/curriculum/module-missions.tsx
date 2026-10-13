"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ConfirmStrip, StatusBadge, errorMessage, fieldLabelStyle, font, type ShowToast } from "../ui";
import { IconButton, InlineTitleForm, MonoLabel, padNumber, type OutlineModule } from "./shared";

export type ModuleMissionList = FunctionReturnType<typeof api.missionsEditor.listForModule>;

export function ModuleMissions({
  mod,
  missions,
  onToast,
}: {
  mod: OutlineModule;
  missions: ModuleMissionList | undefined;
  onToast: ShowToast;
}) {
  const router = useRouter();
  const createMission = useMutation(api.missionsEditor.createMission);
  const moveMission = useMutation(api.missionsEditor.moveMission);
  const deleteMission = useMutation(api.missionsEditor.deleteMission);
  const [confirm, setConfirm] = useState<{ id: Id<"missions">; title: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<unknown>, success?: string) {
    setBusy(true);
    try {
      const result = await action();
      if (success) onToast(success);
      return result ?? true;
    } catch (err) {
      onToast(errorMessage(err), "error");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10, gap: 12 }}>
        <span style={{ ...fieldLabelStyle, marginBottom: 0 }}>Missions</span>
        <span style={{ fontFamily: font.body, fontSize: 12, color: "var(--color-text-tertiary)", textAlign: "right" }}>
          Learners finish the module once its lessons are done and its missions are submitted or passed.
        </span>
      </div>

      {missions === undefined ? (
        <p style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)", margin: 0 }}>Loading missions…</p>
      ) : (
        <div style={{ border: "1px solid var(--color-border-subtle)", borderRadius: 10, overflow: "hidden" }}>
          {missions.length === 0 && (
            <p style={{ fontFamily: font.body, fontSize: 13, color: "var(--color-text-tertiary)", margin: 0, padding: "12px 14px" }}>
              No missions. Add one if learners should hand in work for this module.
            </p>
          )}
          {missions.map((mission, i) => (
            <div key={mission._id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 8px 8px 14px" }}>
                <MonoLabel>M{padNumber(i + 1)}</MonoLabel>
                <Link
                  href={`/admin/curriculum/missions/${mission._id}`}
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
                  {mission.title}
                </Link>
                <StatusBadge tone={mission.reviewType === "reviewed" ? "indigo" : "neutral"}>
                  {mission.reviewType === "reviewed" ? "Reviewed" : "Completion"}
                </StatusBadge>
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 11,
                    color: mission.hasBrief ? "var(--color-text-tertiary)" : "#FBBF24",
                    whiteSpace: "nowrap",
                  }}
                  className="max-md:hidden"
                >
                  {mission.hasBrief ? `${mission.criteria} criteria` : "No brief"}
                </span>
                <div style={{ display: "flex", gap: 2 }}>
                  <IconButton
                    label={`Move ${mission.title} up`}
                    icon={ArrowUp}
                    disabled={busy || i === 0}
                    onClick={() => run(() => moveMission({ missionId: mission._id, direction: "up" }))}
                  />
                  <IconButton
                    label={`Move ${mission.title} down`}
                    icon={ArrowDown}
                    disabled={busy || i === missions.length - 1}
                    onClick={() => run(() => moveMission({ missionId: mission._id, direction: "down" }))}
                  />
                  <IconButton
                    label={`Edit ${mission.title}`}
                    icon={Pencil}
                    onClick={() => router.push(`/admin/curriculum/missions/${mission._id}`)}
                  />
                  <IconButton
                    label={`Delete ${mission.title}`}
                    icon={Trash2}
                    tone="danger"
                    onClick={() => setConfirm({ id: mission._id, title: mission.title })}
                  />
                </div>
              </div>
              {confirm?.id === mission._id && (
                <ConfirmStrip
                  message={`Delete “${mission.title}”? Its deadlines go with it. Missions with submissions can't be deleted.`}
                  confirmLabel="Delete mission"
                  danger
                  busy={busy}
                  onConfirm={async () => {
                    const ok = await run(() => deleteMission({ missionId: mission._id }), "Mission deleted");
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
              id={`new-mission-${mod._id}`}
              label={`New mission in ${mod.title}`}
              placeholder="New mission title"
              submitLabel="Add mission"
              busyLabel="Adding…"
              onSubmit={async (title) => {
                const missionId = await run(() => createMission({ moduleId: mod._id, title }));
                if (typeof missionId === "string") {
                  router.push(`/admin/curriculum/missions/${missionId}`);
                  return true;
                }
                return false;
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
