import { NextResponse, type NextRequest } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getTeam } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

const ProjectPitchSchema = z.object({
  ideas: z
    .array(
      z.object({
        title: z.string(),
        elevatorPitch: z.string(),
        sponsorAlignment: z.string(),
        technicalArchitecture: z.string(),
        roleAssignments: z.record(z.string(), z.string()),
        noveltyScore: z.number().min(1).max(10),
      }),
    )
    .length(3),
});

/**
 * Deterministic fallback pitch generator when OPENAI_API_KEY is not configured
 * or upstream LLM is unreachable. Guarantees 100% judge-ready output.
 */
function generateDeterministicPitches(params: {
  teamName: string;
  tracks: string[];
  libraries: string[];
  members: Array<{ name: string; role: string }>;
  eventTitle: string;
}) {
  const primaryTrack = params.tracks[0] || "AI Systems & Tooling";
  const secondaryTrack = params.tracks[1] || "Autonomous Realtime Infrastructure";
  const tertiaryTrack = params.tracks[2] || "Open Innovation";

  const topLib1 = params.libraries[0] || "Next.js";
  const topLib2 = params.libraries[1] || "Supabase";
  const topLib3 = params.libraries[2] || "TailwindCSS";

  const makeAssignments = (tasks: string[]) => {
    const record: Record<string, string> = {};
    params.members.forEach((m, idx) => {
      record[m.name] = `${m.role.toUpperCase()}: ${tasks[idx % tasks.length]}`;
    });
    return record;
  };

  return {
    ideas: [
      {
        title: `${primaryTrack.split(" ")[0]}Sync - Real-Time Autonomous Engine`,
        elevatorPitch: `An ultra low-latency intelligent agent coordination pipeline tailored for ${params.eventTitle}, leveraging ${primaryTrack} APIs to streamline high-throughput decision loops without human latency bottlenecks.`,
        sponsorAlignment: `Directly integrates ${primaryTrack} core SDKs for event evaluation and dynamic state synchronization, fulfilling all sponsor rubric criteria.`,
        technicalArchitecture: `Micro-edge pipeline engineered using ${topLib1} App Router, state replication with ${topLib2}, and end-to-end type safety using ${topLib3}.`,
        roleAssignments: makeAssignments([
          "Scaffold core streaming API routes and WebSocket synchronization channels",
          "Design responsive HUD monitoring interface and optimistic client state",
          "Implement LLM payload schemas, error-isolation retries, and rubric hooks",
          "Deploy serverless edge routes, rate-limit policies, and benchmark telemetry",
        ]),
        noveltyScore: 9.4,
      },
      {
        title: `BeaconTrace: High-Assurance ${secondaryTrack.split(" ")[0]} Auditor`,
        elevatorPitch: `A cryptographic verification and anomaly detection daemon targeting ${secondaryTrack}. Automatically flags adversarial inputs and generates audit receipts in sub-50ms.`,
        sponsorAlignment: `Leverages ${secondaryTrack} authentication and streaming rails, showcasing production-grade resilient architectures under high concurrency.`,
        technicalArchitecture: `Modular ingestion queue utilizing ${topLib2} background workers and real-time schema validation with strict Zod types deployed via ${topLib1}.`,
        roleAssignments: makeAssignments([
          "Construct pipeline parser, dependency auditor, and vector indices",
          "Build dark-theme forensic dashboard with interactive timeline scrubber",
          "Configure RPC transaction isolation and real-time broadcast channels",
          "Author test suite verifying race conditions and sub-100ms payload guarantees",
        ]),
        noveltyScore: 8.9,
      },
      {
        title: `OmniPulse: Edge-Synthesized ${tertiaryTrack.split(" ")[0]} Network`,
        elevatorPitch: `A peer-to-peer real-time collaborative workspace facilitating distributed decision synthesis with zero central failure points, optimized for low-bandwidth 36h hackathon environments.`,
        sponsorAlignment: `Demonstrates dual integration of ${primaryTrack} and ${tertiaryTrack} developer APIs with automated fallback resilience.`,
        technicalArchitecture: `Decentralized client mesh synchronized via broadcast websockets, persistence backed by ${topLib2}, styled with ${topLib3}.`,
        roleAssignments: makeAssignments([
          "Implement peer broadcast protocol and debounced state persistence",
          "Design collaborative markdown canvas and split-screen live preview",
          "Develop prompt chaining pipeline and heuristic fallback synthesizer",
          "Profile memory footprint and bundle sizes for maximum browser responsiveness",
        ]),
        noveltyScore: 9.2,
      },
    ],
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const team = await getTeam(teamId);
  if (!team) {
    return NextResponse.json({ ok: false, error: "Team not found" }, { status: 404 });
  }

  // Parse custom prompt instructions or selected tracks from body
  let customTracks = team.selected_tracks;
  try {
    const body = await request.json();
    if (Array.isArray(body?.tracks) && body.tracks.length > 0) {
      customTracks = body.tracks;
    }
  } catch {
    // Body is optional
  }

  // Extract team members
  const memberSummaries = team.members.map((m) => ({
    name: m.profile.full_name,
    role: m.role_assigned,
    github: m.profile.github_username,
  }));

  // Aggregate verified libraries and languages
  const verifiedLibs = new Set<string>();
  for (const m of team.members) {
    for (const f of m.profile.verified_tech_stack ?? []) {
      verifiedLibs.add(f.name);
    }
    for (const d of m.profile.raw_dependencies ?? []) {
      verifiedLibs.add(d);
    }
    for (const lang of Object.keys(m.profile.verified_skills ?? {})) {
      verifiedLibs.add(lang);
    }
  }
  for (const t of team.tech_stack) {
    verifiedLibs.add(t);
  }

  const libraryList = [...verifiedLibs].slice(0, 15);
  const trackList =
    customTracks.length > 0
      ? customTracks
      : team.event.sponsor_tracks.length > 0
        ? team.event.sponsor_tracks.map((t) => t.name)
        : team.event.themes;

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Fallback generator for environments without OPENAI_API_KEY
    const fallbackPitches = generateDeterministicPitches({
      teamName: team.team_name,
      tracks: trackList,
      libraries: libraryList,
      members: memberSummaries,
      eventTitle: team.event.title,
    });

    return NextResponse.json({
      ok: true,
      data: fallbackPitches,
      mode: "deterministic_engine",
    });
  }

  try {
    const systemPrompt = `You are a world-class hackathon strategist and CTO judge.
Your goal is to propose exactly 3 hyper-targeted, high-scoring project architectures for a team competing in "${team.event.title}".
The sprint duration is 36 hours.

CRITICAL REQUIREMENTS:
1. Realism: Absolutely NO vaporware or generic CRUD todo apps. Provide concrete, modern technical architectures.
2. Verified Integration: You MUST incorporate the team's actual verified frameworks: ${libraryList.join(", ")}.
3. Sponsor Bounty Alignment: You MUST deeply weave in the target sponsor tracks: ${trackList.join(", ")}.
4. Role Assignments: Assign realistic, scoped tasks to each team member according to their roles: ${memberSummaries.map((m) => `${m.name} (${m.role})`).join(", ")}.
5. Velocity: Architected specifically to be executable, demo-able, and testable within a 36-hour sprint.`;

    const userPrompt = `Squad Name: ${team.team_name}
Event: ${team.event.title} (${team.event.organizer})
Existing Pitch/Theme: ${team.pitch || "Open innovation"}
Target Sponsor Tracks: ${trackList.join(", ")}
Verified Technical Stack: ${libraryList.join(", ")}
Roster:
${memberSummaries.map((m) => `- ${m.name}: ${m.role}`).join("\n")}

Generate 3 high-impact project proposals conforming to the required schema.`;

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: ProjectPitchSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    return NextResponse.json({
      ok: true,
      data: object,
      mode: "ai_synthesis",
    });
  } catch (err) {
    console.warn("[copilot-ai-error-falling-back]", err);
    // Graceful error isolation
    const fallbackPitches = generateDeterministicPitches({
      teamName: team.team_name,
      tracks: trackList,
      libraries: libraryList,
      members: memberSummaries,
      eventTitle: team.event.title,
    });

    return NextResponse.json({
      ok: true,
      data: fallbackPitches,
      mode: "fallback_engine",
    });
  }
}

