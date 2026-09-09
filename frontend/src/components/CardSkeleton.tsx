// Shimmer placeholder for card grids — replaces bare "Loading…" text, which
// gave zero indication of what shape was about to appear and read as an
// afterthought at the one moment users are actively waiting and watching.
export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-surface-2 p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-surface-1" />
          <div className="h-3 w-24 rounded bg-surface-1" />
        </div>
        <div className="h-6 w-20 rounded-full bg-surface-1" />
      </div>
      <div className="mb-3 h-3 w-full rounded bg-surface-1" />
      <div className="h-16 rounded-xl bg-surface-1" />
    </div>
  );
}

export function CardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
