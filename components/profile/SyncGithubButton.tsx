"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface SyncGithubButtonProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export function SyncGithubButton({
  className,
  size = "sm",
  variant = "outline",
}: SyncGithubButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sync-github", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        toast.error(data.error || "Sync failed", {
          description: res.status === 429 ? "Please wait before triggering another sync." : undefined,
        });
        return;
      }

      toast.success("GitHub data synced successfully", {
        description: `Analyzed ${data.stats?.repos_analyzed ?? 0} repositories.`,
      });
      router.refresh();
    } catch {
      toast.error("Network error while connecting to GitHub sync service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSync}
      disabled={loading}
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Syncing repos..." : "Re-sync GitHub"}
    </Button>
  );
}

