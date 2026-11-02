"use client";

import { useEffect, useState, useTransition } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Github,
  Loader2,
  MessageSquare,
  Rocket,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/form-controls";
import type { TeamWithMembers } from "@/types";

interface WorkspaceBootstrapperProps {
  team: TeamWithMembers;
  isLeader: boolean;
}

export function WorkspaceBootstrapper({ team, isLeader }: WorkspaceBootstrapperProps) {
  const [open, setOpen] = useState(false);
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState(
    team.discord_webhook_url || "",
  );
  const [githubToken, setGithubToken] = useState("");
  const [repoUrl, setRepoUrl] = useState<string | null>(team.github_repo_url || null);
  const [discordSent, setDiscordSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("squadup_github_pat");
      if (saved) setGithubToken(saved);
    } catch {
      // Ignore localStorage issues
    }
  }, []);

  const handleBootstrap = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/teams/${team.id}/bootstrap`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            discord_webhook_url: discordWebhookUrl.trim() || undefined,
            github_token: githubToken.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (data.ok) {
          setRepoUrl(data.repo_url);
          setDiscordSent(data.discord_sent);
        } else {
          setError(data.error || "Failed to bootstrap workspace");
        }
      } catch {
        setError("Network error while connecting to workspace bootstrapper");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {repoUrl ? (
          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-cyan-500/30 bg-cyan-950/20 text-cyan-300 hover:bg-cyan-900/30 hover:text-white"
            >
              <a href={repoUrl} target="_blank" rel="noreferrer">
                <Github className="mr-1.5 h-3.5 w-3.5" />
                Repo Workspace
                <ExternalLink className="ml-1 h-3 w-3 opacity-60" />
              </a>
            </Button>
            {isLeader && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-zinc-400 hover:text-white"
              >
                Sync
              </Button>
            )}
          </div>
        ) : isLeader ? (
          <Button
            size="sm"
            className="group border border-cyan-500/40 bg-gradient-to-r from-cyan-900/80 via-zinc-900 to-cyan-950/80 text-cyan-300 hover:border-cyan-400 hover:text-white shadow-lg shadow-cyan-950/30"
          >
            <Rocket className="mr-1.5 h-3.5 w-3.5 text-cyan-400 transition-transform group-hover:-translate-y-0.5" />
            Bootstrap Workspace
          </Button>
        ) : null}
      </DialogTrigger>

      <DialogContent className="max-w-md border-cyan-900/50 bg-zinc-950 p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                One-Click Hackathon Workspace
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Instantly provision an official GitHub repo, invite all squad members, and dispatch Discord rich notifications.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {repoUrl ? (
          <div className="flex flex-col gap-4 py-2">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1">
                <CheckCircle2 className="h-4 w-4" />
                Workspace Live & Provisioned!
              </div>
              <p className="text-xs text-zinc-300 mb-3">
                Official repository created and collaborators invited.
              </p>
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 font-mono text-xs font-semibold text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
              >
                <Github className="h-3.5 w-3.5" />
                {repoUrl}
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
              {discordSent && (
                <p className="text-[11px] text-cyan-300 mt-2 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  Discord cyan rich embed dispatched successfully.
                </p>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="border-zinc-800 text-xs text-zinc-300"
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <Github className="h-3.5 w-3.5 text-cyan-400" />
                  GitHub Personal Access Token (PAT)
                </label>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=SquadUp+Workspace+Bootstrapper"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                >
                  Create token (repo scope)
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
              <Input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={githubToken}
                onChange={(e) => {
                  setGithubToken(e.target.value);
                  try {
                    localStorage.setItem("squadup_github_pat", e.target.value);
                  } catch {
                    // Ignore storage issues
                  }
                }}
                className="bg-zinc-900 border-zinc-800 text-xs font-mono"
              />
              <p className="text-[11px] text-zinc-500">
                Required to create the repo & invite collaborators. (Or set <code className="text-cyan-400">GITHUB_TOKEN</code> in your environment variables).
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                Discord Webhook URL (Optional)
              </label>
              <Input
                placeholder="https://discord.com/api/webhooks/..."
                value={discordWebhookUrl}
                onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs font-mono"
              />
              <p className="text-[11px] text-zinc-500">
                SquadUp will broadcast a cyan embed with repo links, target sponsor tracks, and squad assignments.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/30 p-2.5 text-xs text-red-300">
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-xs text-zinc-400 flex flex-col gap-1.5">
              <span className="font-semibold text-zinc-200">What happens on click:</span>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>Creates GitHub repository <span className="font-mono text-cyan-400">squadup-{team.event.slug}-{team.team_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}</span></li>
                <li>Initializes <span className="font-mono text-zinc-300">README.md</span> with project pitch, roster roles, and tracks</li>
                <li>Invites all {team.members.length} team members as collaborators</li>
              </ul>
            </div>

            <Button
              onClick={handleBootstrap}
              disabled={isPending}
              className="bg-cyan-600 text-white hover:bg-cyan-500"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Provisioning Workspace...
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-4 w-4" />
                  Initialize Repository & Workspace
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
