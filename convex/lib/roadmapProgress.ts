import type { Doc } from "../_generated/dataModel";

export type DerivedProgress = "complete" | "in_progress" | "not_started" | null;
export type NodeState = "learning" | "done" | "skipped";

/**
 * Applies an explicit learner state over derived progress.
 * `done` counts as complete without touching lesson/mission records;
 * `skipped` never counts toward completion.
 */
export function applyNodeState(
  derived: DerivedProgress,
  state: NodeState | undefined,
): { progress: DerivedProgress; countsAsComplete: boolean; state: NodeState } {
  if (state === "done") return { progress: "complete", countsAsComplete: true, state };
  if (state === "skipped") return { progress: derived, countsAsComplete: false, state };
  return { progress: derived, countsAsComplete: derived === "complete", state: "learning" };
}

export function statesMap(states: Doc<"roadmapNodeStates">[]): Map<string, NodeState> {
  return new Map(states.map((s) => [s.nodeId, s.state]));
}
