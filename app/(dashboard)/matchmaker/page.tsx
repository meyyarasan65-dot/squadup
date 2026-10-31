import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MatchmakerView } from "@/components/matchmaker/MatchmakerView";
import { PageHeader } from "@/components/shared/PageHeader";
import { pairKey } from "@/lib/utils";
import {
  getCandidates,
  getEvents,
  getLiveInvites,
  getRegistrationKeys,
  getTeamsWithMembers,
} from "@/lib/queries";
import { getSessionProfile } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Matchmaker" };

export default async function MatchmakerPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const session = await getSessionProfile();
  if (!session?.profile) redirect("/login");
  const me = session.profile;
  const { event } = await searchParams;

  const [teams, candidates, events, registrations, invites] = await Promise.all([
    getTeamsWithMembers(),
    getCandidates(),
    getEvents(),
    getRegistrationKeys(),
    getLiveInvites(),
  ]);

  const now = Date.now();
  const openEvents = events.filter((e) => new Date(e.registration_deadline).getTime() > now);

  return (
    <>
      <PageHeader
        title="Matchmaker"
        description="Ranked by role fit (45%), GitHub-verified language overlap (35%) and event registration (20%)."
      />
      <MatchmakerView
        me={me}
        teams={teams}
        candidates={candidates}
        events={openEvents}
        registrations={[...registrations]}
        teamToUserPairs={invites.filter((i) => i.direction === "team_to_user").map((i) => pairKey(i.team_id, i.user_id))}
        userToTeamPairs={invites.filter((i) => i.direction === "user_to_team").map((i) => pairKey(i.team_id, i.user_id))}
        initialEventId={event && openEvents.some((e) => e.id === event) ? event : null}
        now={now}
      />
    </>
  );
}
