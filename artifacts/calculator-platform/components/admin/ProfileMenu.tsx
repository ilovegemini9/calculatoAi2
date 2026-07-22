'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, Settings, User } from 'lucide-react';

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Profile menu"
        className="w-8 h-8 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border flex items-center justify-center transition"
        style={{ borderColor: 'var(--border)' }}
      >
        <User className="w-4 h-4 text-blue-500" />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-xl border shadow-xl z-50 overflow-hidden animate-slide-down"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <p className="text-xs font-semibold text-[var(--text-primary)]">Administrator</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Super Admin</p>
          </div>

          <div className="py-1">
            <Link
              href="/admin/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
            >
              <Settings className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              Settings
            </Link>
          </div>

          <div className="py-1 border-t" style={{ borderColor: 'var(--border)' }}>
            <Link
              href="/api/admin/logout"
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-red-500 hover:bg-red-500/10 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
