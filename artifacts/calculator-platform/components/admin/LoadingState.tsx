interface LoadingStateProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export function LoadingState({ rows = 5, cols = 4, className = '' }: LoadingStateProps) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`} aria-label="Loading…" role="status">
      {/* Header row */}
      <div className="flex gap-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 skeleton flex-1 rounded" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-10 skeleton rounded-lg"
              style={{ flex: c === 0 ? 2 : 1 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardLoadingState({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border p-5 space-y-3 animate-pulse" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 skeleton rounded" />
            <div className="h-8 w-8 skeleton rounded-lg" />
          </div>
          <div className="h-7 w-20 skeleton rounded" />
          <div className="h-3 w-28 skeleton rounded" />
        </div>
      ))}
    </div>
  );
}
