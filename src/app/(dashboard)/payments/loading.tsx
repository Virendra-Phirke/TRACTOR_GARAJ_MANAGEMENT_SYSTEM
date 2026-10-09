import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 block-stagger">
      {/* 4 KPI Metric Card Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/60 bg-card/60">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-3 rounded-xl border border-border/60 bg-card/40">
        <div className="flex gap-2 w-full sm:w-auto">
          <Skeleton className="h-9 w-64 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>

      {/* Table Skeleton */}
      <Card className="border-border/60 bg-card/50">
        <CardContent className="p-0">
          <div className="p-4 grid gap-4">
            <div className="flex gap-4 pb-2 border-b border-border/20">
              {[...Array(7)].map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-4 py-2 border-b border-border/10">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-7 w-16 rounded-md ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
