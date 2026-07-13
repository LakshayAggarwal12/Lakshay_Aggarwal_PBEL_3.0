export default function Skeleton({ className = "" }) {
  return <div className={`shimmer rounded-md ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-border-soft">
      <Skeleton className="h-9 w-9 rounded-full" />
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-3 w-20 ml-auto" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  );
}
