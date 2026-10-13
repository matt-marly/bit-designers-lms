/** Shared by the backend and the client, so it must stay free of server imports. */

export const WORKSHOP_LIMITS = {
  title: 120,
  description: 2000,
  hostName: 80,
  timezone: 64,
  minDuration: 15,
  maxDuration: 480,
} as const;

/** Sessions open to join this long before they start. */
export const JOIN_OPENS_BEFORE_MS = 15 * 60 * 1000;

export type WorkshopPhase = "upcoming" | "live" | "past";

export function workshopPhase(scheduledAt: number, endsAt: number, now: number): WorkshopPhase {
  if (now >= endsAt) return "past";
  if (now >= scheduledAt - JOIN_OPENS_BEFORE_MS) return "live";
  return "upcoming";
}
