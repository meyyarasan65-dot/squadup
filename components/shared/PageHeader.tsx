import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="relative mb-6 flex flex-col gap-4 pb-6 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-stretch gap-3.5">
        <span
          className="w-1 shrink-0 rounded-full bg-gradient-to-b from-indigo-400 via-violet-400 to-cyan-300 shadow-[0_0_14px_rgba(129,140,248,0.5)]"
          aria-hidden
        />
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
          {description && <p className="text-sm text-zinc-400">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      <span
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-indigo-400/40 via-white/10 to-transparent"
        aria-hidden
      />
    </div>
  );
}
