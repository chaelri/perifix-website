import { Skeleton } from "../ui/skeleton";
import { Card } from "../ui/card";

export function StatCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </Card>
  );
}

export function StatRowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
        <div className="flex gap-2 lg:flex-col">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    </Card>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}

export function DeviceCategorySkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-xl bg-white/30" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-40 bg-white/30" />
            <Skeleton className="h-3 w-32 bg-white/20" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function FetchingBadge() {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
      Refreshing…
    </span>
  );
}
