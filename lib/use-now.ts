"use client";

import { useCallback, useSyncExternalStore } from "react";

/** The current time, rounded down to `intervalMs` and refreshed on that interval. */
export function useNow(intervalMs = 30_000) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const id = setInterval(onChange, Math.min(intervalMs, 30_000));
      return () => clearInterval(id);
    },
    [intervalMs],
  );
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => 0,
  );
}
