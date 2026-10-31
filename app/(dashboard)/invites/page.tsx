import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InvitesView } from "@/components/invites/InvitesView";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  getLiveInvites,
  getRecentInviteHistory,
  incomingInvites,
  outgoingInvites,
} from "@/lib/queries";
import { getSessionProfile } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Invitations & Requests · Squadup",
  description: "Manage incoming squad invitations, member join requests, and pending invitations with anti-ghosting countdowns.",
};

export default async function InvitesPage() {
  const session = await getSessionProfile();
  if (!session?.profile) redirect("/login");
  const me = session.profile;

  const [liveInvites, history] = await Promise.all([
    getLiveInvites(),
    getRecentInviteHistory(),
  ]);

  const incoming = incomingInvites(liveInvites, me.id);
  const outgoing = outgoingInvites(liveInvites, me.id);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-12">
      <PageHeader
        title="Invitations & Requests"
        description="Anti-ghosting invitation engine with 24-hour radial countdown timers and atomic database locks."
      />

      <InvitesView
        userId={me.id}
        incoming={incoming}
        outgoing={outgoing}
        history={history}
      />
    </div>
  );
}

