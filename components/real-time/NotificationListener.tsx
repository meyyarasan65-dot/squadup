"use client";

import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";

type InviteRow = Tables<"invites">;

/**
 * Subscribes to invite changes over Supabase Realtime. RLS on `invites` means
 * this client only receives rows addressed to the user or to teams they lead.
 * Toasts for events the *other* party caused, then refreshes server data so
 * badges and lists update.
 */
export function NotificationListener({ userId }: { userId: string }) {
  const router = useRouter();
  const refreshTimer = useRef<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    const scheduleRefresh = () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      refreshTimer.current = window.setTimeout(() => router.refresh(), 250);
    };

    const names = async (invite: InviteRow) => {
      const [team, person] = await Promise.all([
        supabase.from("teams").select("team_name").eq("id", invite.team_id).maybeSingle(),
        supabase.from("profiles").select("full_name").eq("id", invite.user_id).maybeSingle(),
      ]);
      return {
        team: team.data?.team_name ?? "a team",
        person: person.data?.full_name ?? "Someone",
      };
    };

    const handle = async (payload: RealtimePostgresChangesPayload<InviteRow>) => {
      scheduleRefresh();
      if (payload.eventType === "DELETE") return;
      const invite = payload.new;
      const toMe = invite.user_id === userId;

      if (payload.eventType === "INSERT" && invite.status === "pending") {
        // A leader invited me, or someone requested to join a team I lead.
        if (invite.direction === "team_to_user" && toMe) {
          const n = await names(invite);
          toast(`${n.team} invited you to join`, {
            description: "The invite expires in 24 hours.",
            action: { label: "Review", onClick: () => router.push("/invites") },
          });
        } else if (invite.direction === "user_to_team" && !toMe) {
          const n = await names(invite);
          toast(`${n.person} wants to join ${n.team}`, {
            description: "Review their verified skills before the request expires.",
            action: { label: "Review", onClick: () => router.push("/invites") },
          });
        }
        return;
      }

      if (payload.eventType === "UPDATE" && invite.status === "accepted") {
        // Notify the sender only; the accepting party already saw the result.
        if (invite.direction === "team_to_user" && !toMe) {
          const n = await names(invite);
          toast.success(`${n.person} joined ${n.team}`, {
            action: { label: "View team", onClick: () => router.push(`/teams/${invite.team_id}`) },
          });
        } else if (invite.direction === "user_to_team" && toMe) {
          const n = await names(invite);
          toast.success(`You're in! ${n.team} accepted your request`, {
            action: { label: "View team", onClick: () => router.push(`/teams/${invite.team_id}`) },
          });
        }
      }
    };

    (async () => {
      // Realtime evaluates RLS with this JWT.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel("public:invites")
        .on<InviteRow>(
          "postgres_changes",
          { event: "*", schema: "public", table: "invites" },
          (payload) => void handle(payload),
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [router, userId]);

  return null;
}
