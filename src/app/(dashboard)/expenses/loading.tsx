import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function InvoicesLoading() {
  return (
    <div className="p-6 space-y-6 block-stagger">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Skeleton className="h-10 w-64 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      
      <Card className="bg-card/50">
        <CardContent className="p-0">
          <div className="border-b border-border/40 p-4 flex gap-4">
            <Skeleton className="h-8 w-64 rounded-md" />
            <Skeleton className="h-8 w-32 ml-auto rounded-md" />
          </div>
          <div className="p-4 grid gap-4">
            <div className="flex gap-4 pb-2 border-b border-border/20">
              {[...Array(6)].map((_, j) => <Skeleton key={j} className="h-4 flex-1" />)}
            </div>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-4 py-1">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            ))}
          </div>
          <div className="border-t border-border/40 p-4 flex items-center justify-between">
             <Skeleton className="h-4 w-32" />
             <div className="flex gap-2">
               <Skeleton className="h-8 w-24 rounded-md" />
               <Skeleton className="h-8 w-24 rounded-md" />
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
