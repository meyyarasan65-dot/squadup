import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Crown,
  Flame,
  Lock,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EmergencyRadarModal } from "@/components/matchmaker/EmergencyRadarModal";
import { GithubIcon, MatchScoreRing, PulseDot, RoleBadge } from "@/components/shared/badges";
import { SkillBars } from "@/components/shared/SkillBars";
import { EditTeamDialog } from "@/components/teams/EditTeamDialog";
import { DeleteTeamDialog } from "@/components/teams/DeleteTeamDialog";
import { LeaveTeamButton } from "@/components/teams/LeaveTeamButton";
import { RemoveMemberButton } from "@/components/teams/RemoveMemberButton";
import { TeamCelebration } from "@/components/teams/TeamCelebration";
import { TeamInviteManager } from "@/components/teams/TeamInviteManager";
import { TeamMembershipAction } from "@/components/teams/TeamMembershipAction";
import { SprintCanvas } from "@/components/workspace/SprintCanvas";
import { StrategyCoPilot } from "@/components/workspace/StrategyCoPilot";
import { WorkspaceBootstrapper } from "@/components/workspace/WorkspaceBootstrapper";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { languageColor, ROLES } from "@/lib/constants";
import { isTeamOpen, openRoles, openSlots } from "@/lib/mappers";
import { calculateMatchScore, registrationKey } from "@/lib/match-algorithm";
import { roleSchema } from "@/lib/schemas";
import { getLiveInvites, getRegistrationKeys, getTeam, getTeamsWithMembers } from "@/lib/queries";
import { getSessionProfile } from "@/lib/supabase/server";
import { formatDate, formatRelative } from "@/lib/utils";

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const { id } = await params;
  const team = await getTeam(id);
  return {
    title: team ? `${team.team_name} · Squadup` : "Team Not Found",
  };
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { id } = await params;
  const session = await getSessionProfile();
  if (!session?.profile) redirect("/login");
  const me = session.profile;

  const team = await getTeam(id);
  if (!team) notFound();

  const [liveInvites, eventTeams, registrations] = await Promise.all([
    getLiveInvites(),
    getTeamsWithMembers({ eventId: team.event_id }),
    getRegistrationKeys(),
  ]);

  const isLeader = team.leader_id === me.id;
  const isMember = team.members.some((m) => m.user_id === me.id);
  const myOtherTeam = eventTeams.find(
    (t) => t.id !== team.id && t.members.some((m) => m.user_id === me.id),
  );
  const userPendingInvite =
    liveInvites.find((i) => i.team_id === team.id && i.user_id === me.id) ?? null;

  const now = Date.now();
  const isEventClosed = new Date(team.event.registration_deadline).getTime() <= now;
  const slots = openSlots(team);
  const vacancies = openRoles(team);
  const isOpen = isTeamOpen(team) && !isEventClosed;

  // Calculate viewer's match score against this team for insight if non-member
  const viewerMatch = !isMember
    ? calculateMatchScore(me, team, {
        isRegisteredForEvent: registrations.has(registrationKey(team.event_id, me.id)),
      })
    : null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-12">
      {isMember && slots === 0 && <TeamCelebration teamId={team.id} teamName={team.team_name} />}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Button asChild variant="ghost" size="sm" className="-ml-3 h-8 text-zinc-400 hover:text-white">
          <Link href="/events">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Events
          </Link>
        </Button>
        <span>/</span>
        <Link href={`/events`} className="hover:text-zinc-300">
          {team.event.title}
        </Link>
        <span>/</span>
        <span className="text-zinc-200">{team.team_name}</span>
      </div>

      {/* Team Header */}
      <header className="flex flex-col gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {team.team_name}
              </h1>
              {isOpen ? (
                <Badge variant="success">
                  <PulseDot className="mr-1" />
                  Recruiting ({slots} open)
                </Badge>
              ) : team.is_locked ? (
                <Badge variant="secondary" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Locked
                </Badge>
              ) : (
                <Badge variant="secondary">Full squad</Badge>
              )}
            </div>

            <p className="text-sm text-zinc-400">
              Competing in{" "}
              <Link
                href="/events"
                className="font-medium text-zinc-200 hover:underline hover:text-white"
              >
                {team.event.title}
              </Link>{" "}
              · Organized by {team.event.organizer}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {isLeader ? (
              <>
                <WorkspaceBootstrapper team={team} isLeader={true} />
                <EmergencyRadarModal team={team} />
                <EditTeamDialog team={team} />
                <DeleteTeamDialog team={team} />
                <LeaveTeamButton team={team} isLeader={true} />
              </>
            ) : isMember ? (
              <>
                <WorkspaceBootstrapper team={team} isLeader={false} />
                <LeaveTeamButton team={team} isLeader={false} />
              </>
            ) : (
              <div className="flex items-center gap-3">
                {viewerMatch && (
                  <div className="hidden items-center gap-2 text-right sm:flex">
                    <div className="text-right">
                      <p className="text-xs font-medium text-zinc-300">Your match</p>
                      <p className="text-[10px] text-zinc-500">fit score</p>
                    </div>
                    <MatchScoreRing score={viewerMatch.score} size={44} breakdown={viewerMatch.breakdown} />
                  </div>
                )}
                <TeamMembershipAction
                  team={team}
                  meId={me.id}
                  myOtherTeamName={myOtherTeam ? myOtherTeam.team_name : null}
                  pendingInvite={userPendingInvite}
                  isEventClosed={isEventClosed}
                />
              </div>
            )}
          </div>
        </div>

        {/* Pitch Callout */}
        {team.pitch && (
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 sm:p-5">
            <p className="font-mono text-xs text-zinc-500 mb-1">PROJECT PITCH</p>
            <p className="text-sm leading-relaxed text-zinc-200">{team.pitch}</p>
          </div>
        )}

        {/* Vacancies & Tech Stack Badges */}
        <div className="grid gap-4 border-t border-zinc-800/80 pt-6 sm:grid-cols-2">
          {/* Target Roles & Vacancies */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-zinc-400">Target Roles</span>
            {team.target_roles.length === 0 ? (
              <span className="text-xs text-zinc-500">No specific roles specified</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {team.target_roles.map((role) => {
                  const isVacant = vacancies.includes(role);
                  return (
                    <div key={role} className="flex items-center gap-1">
                      <RoleBadge role={role} />
                      {isVacant && (
                        <span className="rounded bg-emerald-500/10 px-1 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                          OPEN
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desired Stack */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-zinc-400">Desired Technologies</span>
            {team.tech_stack.length === 0 ? (
              <span className="text-xs text-zinc-500">Open to any technology stack</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {team.tech_stack.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950/80 px-2 py-0.5 font-mono text-xs text-zinc-300"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: languageColor(lang) }}
                    />
                    {lang}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Event Meta Timeline */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-zinc-800/80 pt-4 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-zinc-500" />
            <span>Event starts {formatDate(team.event.event_start)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>Registration closes {formatRelative(team.event.registration_deadline, now)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-zinc-500" />
            <span>
              Squad limit: {team.event.team_min_size}–{team.event.team_max_size} members
            </span>
          </div>
        </div>
      </header>

      {/* Roster Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Squad Roster</h2>
            <Badge variant="secondary">
              {team.members.length} / {team.event.team_max_size}
            </Badge>
          </div>
          {slots > 0 && (
            <span className="text-xs text-zinc-400">
              {slots} {slots === 1 ? "seat available" : "seats available"}
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {team.members.map((member) => {
            const memberIsLeader = member.user_id === team.leader_id;
            const profile = member.profile;

            return (
              <div
                key={member.id}
                className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition-colors hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={profile.full_name}
                      src={profile.avatar_url}
                      className="h-10 w-10 ring-1 ring-zinc-700"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-medium text-white">{profile.full_name}</p>
                        {memberIsLeader && (
                          <span
                            className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300"
                            title="Team Leader"
                          >
                            <Crown className="h-3 w-3" />
                            Leader
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-zinc-500">{profile.college}</p>
                    </div>
                  </div>

                  {isLeader && !memberIsLeader && (
                    <RemoveMemberButton teamId={team.id} member={member} />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <RoleBadge
                    role={
                      roleSchema.safeParse(member.role_assigned).success
                        ? (member.role_assigned as (typeof ROLES)[number])
                        : "fullstack"
                    }
                  />
                  <a
                    href={`https://github.com/${profile.github_username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 font-mono text-xs text-zinc-400 hover:text-white"
                  >
                    <GithubIcon className="h-3.5 w-3.5" />@{profile.github_username}
                  </a>
                </div>

                {profile.bio && (
                  <p className="line-clamp-2 text-xs text-zinc-400">{profile.bio}</p>
                )}

                {/* Hacker DNA Signals */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span
                    className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono font-medium text-emerald-300 border border-emerald-500/20"
                    title="Commit Authenticity: Non-forked repository ratio"
                  >
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    {(profile.commit_authenticity_score ?? 100).toFixed(0)}% Authenticity
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium ${
                      profile.hacker_pace === "all_nighter"
                        ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                        : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                    }`}
                  >
                    {profile.hacker_pace === "all_nighter" ? (
                      <Moon className="h-3 w-3 text-indigo-400" />
                    ) : (
                      <Sun className="h-3 w-3 text-amber-400" />
                    )}
                    {profile.hacker_pace === "all_nighter" ? "All-Nighter" : "Structured Day"}
                  </span>

                  {profile.leetcode_stats?.totalSolved && profile.leetcode_stats.totalSolved > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-300 border border-amber-500/20 font-mono">
                      <Flame className="h-3 w-3 text-amber-400" />
                      LC: {profile.leetcode_stats.totalSolved}
                    </span>
                  ) : null}

                  {profile.verified_tech_stack && profile.verified_tech_stack.length > 0 && (
                    profile.verified_tech_stack.slice(0, 3).map((fw) => (
                      <span
                        key={fw.name}
                        className="rounded bg-cyan-950/40 px-1.5 py-0.5 text-cyan-300 border border-cyan-800/40 font-mono"
                      >
                        {fw.name}
                      </span>
                    ))
                  )}
                </div>

                {/* Verified Skills */}
                <div className="mt-auto border-t border-zinc-800/60 pt-3">
                  <div className="mb-1.5 flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-400" />
                      GitHub-verified languages
                    </span>
                    {member.joined_at && (
                      <span className="text-[10px]">
                        Joined {formatDate(member.joined_at)}
                      </span>
                    )}
                  </div>
                  <SkillBars
                    skills={profile.verified_skills}
                    highlight={team.tech_stack}
                    limit={3}
                    compact
                  />
                </div>
              </div>
            );
          })}

          {/* Placeholder cards for empty slots */}
          {Array.from({ length: slots }).map((_, idx) => (
            <div
              key={`empty-slot-${idx}`}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800/80 bg-zinc-950/30 p-6 text-center text-xs text-zinc-500"
            >
              <div className="rounded-full bg-zinc-900 p-2 text-zinc-600">
                <Users className="h-4 w-4" />
              </div>
              <p className="font-medium text-zinc-400">Open Slot</p>
              <p className="text-[11px]">
                {vacancies[idx] ? `Looking for ${vacancies[idx]}` : "Awaiting applicant or invitation"}
              </p>
              {isLeader && (
                <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                  <EmergencyRadarModal
                    team={team}
                    defaultRole={vacancies[idx]}
                    trigger={
                      <Button size="sm" variant="ghost" className="h-7 text-[11px] text-cyan-400 hover:text-cyan-300">
                        <Sparkles className="mr-1 h-3 w-3" />
                        Radar Scan
                      </Button>
                    }
                  />
                  <Button asChild size="sm" variant="ghost" className="h-7 text-[11px] text-zinc-400 hover:text-zinc-200">
                    <Link href={`/matchmaker?event=${team.event_id}`}>
                      Browse
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Sponsor Track & Rubric Strategy Co-Pilot */}
      <StrategyCoPilot team={team} isLeader={isLeader} />

      {/* Real-Time Sprint Canvas for Members */}
      {isMember && (
        <section className="flex flex-col gap-3 border-t border-zinc-800/80 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Squad Sprint Canvas</h2>
              <p className="text-xs text-zinc-400">
                Synchronized Markdown scratchpad and architecture plan powered by Supabase Realtime Broadcast.
              </p>
            </div>
          </div>
          <SprintCanvas
            teamId={team.id}
            initialContent={team.sprint_notes}
            currentUserId={me.id}
            isMember={isMember}
          />
        </section>
      )}

      {/* Leader's Invite Management Section */}
      {isLeader && (
        <section className="flex flex-col gap-4 border-t border-zinc-800 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Recruitment & Invitations</h2>
              <p className="text-xs text-zinc-400">
                Manage candidate requests and pending team invitations for this squad.
              </p>
            </div>
          </div>

          <TeamInviteManager team={team} invites={liveInvites} />
        </section>
      )}
    </div>
  );
}
