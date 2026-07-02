import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Skeleton className="h-9 w-40" />
      <div className="space-y-6">
        {/* Filter bar skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card/50 p-4 rounded-xl border border-border/30">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
        {/* KPI cards skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card/50 border border-border/30 rounded-xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        {/* Charts skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4 bg-card/50 border border-border/30 rounded-xl p-6 space-y-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-[350px] w-full rounded-lg" />
          </div>
          <div className="col-span-3 bg-card/50 border border-border/30 rounded-xl p-6 space-y-4">
            <Skeleton className="h-5 w-48" />
            <div className="space-y-6 mt-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 rounded" style={{ width: `${90 - i * 15}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
