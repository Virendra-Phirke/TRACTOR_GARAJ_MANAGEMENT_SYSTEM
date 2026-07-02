import { Skeleton } from "@/components/ui/skeleton";

export default function ExpensesLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      <div className="grid gap-4 md:grid-cols-3 mb-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card/50 border border-border/30 rounded-xl p-6 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>
      <div className="border border-border/30 rounded-xl overflow-hidden">
        <div className="bg-card/50 p-3 flex gap-4 border-b border-border/30">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-4 flex-1" />)}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-3 flex gap-4 border-b border-border/10">
            {[...Array(5)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
          </div>
        ))}
      </div>
    </div>
  );
}
