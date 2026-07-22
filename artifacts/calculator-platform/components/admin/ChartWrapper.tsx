'use client';

import { ReactNode } from 'react';
import { BarChart3 } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface ChartWrapperProps {
  title: string;
  description?: string;
  hasData: boolean;
  height?: number;
  children?: ReactNode;
  action?: ReactNode;
}

export function ChartWrapper({
  title,
  description,
  hasData,
  height = 280,
  children,
  action,
}: ChartWrapperProps) {
  return (
    <div
      className="rounded-xl border"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
    >
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
          {description && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      <div style={{ minHeight: height }}>
        {hasData ? (
          <div className="p-5" style={{ height }}>
            {children}
          </div>
        ) : (
          <EmptyState
            icon={<BarChart3 className="w-6 h-6" />}
            title="No data available"
            description="Chart data will appear here once activity is recorded."
          />
        )}
      </div>
    </div>
  );
}
