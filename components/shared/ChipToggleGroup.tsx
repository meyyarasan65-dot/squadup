"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChipToggleGroupProps<T extends string> {
  options: readonly T[];
  value: T[];
  onChange: (value: T[]) => void;
  label?: (option: T) => string;
  max?: number;
  ariaLabel: string;
}

/** Multi-select rendered as toggleable chips (roles, languages). */
export function ChipToggleGroup<T extends string>({
  options,
  value,
  onChange,
  label = (o) => o,
  max,
  ariaLabel,
}: ChipToggleGroupProps<T>) {
  const selected = new Set(value);
  const atMax = max !== undefined && value.length >= max;

  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const on = selected.has(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={on}
            disabled={!on && atMax}
            onClick={() => onChange(on ? value.filter((v) => v !== option) : [...value, option])}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              on
                ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-200"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200",
            )}
          >
            {on && <Check className="h-3 w-3" aria-hidden />}
            {label(option)}
          </button>
        );
      })}
    </div>
  );
}
