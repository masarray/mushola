import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-muted/70",
        className
      )}
    />
  );
}

export function HomeScreenSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {/* Hero */}
      <Shimmer className="h-[200px] rounded-3xl" />

      {/* Ringkasan Kas */}
      <div className="bg-card rounded-3xl border border-border p-5">
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            <Shimmer className="h-6 w-40 rounded-lg" />
            <Shimmer className="h-4 w-56 mt-2 rounded-lg" />
          </div>
          <Shimmer className="h-7 w-16 rounded-full" />
        </div>

        {/* Balance */}
        <div className="rounded-2xl border border-border/50 p-5">
          <Shimmer className="h-3 w-28 rounded-md" />
          <Shimmer className="h-9 w-44 mt-2 rounded-lg" />
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/30 p-4">
              <Shimmer className="h-3 w-20 rounded-md" />
              <Shimmer className="h-6 w-28 mt-3 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Fokus Musim */}
      <div className="bg-card rounded-3xl border border-border p-5">
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            <Shimmer className="h-6 w-36 rounded-lg" />
            <Shimmer className="h-4 w-52 mt-2 rounded-lg" />
          </div>
          <Shimmer className="h-7 w-16 rounded-full" />
        </div>
        <div className="rounded-2xl border border-border/50 p-5">
          <Shimmer className="h-3 w-28 rounded-md" />
          <Shimmer className="h-7 w-40 mt-2 rounded-lg" />
          <Shimmer className="h-3 w-full mt-4 rounded-full" />
          <div className="flex justify-between mt-3">
            <Shimmer className="h-3 w-32 rounded-md" />
            <Shimmer className="h-3 w-16 rounded-md" />
          </div>
        </div>
        <Shimmer className="h-20 mt-4 rounded-2xl" />
        <Shimmer className="h-16 mt-3 rounded-2xl" />
      </div>
    </div>
  );
}

export function EventScreenSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="bg-card rounded-3xl border border-border p-5">
        <Shimmer className="h-6 w-40 rounded-lg" />
        <Shimmer className="h-4 w-56 mt-2 rounded-lg mb-5" />

        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/30 p-4">
              <Shimmer className="h-3 w-20 rounded-md" />
              <Shimmer className="h-7 w-16 mt-3 rounded-lg" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 mt-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/50 p-4">
              <div className="flex justify-between mb-3">
                <Shimmer className="h-4 w-24 rounded-md" />
                <Shimmer className="h-4 w-20 rounded-md" />
              </div>
              <Shimmer className="h-2 w-full rounded-full" />
              <Shimmer className="h-2 w-full mt-3 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
