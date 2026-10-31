"use client";

import { RotateCcw, Search } from "lucide-react";
import { ChipToggleGroup } from "@/components/shared/ChipToggleGroup";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Switch } from "@/components/ui/form-controls";
import { ROLE_LABELS, ROLES } from "@/lib/constants";
import { useMatchmakerStore } from "@/lib/store";
import type { HackathonEvent } from "@/types";

interface MatchmakerFiltersProps {
  languages: string[];
  events: HackathonEvent[];
}

export function MatchmakerFilters({ languages, events }: MatchmakerFiltersProps) {
  const s = useMatchmakerStore();

  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          value={s.query}
          onChange={(e) => s.setQuery(e.target.value)}
          placeholder={s.tab === "teams" ? "Search teams or pitches" : "Search name or @username"}
          className="pl-9"
          aria-label="Search"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>{s.tab === "teams" ? "Open roles" : "Candidate role"}</Label>
        <ChipToggleGroup
          ariaLabel="Filter by role"
          options={ROLES}
          value={s.roles}
          onChange={s.setRoles}
          label={(r) => ROLE_LABELS[r]}
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
