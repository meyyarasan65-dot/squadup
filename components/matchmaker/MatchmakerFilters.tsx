"use client";

import { RotateCcw, Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { ChipToggleGroup } from "@/components/shared/ChipToggleGroup";
import { Button } from "@/components/ui/button";
import { Label, Select, Switch } from "@/components/ui/form-controls";
import { ROLE_LABELS, ROLES } from "@/lib/constants";
import { useMatchmakerStore } from "@/lib/store";
import type { HackathonEvent } from "@/types";

interface MatchmakerFiltersProps {
  languages: string[];
  events: HackathonEvent[];
}

export function MatchmakerFilters({ languages, events }: MatchmakerFiltersProps) {
  const s = useMatchmakerStore();

  const searchRef = useRef<HTMLInputElement>(null);

  // Ctrl/⌘+K focuses search. Only when this input is actually visible, so the shortcut
  // isn't swallowed while the (hidden) desktop sidebar is the only mounted copy.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "k") return;
      const input = searchRef.current;
      if (!input || input.offsetParent === null) return;
      e.preventDefault();
      input.focus();
      input.select();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 transition focus-within:border-sky-500/50 focus-within:ring-2 focus-within:ring-sky-500/20 [html.light_&]:bg-black/[0.04]">
        <Search className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
        <input
          ref={searchRef}
          value={s.query}
          onChange={(e) => s.setQuery(e.target.value)}
          placeholder={s.tab === "teams" ? "Search teams or pitches" : "Search name or @username"}
          className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Search"
          aria-keyshortcuts="Control+K Meta+K"
        />
        <kbd className="hidden shrink-0 items-center gap-0.5 rounded-md border border-white/[0.1] bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-400 sm:inline-flex">
          Ctrl K
        </kbd>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{s.tab === "teams" ? "Open roles" : "Candidate role"}</Label>
        <ChipToggleGroup
          ariaLabel="Filter by role"
          options={ROLES}
          value={s.roles}
          onChange={s.setRoles}
          label={(r) => ROLE_LABELS[r]}
          activeClassName="border-sky-500/40 bg-sky-500/15 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.15)]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="filter-language">Verified language</Label>
        <Select
          id="filter-language"
          value={s.language ?? ""}
          onChange={(e) => s.setLanguage(e.target.value || null)}
        >
          <option value="">Any language</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
      </div>

      {s.tab === "teams" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="filter-event">Event</Label>
          <Select id="filter-event" value={s.eventId ?? ""} onChange={(e) => s.setEventId(e.target.value || null)}>
            <option value="">All events</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="filter-registered" className="text-zinc-300">
          {s.tab === "teams" ? "Only events I registered for" : "Only registered for this event"}
        </Label>
        <Switch id="filter-registered" checked={s.onlyRegistered} onCheckedChange={s.setOnlyRegistered} />
      </div>

      <Button variant="ghost" size="sm" className="self-start text-zinc-400" onClick={s.reset}>
        <RotateCcw />
        Reset filters
      </Button>
    </div>
  );
}
