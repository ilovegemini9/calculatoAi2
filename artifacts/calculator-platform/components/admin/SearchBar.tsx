'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';

const QUICK_LINKS = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'AI Articles', href: '/admin/articles' },
  { label: 'AI Calculators', href: '/admin/calculators' },
  { label: 'SEO Center', href: '/admin/seo' },
  { label: 'Analytics', href: '/admin/analytics' },
  { label: 'Ads Manager', href: '/admin/ads' },
  { label: 'Verification Center', href: '/admin/verifications' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Logs', href: '/admin/logs' },
  { label: 'Settings', href: '/admin/settings' },
];

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = QUICK_LINKS.filter((l) =>
    l.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); setQuery(''); }
    }
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setQuery('');
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open search"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
      >
        <Search className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-72 rounded-xl border shadow-xl z-50 overflow-hidden animate-slide-down"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2.5 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages…"
              className="flex-1 bg-transparent text-xs outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="py-1.5 max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-xs text-[var(--text-muted)]">No results found.</p>
            ) : (
              filtered.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => { setOpen(false); setQuery(''); }}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
                >
                  {link.label}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
