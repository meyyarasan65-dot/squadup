import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto flex max-w-5xl flex-col gap-8 py-8">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Cards Skeleton Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-12 w-full" />
            <div className="flex flex-col gap-2 pt-2">
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-2 w-4/5 rounded-full" />
            </div>
            <Skeleton className="mt-auto h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

