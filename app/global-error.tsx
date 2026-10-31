"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 p-6 text-zinc-100 antialiased">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center shadow-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400 ring-1 ring-red-500/20">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="text-xl font-bold tracking-tight text-white">Application Error</h1>
            <p className="text-sm text-zinc-400">
              A critical application error occurred. We have logged this issue.
            </p>
            {error.digest && (
              <p className="mt-1 font-mono text-[11px] text-zinc-600">
                Digest: {error.digest}
              </p>
            )}
          </div>

          <Button onClick={reset} variant="default" size="sm" className="mt-2">
            <RotateCcw className="h-3.5 w-3.5" />
            Reload application
          </Button>
        </div>
      </body>
    </html>
  );
}

