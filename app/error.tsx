"use client";

import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center p-6 text-center">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400 ring-1 ring-red-500/20">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-bold tracking-tight text-white">Something went wrong</h2>
          <p className="text-sm text-zinc-400">
            {error.message || "An unexpected error occurred while loading this page."}
          </p>
          {error.digest && (
            <p className="mt-1 font-mono text-[11px] text-zinc-600">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset} variant="default" size="sm">
            <RotateCcw className="h-3.5 w-3.5" />
            Try again
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/matchmaker">
              <Home className="h-3.5 w-3.5" />
              Go to Matchmaker
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

