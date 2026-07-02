import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-card/50 border border-border/30 rounded-xl p-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
