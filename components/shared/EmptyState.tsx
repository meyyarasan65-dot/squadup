import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-dashed border-zinc-800 px-6 py-14 text-center",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-6 h-32 w-56 -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl"
        aria-hidden
      />
      <span className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 shadow-[0_0_24px_-6px_rgb(99_102_241/0.5)]">
        <Icon className="h-5 w-5 text-indigo-300" aria-hidden />
      </span>
      <div className="relative flex max-w-sm flex-col gap-1">
        <p className="font-medium text-zinc-100">{title}</p>
        {description && <div className="text-sm text-zinc-400">{description}</div>}
      </div>
      {action && <div className="relative mt-1">{action}</div>}
    </div>
  );
}
