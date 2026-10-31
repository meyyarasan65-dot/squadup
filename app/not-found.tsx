import { Compass, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center p-6 text-center">
      <div className="flex max-w-md flex-col items-center gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/80 font-mono text-xl font-bold text-zinc-300 ring-1 ring-zinc-700">
          404
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">Page Not Found</h1>
          <p className="text-sm text-zinc-400">
            The hackathon, squad, or page you were looking for doesn&apos;t exist or has moved.
          </p>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="default" size="sm">
            <Link href="/matchmaker">
              <Sparkles className="h-3.5 w-3.5" />
              Go to Matchmaker
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/events">
              <Compass className="h-3.5 w-3.5" />
              Browse Events
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

