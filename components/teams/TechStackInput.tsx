"use client";

import { Check, Plus, X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { STACK_OPTIONS, languageColor } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TechStackInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
}

export function TechStackInput({ value = [], onChange, max = 15 }: TechStackInputProps) {
  const [customInput, setCustomInput] = useState("");
  const atMax = value.length >= max;

  const addTag = (rawName: string) => {
    const trimmed = rawName.trim();
    if (!trimmed || atMax) return;

    // Case-insensitive duplicate check
    const exists = value.some((v) => v.toLowerCase() === trimmed.toLowerCase());
    if (exists) return;

    onChange([...value, trimmed]);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase()));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      e.stopPropagation();
      addTag(customInput);
      setCustomInput("");
    }
  };

  const handleAddClick = () => {
    addTag(customInput);
    setCustomInput("");
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Selected tags list with remove button */}
      {value.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5">
          {value.map((tech) => (
            <span
              key={tech}
              className="inline-flex items-center gap-1.5 rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-200"
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: languageColor(tech) }}
                aria-hidden
              />
              {tech}
              <button
                type="button"
                onClick={() => removeTag(tech)}
                className="rounded p-0.5 text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition-colors"
                title={`Remove ${tech}`}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {tech}</span>
              </button>
            </span>
          ))}
          <span className="ml-auto text-[11px] font-medium text-zinc-500">
            {value.length}/{max} selected
          </span>
        </div>
      )}

      {/* Input field for typing custom tech stack */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={atMax ? `Maximum ${max} technologies reached` : "Type custom tech (e.g. Next.js, PyTorch, Supabase)..."}
          disabled={atMax}
          className="h-9 flex-1 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white placeholder-zinc-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleAddClick}
          disabled={!customInput.trim() || atMax}
          className="inline-flex h-9 items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {/* Built-in Recommendations */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-zinc-400">Recommended options:</span>
        <div className="flex flex-wrap gap-1.5">
          {STACK_OPTIONS.map((option) => {
            const isSelected = value.some((v) => v.toLowerCase() === option.toLowerCase());
            return (
              <button
                key={option}
                type="button"
                aria-pressed={isSelected}
                disabled={!isSelected && atMax}
                onClick={() => {
                  if (isSelected) {
                    removeTag(option);
                  } else {
                    addTag(option);
                  }
                }}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  isSelected
                    ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-200"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200",
                )}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: languageColor(option) }}
                  aria-hidden
                />
                {isSelected && <Check className="h-3 w-3" aria-hidden />}
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

