import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export function formatCompact(n: number): string {
  return compact.format(n);
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

/** "3d 4h", "5h 12m", "12m" — coarse remaining time; "0m" once passed. */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return "0m";
  const minutes = Math.floor(ms / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function formatRelative(iso: string, now: number = Date.now()): string {
  const diff = new Date(iso).getTime() - now;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), "minute");
  if (abs < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), "hour");
  return rtf.format(Math.round(diff / 86_400_000), "day");
}

export function errorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}

/** Same-origin relative path only; blocks open redirects (//evil.com, /\evil.com, etc.). */
export function safeRedirectPath(path: string | null | undefined, fallback = "/matchmaker"): string {
  if (!path || typeof path !== "string") return fallback;
  // Disallow any backslashes, control characters, or protocol indicators
  if (path.includes("\\") || /[\0-\x1F\x7F]/.test(path) || path.includes(":")) {
    return fallback;
  }
  // Must start with exactly one forward slash, followed by a non-slash character
  if (!path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }
  try {
    const dummyOrigin = "http://localhost:3000";
    const resolved = new URL(path, dummyOrigin);
    if (resolved.origin !== dummyOrigin) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}

/** `${teamId}:${userId}` key for a live invite between a team and a user. */
export function pairKey(teamId: string, userId: string): string {
  return `${teamId}:${userId}`;
}
