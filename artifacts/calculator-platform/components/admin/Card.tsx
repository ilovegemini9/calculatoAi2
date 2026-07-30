import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ── Generic content card ──────────────────────────────────────────────────────

interface ContentCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  noPadding?: boolean;
}

export function ContentCard({
  title,
  description,
  children,
  className = '',
  action,
  noPadding = false,
}: ContentCardProps) {
  return (
    <div
      className={`rounded-xl border ${className}`}
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
    >
      {(title || action) && (
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            {title && (
              <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
            )}
            {description && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

type Trend = 'up' | 'down' | 'neutral';

interface StatCardProps {
  label: string;
  value?: string | number;
  trend?: Trend;
  trendLabel?: string;
  icon?: ReactNode;
  loading?: boolean;
}

export function StatCard({ label, value, trend, trendLabel, icon, loading }: StatCardProps) {
  const trendColor =
    trend === 'up'
      ? 'text-emerald-500'
      : trend === 'down'
      ? 'text-red-500'
      : 'text-[var(--text-muted)]';

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  if (loading) {
    return (
      <div
        className="rounded-xl border p-5 animate-pulse space-y-3"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
      >
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 skeleton rounded" />
          <div className="h-8 w-8 skeleton rounded-lg" />
        </div>
        <div className="h-7 w-20 skeleton rounded" />
        <div className="h-3 w-28 skeleton rounded" />
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-3 transition hover:shadow-md"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </p>
        {icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)]"
            style={{ backgroundColor: 'var(--bg-card-hover)' }}
          >
            {icon}
          </div>
        )}
      </div>

      <p className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
        {value ?? <span className="text-sm font-normal text-[var(--text-muted)]">No data</span>}
      </p>

      {trendLabel && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          <TrendIcon className="w-3.5 h-3.5" />
          <span>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
