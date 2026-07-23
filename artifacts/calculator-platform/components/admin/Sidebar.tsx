'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Calculator,
  Search,
  BarChart3,
  Megaphone,
  ShieldCheck,
  Users,
  ScrollText,
  Settings,
  Bot,
  X,
  LogOut,
} from 'lucide-react';
import { siteConfig } from '@/config/site';

const NAV_ITEMS = [
  { href: '/admin/dashboard',     label: 'Dashboard',           icon: LayoutDashboard },
  { href: '/admin/articles',      label: 'AI Articles',         icon: FileText },
  { href: '/admin/calculators',   label: 'AI Calculators',      icon: Calculator },
  { href: '/admin/seo',           label: 'SEO Center',          icon: Search },
  { href: '/admin/analytics',     label: 'Analytics',           icon: BarChart3 },
  { href: '/admin/ads',           label: 'Ads Manager',         icon: Megaphone },
  { href: '/admin/verifications', label: 'Verification Center', icon: ShieldCheck },
  { href: '/admin/users',         label: 'Users',               icon: Users },
  { href: '/admin/logs',          label: 'Logs',                icon: ScrollText },
  { href: '/admin/settings',      label: 'Settings',            icon: Settings },
  { href: '/admin/settings/ai',   label: 'AI Settings',         icon: Bot },
] as const;

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen w-60 border-r z-50
          flex flex-col transition-transform duration-300 md:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
        aria-label="Admin navigation"
      >
        {/* Logo */}
        <div
          className="h-14 px-4 flex items-center justify-between border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <Link href="/" className="flex items-center gap-2.5 font-bold text-sm tracking-tight">
            <span className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-black shadow">
              ƒ
            </span>
            <span className="text-[var(--text-primary)]">{siteConfig.name}</span>
          </Link>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5" aria-label="Main navigation">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
                  }
                `}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
          <Link
            href="/api/admin/logout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign out
          </Link>
        </div>
      </aside>
    </>
  );
}
