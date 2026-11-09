"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Flame,
  Loader2,
  Radio,
  Send,
  ShieldCheck,
  Sun,
  Moon,
  Zap,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { sendInviteAction } from "@/app/actions/invites";
import { ROLE_LABELS, ROLES } from "@/lib/constants";
import type { Profile, Role, TeamWithMembers } from "@/types";

interface EmergencyRadarModalProps {
  team?: TeamWithMembers;
  eventId?: string;
  defaultRole?: Role;
  trigger?: React.ReactNode;
}

interface RadarCandidate extends Profile {
  isRegisteredForEvent?: boolean;
}

export function EmergencyRadarModal({
  team,
  eventId = team?.event_id,
  defaultRole,
  trigger,
}: EmergencyRadarModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(
    defaultRole || (team?.target_roles[0] as Role) || "frontend",
  );
  const [radiusMinutes, setRadiusMinutes] = useState<number>(120);
  const [candidates, setCandidates] = useState<RadarCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchRadar = useCallback(async () => {
    setLoading(true);
    setInviteError(null);
    try {
      const params = new URLSearchParams();
      if (eventId) params.set("event_id", eventId);
      if (selectedRole) params.set("missing_role", selectedRole);
      params.set("radius_minutes", String(radiusMinutes));

      const res = await fetch(`/api/radar?${params.toString()}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.candidates)) {
        setCandidates(data.candidates);
      } else {
        setCandidates([]);
      }
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [eventId, selectedRole, radiusMinutes]);

  useEffect(() => {
    if (open) {
      fetchRadar();
    }
  }, [open, fetchRadar]);

  const handleInvite = (candidateId: string) => {
    if (!team) return;
    setInviteError(null);
    startTransition(async () => {
      const res = await sendInviteAction(team.id, candidateId, "team_to_user");
      if (res.ok) {
        setInvitedIds((prev) => new Set([...prev, candidateId]));
      } else {
        setInviteError(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            size="sm"
            className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium shadow-md shadow-indigo-600/20 active:scale-[0.98] border border-indigo-500/40 transition-all"
          >
            <span className="relative flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              <Radio className="h-3.5 w-3.5 text-white transition-transform group-hover:scale-110" />
              <span className="font-semibold tracking-wide text-white">Emergency Radar</span>
            </span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl border-cyan-900/40 bg-zinc-950 p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                Solo-Hacker Instant Gap-Fill Radar
                <Badge variant="secondary" className="border-cyan-500/30 text-cyan-400 text-[10px]">
                  Real-Time
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Detects available hackers sorted by authentic commit activity and verified framework dependencies.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Filter Controls */}
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1 block">
              Missing Target Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-cyan-500 focus:outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1 block">
              Heartbeat Activity Radius
            </label>
            <select
              value={radiusMinutes}
              onChange={(e) => setRadiusMinutes(Number(e.target.value))}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value={30}>Last 30 minutes (Active now)</option>
              <option value={60}>Last 1 hour</option>
              <option value={120}>Last 2 hours (Recommended)</option>
              <option value={1440}>Last 24 hours</option>
            </select>
          </div>
        </div>

        {inviteError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/30 p-2.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{inviteError}</span>
          </div>
        )}

        {/* Candidates Feed */}
        <div className="mt-2 flex flex-col gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-400 mb-2" />
              <p className="text-xs">Scanning satellite radar for {ROLE_LABELS[selectedRole]} hackers...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-10 text-center text-zinc-500">
              <Zap className="h-6 w-6 text-zinc-600 mb-2" />
              <p className="text-sm font-medium text-zinc-400">No active candidates in radar radius</p>
              <p className="text-xs mt-1 text-zinc-500">Try broadening the heartbeat activity radius to 24 hours.</p>
            </div>
          ) : (
            candidates.map((cand) => {
              const hasInvited = invitedIds.has(cand.id);
              const authScore = cand.commit_authenticity_score ?? 100;
              const isAllNighter = cand.hacker_pace === "all_nighter";

              return (
                <div
                  key={cand.id}
                  className="flex flex-col gap-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 transition-colors hover:border-cyan-800/50 hover:bg-zinc-900/80"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        name={cand.full_name}
                        src={cand.avatar_url}
                        className="h-9 w-9 ring-1 ring-zinc-700"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-xs text-white">{cand.full_name}</p>
                          <span className="text-[10px] text-zinc-400 font-mono">@{cand.github_username}</span>
                          {cand.isRegisteredForEvent && (
                            <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400 py-0">
                              Registered
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400">{cand.college}</p>
                      </div>
                    </div>

                    {team && (
                      <Button
                        size="sm"
                        disabled={hasInvited || isPending}
                        onClick={() => handleInvite(cand.id)}
                        className={`h-7 px-2.5 text-xs ${
                          hasInvited
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10"
                            : "bg-cyan-600 text-white hover:bg-cyan-500"
                        }`}
                      >
                        {hasInvited ? (
                          <>
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Invited
                          </>
                        ) : (
                          <>
                            <Send className="mr-1 h-3 w-3" />
                            Invite
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Signals Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-800/50 text-[10px]">
                    {/* Authenticity Score */}
                    <span
                      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono font-medium ${
                        authScore >= 80
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      }`}
                      title="Commit Authenticity: Ratio of original non-forked code"
                    >
                      <ShieldCheck className="h-3 w-3 text-emerald-400" />
                      {authScore.toFixed(0)}% Authenticity
                    </span>

                    {/* Hacker Pace */}
                    <span
                      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium ${
                        isAllNighter
                          ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                          : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      }`}
                    >
                      {isAllNighter ? <Moon className="h-3 w-3 text-indigo-400" /> : <Sun className="h-3 w-3 text-amber-400" />}
                      {isAllNighter ? "All-Nighter" : "Structured Day"}
                    </span>

                    {/* LeetCode Stats */}
                    {cand.leetcode_stats?.totalSolved && cand.leetcode_stats.totalSolved > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-300 border border-amber-500/20 font-mono">
                        <Flame className="h-3 w-3 text-amber-400" />
                        LC: {cand.leetcode_stats.totalSolved} solved
                      </span>
                    ) : null}

                    {/* Top verified framework badges */}
                    {cand.verified_tech_stack && cand.verified_tech_stack.length > 0 && (
                      cand.verified_tech_stack.slice(0, 3).map((fw) => (
                        <span
                          key={fw.name}
                          className="rounded bg-cyan-950/60 px-1.5 py-0.5 text-cyan-300 border border-cyan-800/40 font-mono"
                        >
                          {fw.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
