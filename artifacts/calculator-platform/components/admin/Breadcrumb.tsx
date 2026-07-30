'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  articles: 'AI Articles',
  calculators: 'AI Calculators',
  seo: 'SEO Center',
  analytics: 'Analytics',
  ads: 'Ads Manager',
  verifications: 'Verification Center',
  users: 'Users',
  logs: 'Logs',
  settings: 'Settings',
};

function label(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 text-xs">
      <Link
        href="/admin/dashboard"
        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition p-1 rounded"
        aria-label="Admin home"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {segments.map((seg, idx) => {
        const href = '/' + segments.slice(0, idx + 1).join('/');
        const isLast = idx === segments.length - 1;
        return (
          <span key={href} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-[var(--text-muted)]" />
            {isLast ? (
              <span className="font-semibold text-[var(--text-primary)]" aria-current="page">
                {label(seg)}
              </span>
            ) : (
              <Link
                href={href}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
              >
                {label(seg)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
