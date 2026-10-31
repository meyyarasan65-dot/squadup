"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface SyncStatusWatcherProps {
  syncedAt: string | null;
  isWelcome: boolean;
}

export function SyncStatusWatcher({ syncedAt, isWelcome }: SyncStatusWatcherProps) {
  const router = useRouter();
  const [hasNotified, setHasNotified] = useState(false);

  const isPending = syncedAt === null;

  useEffect(() => {
    if (!isPending) {
      if (isWelcome && !hasNotified) {
        toast.success("GitHub skill verification complete!", {
          description: "Your verified language tags and repository stats have been calculated.",
        });
        setHasNotified(true);
      }
      return;
    }

    // Refresh every 3 seconds while background ingestion is running
    const interval = setInterval(() => {
      router.refresh();
    }, 3000);

    return () => clearInterval(interval);
  }, [isPending, isWelcome, hasNotified, router]);

  if (!isPending && !isWelcome) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col gap-3 rounded-xl border p-4 sm:p-5 ${
        isPending
          ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-200"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      }`}
    >
      <div className="flex items-center gap-3">
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        )}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">
            {isPending
              ? "Ingesting your GitHub repositories..."
              : "GitHub verified skills ready!"}
          </h3>
          <p className="text-xs text-zinc-300">
            {isPending
              ? "Analyzing your top repositories to compute verified language byte percentages. This page will refresh automatically."
              : "Your verified skill tags are active and will be used by the matchmaker algorithm."}
          </p>
        </div>
        {!isPending && isWelcome && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-300">
            <Sparkles className="h-3 w-3" />
            Verified
          </span>
        )}
      </div>

      {isPending && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-indigo-950/60">
          <motion.div
            className="h-full bg-indigo-500"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          />
        </div>
      )}
    </motion.div>
  );
}

