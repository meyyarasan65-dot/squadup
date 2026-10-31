import { ArrowRight, CalendarClock, CalendarDays, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateEventDialog } from "@/components/events/CreateEventDialog";
import { CreateTeamDialog } from "@/components/events/CreateTeamDialog";
import { DeleteEventDialog } from "@/components/events/DeleteEventDialog";
import { EventActionsMenu } from "@/components/events/EventActionsMenu";
import { RegisterToggle } from "@/components/events/RegisterToggle";
import { PulseDot, RoleBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isAdminUsername } from "@/lib/admin";
import { isTeamOpen, openRoles, openSlots } from "@/lib/mappers";
import { registrationKey } from "@/lib/match-algorithm";
import { getEvents, getRegistrationKeys, getTeamsWithMembers } from "@/lib/queries";
import { getSessionProfile } from "@/lib/supabase/server";
import { formatDate, formatRelative } from "@/lib/utils";

export const metadata: Metadata = { title: "Events" };

/** Month/day tile shown at the left of an event card. */
function DateBlock({ iso, muted = false }: { iso: string; muted?: boolean }) {
  const d = new Date(iso);
  return (
    <div
      className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border ${
        muted ? "border-zinc-800 bg-zinc-900/60" : "border-indigo-500/30 bg-indigo-500/10"
      }`}
      aria-hidden
    >
      <span className={`text-[10px] font-semibold uppercase tracking-wider ${muted ? "text-zinc-400" : "text-indigo-300"}`}>
        {d.toLocaleString("en", { month: "short", timeZone: "UTC" })}
      </span>
      <span className="font-mono text-xl font-semibold leading-none text-white">
        {d.toLocaleString("en", { day: "numeric", timeZone: "UTC" })}
      </span>
    </div>
  );
}

/** Deadline pill: red under 24h, amber under 3 days, neutral otherwise. */
function UrgencyPill({ deadline, now }: { deadline: string; now: number }) {
  const ms = new Date(deadline).getTime() - now;
  const tone =
    ms < 86_400_000
      ? "border-red-500/40 bg-red-500/10 text-red-300"
      : ms < 3 * 86_400_000
        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
        : "border-zinc-700 bg-zinc-900 text-zinc-300";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      <CalendarClock className="h-3 w-3" aria-hidden />
      Closes {formatRelative(deadline, now)}
    </span>
  );
}

export default async function EventsPage() {
  const session = await getSessionProfile();
  if (!session?.profile) redirect("/login");
  const me = session.profile;

  const [events, teams, registrations] = await Promise.all([
    getEvents(),
    getTeamsWithMembers(),
    getRegistrationKeys(),
  ]);

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.registration_deadline).getTime() > now);
  const closed = events.filter((e) => new Date(e.registration_deadline).getTime() <= now);

  const registeredCount = new Map<string, number>();
  for (const key of registrations) {
    const eventId = key.split(":")[0] ?? "";
    registeredCount.set(eventId, (registeredCount.get(eventId) ?? 0) + 1);
  }

  const isAdmin = isAdminUsername(me.github_username);

  return (
    <>
      <PageHeader
        title="Hackathons & expos"
        description="Register to boost your match score for an event, or start a team and recruit."
        actions={isAdmin ? <CreateEventDialog /> : null}
      />

      {upcoming.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No upcoming events"
          description={
            isAdmin
              ? "No active hackathons found. Click 'Add Hackathon' above to publish the first one."
              : "Check back soon."
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          {upcoming.map((event) => {
            const eventTeams = teams.filter((t) => t.event_id === event.id);
            const openTeams = eventTeams.filter(isTeamOpen);
            const myTeam = eventTeams.find((t) => t.members.some((m) => m.user_id === me.id));
            const registered = registrations.has(registrationKey(event.id, me.id));
            const registeredTotal = registeredCount.get(event.id) ?? 0;
            const placed = eventTeams.reduce((sum, t) => sum + t.members.length, 0);
            const placedPct = registeredTotal > 0 ? Math.min(100, Math.round((placed / registeredTotal) * 100)) : 0;

            return (
              <section
                key={event.id}
                className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 transition-colors hover:border-zinc-700"
              >
                <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                  <DateBlock iso={event.event_start} />
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-white">{event.title}</h2>
                      <UrgencyPill deadline={event.registration_deadline} now={now} />
                      {openTeams.length > 0 && (
                        <Badge variant="success">
                          <PulseDot className="mr-1" />
                          {openTeams.length} recruiting
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400">by {event.organizer}</p>
                    {event.description && <p className="max-w-2xl text-sm text-zinc-400">{event.description}</p>}
                    <div className="flex flex-wrap gap-1.5">
                      {event.themes.map((theme) => (
                        <Badge key={theme} variant="secondary">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                    <dl className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5 text-amber-400" aria-hidden />
                        <dt className="sr-only">Registration closes</dt>
                        <dd>
                          Registration closes{" "}
                          <span className="text-zinc-200">{formatRelative(event.registration_deadline, now)}</span>{" "}
                          ({formatDate(event.registration_deadline)})
                        </dd>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                        <dt className="sr-only">Starts</dt>
                        <dd>Starts {formatDate(event.event_start)}</dd>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" aria-hidden />
                        <dt className="sr-only">Team size</dt>
                        <dd>
                          Teams of {event.team_min_size === event.team_max_size
                            ? event.team_max_size
                            : `${event.team_min_size}–${event.team_max_size}`}
                        </dd>
                      </div>
                      <div>
                        <dt className="sr-only">Registered</dt>
                        <dd>{registeredTotal} registered</dd>
                      </div>
                    </dl>
                    {registeredTotal > 0 && (
                      <div className="flex max-w-sm flex-col gap-1.5">
                        <div
                          className="h-1.5 overflow-hidden rounded-full bg-zinc-800"
                          role="progressbar"
                          aria-label="Registered builders placed in teams"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={placedPct}
                        >
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-cyan-300"
                            style={{ width: `${placedPct}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          {placed} of {registeredTotal} registered builders are on a team
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <RegisterToggle eventId={event.id} registered={registered} locked={!!myTeam} />
                    {myTeam ? (
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/teams/${myTeam.id}`}>
                          Your team: {myTeam.team_name}
                          <ArrowRight />
                        </Link>
                      </Button>
                    ) : (
                      <CreateTeamDialog event={event} />
                    )}
                    <EventActionsMenu
                      event={event}
                      hasTeam={!!myTeam}
                      isAdmin={isAdmin}
                      teamsCount={eventTeams.length}
                    />
                  </div>
                </div>

                {openTeams.length > 0 && (
                  <ul className="divide-y divide-zinc-800/80 border-t border-zinc-800/80 bg-zinc-950/40">
                    {openTeams.slice(0, 4).map((team) => (
                      <li key={team.id}>
                        <Link
                          href={`/teams/${team.id}`}
                          className="flex flex-col gap-2 px-5 py-3 transition-colors hover:bg-zinc-900/60 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                        >
                          <span className="flex items-center gap-2 text-sm text-zinc-200">
                            <PulseDot />
                            {team.team_name}
                            <span className="text-xs text-zinc-400">
                              {team.members.length}/{event.team_max_size} · {openSlots(team)} open
                            </span>
                          </span>
                          <span className="flex flex-wrap gap-1">
                            {openRoles(team).map((r) => (
                              <RoleBadge key={r} role={r} />
                            ))}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {closed.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-sm font-medium text-zinc-400">Registration closed</h2>
          <ul className="flex flex-col gap-2">
            {closed.map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-4 rounded-xl border border-zinc-800/70 bg-zinc-900/20 p-3 text-sm text-zinc-400 opacity-80"
              >
                <DateBlock iso={e.event_start} muted />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-zinc-300">{e.title}</p>
                  <p className="text-xs">by {e.organizer}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden text-xs sm:inline">Started {formatDate(e.event_start)}</span>
                  {isAdmin && <DeleteEventDialog event={e} />}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
