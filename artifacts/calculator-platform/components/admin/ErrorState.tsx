'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading this data.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">{title}</p>
      <p className="text-xs text-[var(--text-muted)] max-w-xs">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-card-hover)] hover:bg-[var(--border)] text-[var(--text-primary)] transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try again
        </button>
      )}
    </div>
  );
}
