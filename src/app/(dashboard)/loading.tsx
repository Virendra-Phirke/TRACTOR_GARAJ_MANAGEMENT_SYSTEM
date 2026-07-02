import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card/50 border border-border/30 rounded-xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-7">
        <div className="col-span-4 bg-card/50 border border-border/30 rounded-xl p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
        <div className="col-span-3 bg-card/50 border border-border/30 rounded-xl p-6 space-y-4">
          <Skeleton className="h-5 w-28" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
