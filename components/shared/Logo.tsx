import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span
        style={{ width: 28, height: 28, minWidth: 28, minHeight: 28 }}
        className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-400 shadow-[0_0_24px_-4px_rgb(99_102_241/0.8)]"
      >
        <svg
          width={16}
          height={16}
          style={{ width: 16, height: 16, minWidth: 16, minHeight: 16 }}
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden
        >
          <circle cx="8" cy="9" r="3" />
          <circle cx="16" cy="9" r="3" />
          <path d="M3 19c.8-2.6 2.8-4 5-4s4.2 1.4 5 4M11 19c.8-2.6 2.8-4 5-4s4.2 1.4 5 4" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-white">Squadup</span>
    </Link>
  );
}
