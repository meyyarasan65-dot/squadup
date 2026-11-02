import { NextResponse, type NextRequest } from "next/server";
import { getTeam } from "@/lib/queries";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function sanitizeRepoName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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

  if (team.leader_id !== user.id) {
    return NextResponse.json(
      { ok: false, error: "Only the team leader can bootstrap the workspace" },
      { status: 403 },
    );
  }

  // Parse optional webhook URL override from body
  let discordWebhookUrl = team.discord_webhook_url;
  try {
    const body = await request.json();
    if (body?.discord_webhook_url) {
      discordWebhookUrl = body.discord_webhook_url.trim();
    }
  } catch {
    // Body is optional
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const githubToken = session?.provider_token || process.env.GITHUB_TOKEN || null;

  if (!githubToken) {
    return NextResponse.json(
      {
        ok: false,
        error: "GitHub token unavailable. Please sign in with GitHub or configure GITHUB_TOKEN.",
      },
      { status: 400 },
    );
  }

  const eventSlug = sanitizeRepoName(team.event.slug || "hackathon");
  const teamSlug = sanitizeRepoName(team.team_name || "squad");
  const repoName = `squadup-${eventSlug}-${teamSlug}`;

  let repoUrl = team.github_repo_url;
  let repoOwner = "";

  // 1. Provision GitHub Repository
  try {
    const createRepoRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "squadup-workspace-bootstrapper",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: repoName,
        description: `Official workspace for ${team.team_name} in ${team.event.title} — SquadUp Matchmaker`,
        private: false,
        auto_init: true,
      }),
    });

    if (createRepoRes.status === 201) {
      const repoData = await createRepoRes.json();
      repoUrl = repoData.html_url;
      repoOwner = repoData.owner.login;
    } else if (createRepoRes.status === 422) {
      // Repo already exists or conflict; retrieve current authenticated user login to construct URL
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "squadup-workspace-bootstrapper",
        },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        repoOwner = userData.login;
        repoUrl = `https://github.com/${repoOwner}/${repoName}`;
      }
    } else {
      const errBody = await createRepoRes.text();
      console.error("[bootstrap-github-error]", createRepoRes.status, errBody);
      return NextResponse.json(
        { ok: false, error: `GitHub repository creation failed (${createRepoRes.status})` },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("[bootstrap-github-exception]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to connect to GitHub API" },
      { status: 502 },
    );
  }

  // 2. Commit Initial README.md & Invite Collaborators (isolated operations)
  if (repoOwner && repoUrl) {
    const rosterMarkdown = team.members
      .map(
        (m) =>
          `- **${m.profile.full_name}** (@${m.profile.github_username}) — \`${m.role_assigned}\``,
      )
      .join("\n");

    const tracksMarkdown =
      team.selected_tracks.length > 0
        ? team.selected_tracks.map((t) => `- 🎯 ${t}`).join("\n")
        : "- General Hackathon Track";

    const techMarkdown =
      team.tech_stack.length > 0
        ? team.tech_stack.map((t) => `\`${t}\``).join(", ")
        : "Flexible stack";

    const readmeContent = `# ${team.team_name}

> Competing in **${team.event.title}** (Organized by ${team.event.organizer})

## 🚀 Pitch
${team.pitch || "Innovative solution developed during the hackathon sprint."}

## 👥 Squad Roster
${rosterMarkdown}

## 🎯 Target Sponsor Tracks
${tracksMarkdown}

## 🛠 Tech Stack
${techMarkdown}

---
*Autonomous workspace provisioned via [SquadUp](https://squadup-orcin.vercel.app)*
`;

    // Try committing README.md
    try {
      // Check if README.md exists to get SHA for update
      const existingRes = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/README.md`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "squadup-workspace-bootstrapper",
          },
        },
      );
      let sha: string | undefined;
      if (existingRes.ok) {
        const fileData = await existingRes.json();
        sha = fileData.sha;
      }

      await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/README.md`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "squadup-workspace-bootstrapper",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: "chore: bootstrap SquadUp project workspace",
            content: Buffer.from(readmeContent).toString("base64"),
            ...(sha ? { sha } : {}),
          }),
        },
      );
    } catch (e) {
      console.warn("[bootstrap-readme-skipped]", e);
    }

    // Invite team members as collaborators
    for (const member of team.members) {
      const ghUsername = member.profile.github_username;
      if (!ghUsername || ghUsername.toLowerCase() === repoOwner.toLowerCase()) continue;

      try {
        await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/collaborators/${encodeURIComponent(ghUsername)}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github+json",
              "User-Agent": "squadup-workspace-bootstrapper",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ permission: "push" }),
          },
        );
      } catch (err) {
        console.warn(`[bootstrap-collab-failed] for ${ghUsername}`, err);
      }
    }
  }

  // 3. Dispatch Discord Webhook
  let discordSent = false;
  if (discordWebhookUrl && discordWebhookUrl.startsWith("https://discord.com/api/webhooks/")) {
    const rosterField = team.members
      .map((m) => `• **${m.profile.full_name}** (@${m.profile.github_username}) - \`${m.role_assigned}\``)
      .join("\n") || "No members listed";

    const tracksField =
      team.selected_tracks.length > 0
        ? team.selected_tracks.join(", ")
        : "General Hackathon Track";

    try {
      const discordRes = await fetch(discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: "🚀 SquadUp: Workspace Initialized!",
              description: `Sprint workspace initialized for **${team.team_name}** in **${team.event.title}**!`,
              color: 439764, // #06B6D4 (Cyan)
              fields: [
                {
                  name: "📦 Repository",
                  value: repoUrl ? `[${repoName}](${repoUrl})` : "Provisioned",
                  inline: false,
                },
                {
                  name: "👥 Squad Roster",
                  value: rosterField,
                  inline: true,
                },
                {
                  name: "🎯 Target Sponsor Tracks",
                  value: tracksField,
                  inline: true,
                },
              ],
              footer: {
                text: "SquadUp Workspace Provisioner • Good luck in the sprint!",
              },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });

      discordSent = discordRes.ok;
    } catch (err) {
      console.warn("[bootstrap-discord-failed]", err);
    }
  }

  // 4. Update team record in database
  const admin = createAdminClient();
  await admin
    .from("teams")
    .update({
      github_repo_url: repoUrl,
      ...(discordWebhookUrl ? { discord_webhook_url: discordWebhookUrl } : {}),
    })
    .eq("id", team.id);

  return NextResponse.json({
    ok: true,
    repo_url: repoUrl,
    discord_sent: discordSent,
  });
}

