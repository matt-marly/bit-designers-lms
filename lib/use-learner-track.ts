"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const STORAGE_KEY = "bd:learn-track";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readStored() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * The track the learner is working in. Prefers tracks they're enrolled in as a
 * student and remembers the last one they picked on this device.
 */
export function useLearnerTrack() {
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const stored = useSyncExternalStore(subscribe, readStored, () => null);

  const tracks = me
    ? [...me.tracks].sort((a, b) => Number(b.isStudent) - Number(a.isStudent) || a.name.localeCompare(b.name))
    : [];
  const track = tracks.find((t) => t.trackId === stored) ?? tracks[0] ?? null;

  const selectTrack = useCallback((trackId: string) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, trackId);
    } catch {
      // Private mode or storage disabled: the choice just won't persist.
    }
    listeners.forEach((listener) => listener());
  }, []);

  return { loading: me === undefined, me, tracks, track, selectTrack };
}
