"use client";

import { AnimatePresence } from "framer-motion";
import { SlidersHorizontal, Sparkles, Users, UserSearch } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { CandidateCard } from "@/components/matchmaker/CandidateCard";
import { EmergencyRadarModal } from "@/components/matchmaker/EmergencyRadarModal";
import { MatchmakerFilters } from "@/components/matchmaker/MatchmakerFilters";
import { TeamCard } from "@/components/matchmaker/TeamCard";
import { useInviteSender } from "@/components/matchmaker/useInviteSender";
import { pairKey } from "@/lib/utils";
import { AvailabilityToggle } from "@/components/profile/AvailabilityToggle";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form-controls";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { SegmentedTabsList, SegmentedTabsTrigger, Tabs, TabsContent } from "@/components/ui/tabs";
import { SKILL_THRESHOLD_PERCENT } from "@/lib/constants";
import { isTeamOpen, openRoles } from "@/lib/mappers";
import {
  desiredLanguages,
  rankCandidatesForTeam,
  rankTeamsForCandidate,
  registrationKey,
} from "@/lib/match-algorithm";
import { useMatchmakerStore, type MatchmakerTab } from "@/lib/store";
import type { HackathonEvent, Profile, TeamWithMembers } from "@/types";

interface MatchmakerViewProps {
  me: Profile;
  teams: TeamWithMembers[];
  candidates: Profile[];
  events: HackathonEvent[];
  registrations: string[];
  teamToUserPairs: string[];
  userToTeamPairs: string[];
  initialEventId: string | null;
  /** Server render time; keeps deadline filtering deterministic across hydration. */
  now: number;
}

function hasLanguage(skills: Profile["verified_skills"], language: string): boolean {
  return (skills[language] ?? 0) >= SKILL_THRESHOLD_PERCENT;
}

export function MatchmakerView({
  me,
  teams,
  candidates,
  events,
  registrations,
  teamToUserPairs,
  userToTeamPairs,
  initialEventId,
  now,
}: MatchmakerViewProps) {
  const store = useMatchmakerStore();
  const registrationSet = useMemo(() => new Set(registrations), [registrations]);
  const teamInvited = useMemo(() => new Set(teamToUserPairs), [teamToUserPairs]);
  const userRequested = useMemo(() => new Set(userToTeamPairs), [userToTeamPairs]);
  const sender = useInviteSender(useMemo(() => [...teamToUserPairs, ...userToTeamPairs], [teamToUserPairs, userToTeamPairs]));

  const ledTeams = useMemo(
    () => teams.filter((t) => t.leader_id === me.id && t.event.registration_deadline > new Date(now).toISOString()),
    [teams, me.id, now],
  );
  const myEventIds = useMemo(
    () => new Set(teams.filter((t) => t.members.some((m) => m.user_id === me.id)).map((t) => t.event_id)),
    [teams, me.id],
  );

  // One-time initialization from the URL and from what the user can do.
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (initialEventId) store.setEventId(initialEventId);
    store.setTab(ledTeams.some(isTeamOpen) ? "teammates" : "teams");
  }, [initialEventId, ledTeams, store]);

  const selectedTeam =
    ledTeams.find((t) => t.id === store.selectedTeamId) ?? ledTeams.find(isTeamOpen) ?? ledTeams[0] ?? null;

  const languages = useMemo(() => {
    const set = new Set<string>();
    for (const c of candidates) for (const l of Object.keys(c.verified_skills)) set.add(l);
    for (const t of teams) for (const l of t.tech_stack) set.add(l);
    return [...set].sort();
  }, [candidates, teams]);

  const query = store.query.trim().toLowerCase();

  // --- Find a team -----------------------------------------------------------
  const rankedTeams = useMemo(() => {
    const nowIso = new Date(now).toISOString();
    const eligible = teams.filter(
      (t) => !myEventIds.has(t.event_id) && t.event.registration_deadline > nowIso,
    );
    return rankTeamsForCandidate(me, eligible, registrationSet).filter(({ team }) => {
      if (store.eventId && team.event_id !== store.eventId) return false;
      if (store.roles.length && !openRoles(team).some((r) => store.roles.includes(r))) return false;
      if (store.language && !team.tech_stack.includes(store.language)) return false;
      if (store.onlyRegistered && !registrationSet.has(registrationKey(team.event_id, me.id))) return false;
      if (query) {
        const haystack = `${team.team_name} ${team.pitch ?? ""} ${team.event.title}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [teams, myEventIds, me, registrationSet, store.eventId, store.roles, store.language, store.onlyRegistered, query, now]);

  // --- Find teammates --------------------------------------------------------
  const rankedCandidates = useMemo(() => {
    if (!selectedTeam) return [];
    // People already on any team for this event can't be recruited for it.
    const busy = new Set(
      teams.filter((t) => t.event_id === selectedTeam.event_id).flatMap((t) => t.members.map((m) => m.user_id)),
    );
    const pool = candidates.filter((c) => c.id !== me.id && !busy.has(c.id));
    return rankCandidatesForTeam(pool, selectedTeam, registrationSet).filter(({ candidate }) => {
      if (store.roles.length && !store.roles.includes(candidate.primary_role)) return false;
      if (store.language && !hasLanguage(candidate.verified_skills, store.language)) return false;
      if (store.onlyRegistered && !registrationSet.has(registrationKey(selectedTeam.event_id, candidate.id))) {
        return false;
      }
      if (query) {
        const haystack = `${candidate.full_name} ${candidate.github_username}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [selectedTeam, teams, candidates, me.id, registrationSet, store.roles, store.language, store.onlyRegistered, query]);

  const activeFilterCount =
    (store.query ? 1 : 0) +
    store.roles.length +
    (store.language ? 1 : 0) +
    (store.eventId && store.tab === "teams" ? 1 : 0) +
    (store.onlyRegistered ? 1 : 0);

  const filters = <MatchmakerFilters languages={languages} events={events} />;

  return (
    <Tabs value={store.tab} onValueChange={(v) => store.setTab(v as MatchmakerTab)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedTabsList className="w-full sm:w-auto">
          <SegmentedTabsTrigger
            value="teams"
            layoutId="matchmaker-tab"
            active={store.tab === "teams"}
            className="flex-1 sm:flex-none"
          >
            <Users />
            Find a team
          </SegmentedTabsTrigger>
          <SegmentedTabsTrigger
            value="teammates"
            layoutId="matchmaker-tab"
            active={store.tab === "teammates"}
            className="flex-1 sm:flex-none"
          >
            <UserSearch />
            Find teammates
          </SegmentedTabsTrigger>
        </SegmentedTabsList>
        <div className="flex items-center gap-2">
          <EmergencyRadarModal
            team={selectedTeam ?? undefined}
            eventId={selectedTeam?.event_id || store.eventId || undefined}
          />
          <Button
            variant="outline"
            className="lg:hidden"
            onClick={() => store.setFiltersOpen(true)}
            aria-label="Open filters"
          >
            <SlidersHorizontal />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-indigo-500 px-1.5 font-mono text-[11px] text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-4 backdrop-blur-md">{filters}</div>
        </aside>

        <div className="min-w-0">
          <TabsContent value="teams" className="mt-0">
            {!me.is_looking_for_team && (
              <div className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-amber-200/90">
                  You&apos;re hidden from team leaders. Turn this on so teams can find and invite you.
                </p>
                <AvailabilityToggle looking={me.is_looking_for_team} />
              </div>
            )}
            <p className="mb-4 text-sm text-zinc-500">
              {rankedTeams.length} {rankedTeams.length === 1 ? "team" : "teams"} ranked for your{" "}
              <span className="text-zinc-300">verified skills</span>
            </p>
            {rankedTeams.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No open teams match"
                description="Try clearing filters, or start your own team and let candidates come to you."
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/events">Create a team</Link>
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {rankedTeams.map(({ team, match }) => {
                    const key = pairKey(team.id, me.id);
                    return (
                      <TeamCard
                        key={team.id}
                        team={team}
                        match={match}
                        invitedByTeam={teamInvited.has(key)}
                        requested={userRequested.has(key) || sender.isPairPending(team.id, me.id)}
                        onRequest={() =>
                          sender.send(team.id, me.id, "user_to_team", `Request sent to ${team.team_name}`)
                        }
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="teammates" className="mt-0">
            {!selectedTeam ? (
              <EmptyState
                icon={Sparkles}
                title="You're not leading a team yet"
                description="Create a team for an event, list the roles you need, and we'll rank candidates for each open slot."
                action={
                  <Button asChild size="sm">
                    <Link href="/events">Browse events</Link>
                  </Button>
                }
              />
            ) : (
              <>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-zinc-500">
                    {rankedCandidates.length} candidates for{" "}
                    <Link href={`/teams/${selectedTeam.id}`} className="text-zinc-200 hover:underline">
                      {selectedTeam.team_name}
                    </Link>
                    {!isTeamOpen(selectedTeam) && (
                      <span className="text-amber-300"> (team is {selectedTeam.is_locked ? "locked" : "full"})</span>
                    )}
                  </p>
                  {ledTeams.length > 1 && (
                    <Select
                      aria-label="Team to staff"
                      className="sm:w-64"
                      value={selectedTeam.id}
                      onChange={(e) => store.setSelectedTeamId(e.target.value)}
                    >
                      {ledTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.team_name} · {t.event.title}
                        </option>
                      ))}
                    </Select>
                  )}
                </div>
                {rankedCandidates.length === 0 ? (
                  <EmptyState
                    icon={UserSearch}
                    title="No matching candidates right now"
                    description="Broaden your open roles or tech stack on the team page, or check back as more people sign up."
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                      {rankedCandidates.map(({ candidate, match }) => {
                        const key = pairKey(selectedTeam.id, candidate.id);
                        return (
                          <CandidateCard
                            key={candidate.id}
                            candidate={candidate}
                            match={match}
                            highlightLanguages={desiredLanguages(selectedTeam, candidate.id)}
                            requestedToJoin={userRequested.has(key)}
                            invited={teamInvited.has(key) || sender.isPairPending(selectedTeam.id, candidate.id)}
                            disabled={!isTeamOpen(selectedTeam)}
                            onInvite={() =>
                              sender.send(
                                selectedTeam.id,
                                candidate.id,
                                "team_to_user",
                                `Invite sent to ${candidate.full_name}`,
                              )
                            }
                          />
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </div>
      </div>

      <Sheet open={store.filtersOpen} onOpenChange={store.setFiltersOpen}>
        <SheetContent side="bottom">
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription className="sr-only">Narrow down the matchmaking feed</SheetDescription>
          {filters}
          <Button onClick={() => store.setFiltersOpen(false)}>Show results</Button>
        </SheetContent>
      </Sheet>
    </Tabs>
  );
}
