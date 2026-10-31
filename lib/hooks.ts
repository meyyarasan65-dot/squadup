"use client";

import { useEffect, useState } from "react";

/**
 * Current time, refreshed every `intervalMs`. Returns null until mounted so
 * server and client renders agree (no hydration mismatch on time-based UI).
 */
export function useNow(intervalMs: number): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
