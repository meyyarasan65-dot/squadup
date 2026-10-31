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
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-800 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
        <Icon className="h-5 w-5 text-zinc-400" aria-hidden />
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="font-medium text-zinc-200">{title}</p>
        {description && <div className="text-sm text-zinc-500">{description}</div>}
      </div>
      {action}
    </div>
  );
}
