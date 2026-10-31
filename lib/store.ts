"use client";

import { create } from "zustand";
import type { Role } from "@/types";

export type MatchmakerTab = "teammates" | "teams";

interface MatchmakerFilters {
  tab: MatchmakerTab;
  query: string;
  roles: Role[];
  language: string | null;
  eventId: string | null;
  /** In "Find teammates", which of my led teams is being staffed. */
  selectedTeamId: string | null;
  onlyRegistered: boolean;
  filtersOpen: boolean;
  setTab: (tab: MatchmakerTab) => void;
  setQuery: (query: string) => void;
  setRoles: (roles: Role[]) => void;
  setLanguage: (language: string | null) => void;
  setEventId: (eventId: string | null) => void;
  setSelectedTeamId: (teamId: string | null) => void;
  setOnlyRegistered: (value: boolean) => void;
  setFiltersOpen: (open: boolean) => void;
  reset: () => void;
}

const initialFilters = {
  query: "",
  roles: [] as Role[],
  language: null,
  eventId: null,
  onlyRegistered: false,
};

export const useMatchmakerStore = create<MatchmakerFilters>()((set) => ({
  tab: "teams",
  selectedTeamId: null,
  filtersOpen: false,
  ...initialFilters,
  setTab: (tab) => set({ tab }),
  setQuery: (query) => set({ query }),
  setRoles: (roles) => set({ roles }),
  setLanguage: (language) => set({ language }),
  setEventId: (eventId) => set({ eventId }),
  setSelectedTeamId: (selectedTeamId) => set({ selectedTeamId }),
  setOnlyRegistered: (onlyRegistered) => set({ onlyRegistered }),
  setFiltersOpen: (filtersOpen) => set({ filtersOpen }),
  reset: () => set(initialFilters),
}));

interface UiState {
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
}));
