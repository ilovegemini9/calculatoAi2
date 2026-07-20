import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', className)}
      aria-hidden="true"
    />
  );
}

export function CalculatorSkeleton() {
  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      role="status"
      aria-label="Loading calculator"
    >
      {/* Inputs panel skeleton */}
      <div
        className="rounded-2xl border p-6 flex flex-col gap-5 shadow-sm"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <Skeleton className="h-3 w-32" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
      </div>

      {/* Results panel skeleton */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <Skeleton className="h-3 w-20 bg-slate-700" />
          <Skeleton className="h-5 w-16 rounded-full bg-slate-700" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <Skeleton className="h-2.5 w-16 bg-slate-700" />
              <Skeleton className="h-7 w-28 bg-slate-600" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
