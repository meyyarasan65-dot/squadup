"use client";

import { useState, useTransition } from "react";
import {
  Award,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Flame,
  Layers,
  Loader2,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { updateTeamTracksAction } from "@/app/actions/teams";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProjectPitch, TeamWithMembers } from "@/types";

interface StrategyCoPilotProps {
  team: TeamWithMembers;
  isLeader: boolean;
  onApplyPitch?: (pitch: string) => void;
}

const DEFAULT_POPULAR_SPONSORS = [
  "ElevenLabs Voice AI",
  "Cloudflare Workers AI",
  "Supabase Realtime & Auth",
  "MongoDB Atlas Vector",
  "OpenAI Developer Track",
];

export function StrategyCoPilot({ team, isLeader, onApplyPitch }: StrategyCoPilotProps) {
  const [selectedTracks, setSelectedTracks] = useState<string[]>(
    team.selected_tracks.length > 0
      ? team.selected_tracks
      : team.event.sponsor_tracks.length > 0
        ? team.event.sponsor_tracks.map((t) => t.name)
        : [DEFAULT_POPULAR_SPONSORS[0] as string, DEFAULT_POPULAR_SPONSORS[1] as string],
  );

  const [pitches, setPitches] = useState<ProjectPitch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [copiedPitchIndex, setCopiedPitchIndex] = useState<number | null>(null);
  const [tracksSaved, setTracksSaved] = useState(false);
  const [, startTransition] = useTransition();

  const availableTracks =
    team.event.sponsor_tracks.length > 0
      ? team.event.sponsor_tracks.map((t) => t.name)
      : team.event.themes.length > 0
        ? team.event.themes
        : DEFAULT_POPULAR_SPONSORS;

  const toggleTrack = (track: string) => {
    let next: string[];
    if (selectedTracks.includes(track)) {
      next = selectedTracks.filter((t) => t !== track);
    } else {
      next = [...selectedTracks, track];
    }
    setSelectedTracks(next);
    if (isLeader) {
      startTransition(async () => {
        const res = await updateTeamTracksAction(team.id, next);
        if (res.ok) {
          setTracksSaved(true);
          setTimeout(() => setTracksSaved(false), 2000);
        }
      });
    }
  };

  const runCoPilot = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/teams/${team.id}/copilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: selectedTracks }),
      });
      const data = await res.json();
      if (data.ok && data.data?.ideas) {
        setPitches(data.data.ideas);
        setExpandedIndex(0);
      } else {
        setError(data.error || "Co-Pilot could not synthesize project pitches");
      }
    } catch {
      setError("Failed to communicate with Rubric Strategy Co-Pilot");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPitch = (idea: ProjectPitch, idx: number) => {
    navigator.clipboard.writeText(
      `# ${idea.title}\n\n${idea.elevatorPitch}\n\n**Sponsor Alignment:**\n${idea.sponsorAlignment}\n\n**Architecture:**\n${idea.technicalArchitecture}`,
    );
    setCopiedPitchIndex(idx);
    setTimeout(() => setCopiedPitchIndex(null), 2000);
    if (onApplyPitch) {
      onApplyPitch(idea.elevatorPitch);
    }
  };

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 p-2 text-cyan-400 border border-cyan-500/30">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">Sponsor Track & Rubric Strategy Co-Pilot</h3>
              <Badge variant="outline" className="border-indigo-500/40 text-indigo-300 text-[10px] font-mono">
                AI Synthesis
              </Badge>
            </div>
            <p className="text-xs text-zinc-400">
              Synthesizes target sponsor tracks against your squad&apos;s verified dependency stack into winning project architectures.
            </p>
          </div>
        </div>

        <Button
          onClick={runCoPilot}
          disabled={loading}
          className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 via-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-950/40 hover:from-indigo-500 hover:to-cyan-500"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Synthesizing 3 Architectures...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4 text-cyan-200 transition-transform group-hover:rotate-12" />
              Run Strategy Co-Pilot
            </>
          )}
        </Button>
      </div>

      {/* Track Badges Selector */}
      <div className="flex flex-col gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-300 flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-cyan-400" />
            Targeted Sponsor Bounties & Tracks
          </span>
          {tracksSaved && <span className="text-[10px] text-emerald-400">Tracks updated</span>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {availableTracks.map((track) => {
            const isSelected = selectedTracks.includes(track);
            return (
              <button
                key={track}
                type="button"
                onClick={() => toggleTrack(track)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  isSelected
                    ? "border border-cyan-500 bg-cyan-50 text-cyan-800 shadow-sm dark:border-cyan-500/50 dark:bg-cyan-950/40 dark:text-cyan-300"
                    : "border border-border bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
                }`}
              >
                {isSelected && <Check className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />}
                {track}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Generated Pitches Accordion / Cards */}
      {pitches.length > 0 && (
        <div className="flex flex-col gap-3.5 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-amber-400" />
            Proposed 36-Hour Hackathon Architectures
          </h4>

          <div className="grid grid-cols-1 gap-3">
            {pitches.map((idea, idx) => {
              const isExpanded = expandedIndex === idx;

              return (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 transition-all hover:border-zinc-700"
                >
                  <div
                    className="flex cursor-pointer items-start justify-between gap-3"
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white">{idea.title}</span>
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/20">
                          <Flame className="h-3 w-3 text-amber-400" />
                          {idea.noveltyScore} / 10 Novelty
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{idea.elevatorPitch}</p>
                    </div>

                    <button
                      type="button"
                      className="rounded-lg p-1 text-zinc-500 hover:text-zinc-200"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 flex flex-col gap-3 border-t border-zinc-800/80 pt-3 text-xs">
                      {/* Sponsor Alignment */}
                      <div className="rounded-lg border border-cyan-900/30 bg-cyan-950/20 p-2.5">
                        <span className="font-semibold text-cyan-300 block mb-0.5 flex items-center gap-1 text-[11px]">
                          <Target className="h-3 w-3" /> Sponsor Bounty Alignment
                        </span>
                        <p className="text-zinc-300 text-xs">{idea.sponsorAlignment}</p>
                      </div>

                      {/* Technical Architecture */}
                      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5">
                        <span className="font-semibold text-zinc-200 block mb-0.5 flex items-center gap-1 text-[11px]">
                          <Cpu className="h-3 w-3 text-indigo-400" /> Technical Architecture
                        </span>
                        <p className="text-zinc-300 text-xs leading-relaxed">{idea.technicalArchitecture}</p>
                      </div>

                      {/* Role Assignments */}
                      {idea.roleAssignments && Object.keys(idea.roleAssignments).length > 0 && (
                        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-2.5">
                          <span className="font-semibold text-zinc-200 block mb-1.5 flex items-center gap-1 text-[11px]">
                            <Users className="h-3 w-3 text-emerald-400" /> Sprint Roster Execution Plan
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {Object.entries(idea.roleAssignments).map(([member, task]) => (
                              <div
                                key={member}
                                className="flex flex-col rounded bg-zinc-950/80 p-2 border border-zinc-800/60"
                              >
                                <span className="font-semibold text-white text-[11px]">{member}</span>
                                <span className="text-zinc-400 text-[10px]">{task}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyPitch(idea, idx)}
                          className="h-7 border-zinc-800 text-xs text-zinc-300 hover:text-white"
                        >
                          {copiedPitchIndex === idx ? (
                            <>
                              <Check className="mr-1 h-3 w-3 text-emerald-400" />
                              Copied Architecture!
                            </>
                          ) : (
                            <>
                              <Layers className="mr-1 h-3 w-3" />
                              Copy Architecture
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
