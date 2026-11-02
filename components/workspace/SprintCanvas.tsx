"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Check,
  Copy,
  Eye,
  FileEdit,
  Layers,
  Loader2,
  Radio,
} from "lucide-react";
import { updateSprintNotesAction } from "@/app/actions/teams";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface SprintCanvasProps {
  teamId: string;
  initialContent: string | null;
  currentUserId: string;
  isMember: boolean;
}

const DEFAULT_SPRINT_TEMPLATE = `# Sprint Plan

## 🏛 Technical Architecture

- Frontend: Next.js App Router & Tailwind CSS
- Backend / DB: Supabase PostgreSQL & Edge Functions
- AI / Integrations: Vercel AI SDK & Target Sponsor APIs

## ⏱ 36-Hour MVP Milestones

- [ ] Hour 0-6: Schema definition, GitHub repo sync & base UI scaffold
- [ ] Hour 6-18: Core matchmaking & AI generation engines
- [ ] Hour 18-28: Realtime collaboration canvas & webhook notifications
- [ ] Hour 28-34: Edge case hardening & live demo verification
- [ ] Hour 34-36: Demo pitch deck & submission ready
`;

export function SprintCanvas({
  teamId,
  initialContent,
  currentUserId,
  isMember,
}: SprintCanvasProps) {
  const [content, setContent] = useState<string>(
    initialContent && initialContent.trim().length > 0
      ? initialContent
      : DEFAULT_SPRINT_TEMPLATE,
  );
  const [mode, setMode] = useState<"edit" | "preview" | "split">("split");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [, startTransition] = useTransition();

  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLocalUpdateRef = useRef(false);

  // Initialize Supabase Realtime Broadcast Channel
  useEffect(() => {
    const supabase = createClient();
    const channelName = `realtime:team_workspace:${teamId}`;
    const channel = supabase.channel(channelName);

    channel
      .on("broadcast", { event: "content_change" }, (payload) => {
        // Only accept updates broadcast by other teammates
        if (payload?.payload?.senderId !== currentUserId) {
          if (typeof payload?.payload?.content === "string") {
            isLocalUpdateRef.current = false;
            setContent(payload.payload.content);
            setSaveStatus("saved");
          }
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [teamId, currentUserId]);

  // Handle local text changes with Realtime broadcast & 500ms debounced persistence
  const handleChange = (newVal: string) => {
    setContent(newVal);
    setSaveStatus("saving");
    isLocalUpdateRef.current = true;

    // Broadcast immediately to connected squad teammates
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: "broadcast",
        event: "content_change",
        payload: { content: newVal, senderId: currentUserId },
      });
    }

    // 500ms debounced commit to database
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await updateSprintNotesAction(teamId, newVal);
        if (res.ok) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("unsaved");
        }
      });
    }, 500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertTemplate = (snippet: string) => {
    const updated = content + "\n\n" + snippet;
    handleChange(updated);
  };

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden">
      {/* Canvas Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/60 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-cyan-500/10 p-1.5 text-cyan-400 border border-cyan-500/20">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-white">Live Sprint Canvas</h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  isConnected
                    ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isConnected ? "bg-cyan-400 animate-pulse" : "bg-zinc-500"
                  }`}
                />
                {isConnected ? "Realtime Active" : "Connecting..."}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Synchronized collaborative Markdown workspace for architecture & milestones.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1 mr-1">
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
                <span className="text-amber-400">Syncing...</span>
              </>
            ) : saveStatus === "saved" ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Saved</span>
              </>
            ) : (
              <span className="text-red-400">Unsaved changes</span>
            )}
          </span>

          {/* Mode Switcher */}
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5 text-xs">
            <button
              onClick={() => setMode("edit")}
              className={`flex items-center gap-1 rounded px-2 py-1 transition-colors ${
                mode === "edit" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <FileEdit className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Editor</span>
            </button>
            <button
              onClick={() => setMode("split")}
              className={`flex items-center gap-1 rounded px-2 py-1 transition-colors ${
                mode === "split" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              onClick={() => setMode("preview")}
              className={`flex items-center gap-1 rounded px-2 py-1 transition-colors ${
                mode === "preview" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-8 border-zinc-800 text-xs text-zinc-300 hover:bg-zinc-900"
          >
            {copied ? <Check className="mr-1 h-3.5 w-3.5 text-emerald-400" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Editor & Preview Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800 min-h-[380px]">
        {/* Editor Column */}
        {(mode === "edit" || mode === "split") && (
          <div className={`flex flex-col p-4 bg-zinc-950/80 ${mode === "edit" ? "col-span-full" : ""}`}>
            <textarea
              value={content}
              disabled={!isMember}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="# Sprint Plan&#10;&#10;Write architecture notes, API designs, or milestones here..."
              className="w-full flex-1 resize-none bg-transparent font-mono text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none leading-relaxed min-h-[320px]"
              spellCheck={false}
            />
            {isMember && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-500">
                <span>Quick templates:</span>
                <button
                  type="button"
                  onClick={() =>
                    insertTemplate(
                      "### 📡 Key API Endpoints\n- `POST /api/v1/stream` - Core processing pipeline\n- `GET /api/v1/metrics` - Realtime telemetry",
                    )
                  }
                  className="rounded bg-zinc-900 px-2 py-0.5 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  + API Template
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertTemplate(
                      "### 🛡 Risk Mitigation & Plan B\n- Fallback 1: Static mock data if upstream LLM rate-limits\n- Fallback 2: Pre-recorded demo video if live Wi-Fi drops",
                    )
                  }
                  className="rounded bg-zinc-900 px-2 py-0.5 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  + Plan B Fallback
                </button>
              </div>
            )}
          </div>
        )}

        {/* Markdown Preview Column */}
        {(mode === "preview" || mode === "split") && (
          <div className={`p-4 bg-zinc-900/30 overflow-y-auto max-h-[500px] ${mode === "preview" ? "col-span-full" : ""}`}>
            <div className="prose prose-invert prose-xs max-w-none space-y-2">
              {content.split("\n").map((line, idx) => {
                if (line.startsWith("# ")) {
                  return (
                    <h1 key={idx} className="text-lg font-bold text-white border-b border-zinc-800 pb-1 mt-3 first:mt-0">
                      {line.replace("# ", "")}
                    </h1>
                  );
                }
                if (line.startsWith("## ")) {
                  return (
                    <h2 key={idx} className="text-sm font-semibold text-cyan-300 mt-3 border-b border-zinc-800/40 pb-0.5">
                      {line.replace("## ", "")}
                    </h2>
                  );
                }
                if (line.startsWith("### ")) {
                  return (
                    <h3 key={idx} className="text-xs font-semibold text-zinc-200 mt-2">
                      {line.replace("### ", "")}
                    </h3>
                  );
                }
                if (line.startsWith("- [ ] ")) {
                  return (
                    <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                      <div className="h-3 w-3 rounded border border-zinc-700 bg-zinc-950" />
                      <span>{line.replace("- [ ] ", "")}</span>
                    </div>
                  );
                }
                if (line.startsWith("- [x] ")) {
                  return (
                    <div key={idx} className="flex items-center gap-2 text-xs text-emerald-400 line-through">
                      <div className="h-3 w-3 rounded border border-emerald-500 bg-emerald-500/20 flex items-center justify-center">
                        <Check className="h-2 w-2 text-emerald-400" />
                      </div>
                      <span>{line.replace("- [x] ", "")}</span>
                    </div>
                  );
                }
                if (line.startsWith("- ")) {
                  return (
                    <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300 pl-2">
                      <span className="text-cyan-400 leading-none mt-1">•</span>
                      <span>{line.replace("- ", "")}</span>
                    </div>
                  );
                }
                if (line.trim().length === 0) {
                  return <div key={idx} className="h-2" />;
                }
                return (
                  <p key={idx} className="text-xs text-zinc-300 leading-relaxed">
                    {line}
                  </p>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
