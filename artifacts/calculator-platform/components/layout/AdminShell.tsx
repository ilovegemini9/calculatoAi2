'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { siteConfig } from '@/config/site';

interface Props {
  children: React.ReactNode;
}

export function AdminShell({ children }: Props) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const navItems = [
    { href: '/admin', label: 'Dashboard Overview', icon: '📊' },
    { href: '/admin/factory', label: 'AI Calculator Factory', icon: '⚡' },
    { href: '/admin/blog', label: 'Editorial Blog Workspace', icon: '✍️' },
    { href: '/admin/seo-finder', label: 'SEO Content & Keyword Finder', icon: '🎯' },
    { href: '/admin/seo', label: 'SEO Audit Hub', icon: '🔍' },
    { href: '/admin/media', label: 'Media Optimization', icon: '🖼️' },
    { href: '/admin/users', label: 'Security & Access Control', icon: '👥' },
    { href: '/admin/settings', label: 'Platform Configuration', icon: '⚙️' },
  ];

  // Derive current breadcrumb label based on route
  const getBreadcrumbs = () => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.map((part, index) => {
      const href = '/' + parts.slice(0, index + 1).join('/');
      const isLast = index === parts.length - 1;
      const formatted = part.charAt(0).toUpperCase() + part.slice(1);
      return { href, label: formatted, isLast };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  if (!mounted) {
    return <div className="min-h-screen bg-[var(--bg-page)]" />;
  }

  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex">
      {/* Background overlay for mobile nav */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Desktop Sidebar */}
      <aside 
        className={`fixed md:sticky top-0 left-0 h-screen w-64 border-r z-50 flex flex-col transition-transform duration-300 md:transform-none ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
      >
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <Link href="/" className="flex items-center gap-2.5 font-black text-lg tracking-tight">
            <span className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-sm font-black shadow-lg text-white">
              ƒ
            </span>
            <div className="flex flex-col">
              <span className="leading-none text-sm font-bold text-[var(--text-primary)]">{siteConfig.name}</span>
              <span className="text-[9px] uppercase font-bold text-blue-500 tracking-wider mt-0.5">Enterprise Console</span>
            </div>
          </Link>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)]"
          >
            ✕
          </button>
        </div>
        
        {/* User Quick Info */}
        <div className="p-4 mx-3 my-4 rounded-xl border flex items-center gap-3 bg-[var(--bg-input)]" style={{ borderColor: 'var(--border)' }}>
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-600/20">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black truncate text-[var(--text-primary)]">Administrator</p>
            <span className="inline-flex items-center gap-1 text-[9px] uppercase font-black text-blue-500 tracking-wider">
              🛡️ Super Admin
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto text-xs font-bold uppercase tracking-wider">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between px-2 text-[10px] uppercase font-bold text-[var(--text-muted)]">
            <span>System Node</span>
            <span className="inline-flex items-center gap-1.5 text-green-500 font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Online
            </span>
          </div>
          <a
            href="/api/admin/logout"
            className="flex items-center justify-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-red-500 hover:bg-red-500/10 rounded-xl transition text-center w-full"
          >
            🚪 Logout session
          </a>
        </div>
      </aside>

      {/* Main content body */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top Navbar */}
        <header 
          className="sticky top-0 h-16 border-b flex items-center justify-between px-4 md:px-8 z-30 transition-all"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
        >
          {/* Left panel: Burger & Breadcrumbs */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)]"
            >
              ☰
            </button>

            {/* Breadcrumb component */}
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold">
              <Link href="/admin" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
                Console
              </Link>
              {breadcrumbs.map((crumb) => (
                <div key={crumb.href} className="flex items-center gap-2">
                  <span className="text-[var(--text-muted)]">/</span>
                  <Link 
                    href={crumb.href} 
                    className={`transition ${crumb.isLast ? 'text-blue-500 font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                  >
                    {crumb.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel: Controls, alerts, search */}
          <div className="flex items-center gap-3">
            {/* Search Launcher */}
            <div className="relative">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all"
                title="Global Search"
              >
                🔍
              </button>
              {searchOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 p-2 rounded-xl border shadow-xl z-50 space-y-2 animate-fade-in"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-[var(--bg-input)] rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                    <span>🔍</span>
                    <input
                      type="text"
                      placeholder="Search calculators, blogs, logs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent text-xs outline-none w-full text-[var(--text-primary)]"
                      autoFocus
                    />
                  </div>
                  {searchQuery && (
                    <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                      <p className="text-[9px] uppercase font-bold text-[var(--text-muted)] mb-1">Found Suggestions</p>
                      <Link 
                        href="/admin/factory" 
                        onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                        className="block text-xs p-1.5 hover:bg-[var(--bg-card-hover)] rounded-lg"
                      >
                        🧮 AI Builder: {searchQuery}
                      </Link>
                      <Link 
                        href="/admin/blog" 
                        onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                        className="block text-xs p-1.5 hover:bg-[var(--bg-card-hover)] rounded-lg"
                      >
                        ✍️ Blog Content: {searchQuery}
                      </Link>
                      <Link 
                        href="/admin/seo" 
                        onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                        className="block text-xs p-1.5 hover:bg-[var(--bg-card-hover)] rounded-lg text-blue-500"
                      >
                        🔍 SEO Health Check
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all"
                title="Quick Actions"
              >
                ⚡
              </button>
              {quickActionsOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 p-2 rounded-xl border shadow-xl z-50 divide-y divide-[var(--border)] animate-fade-in"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  <div className="py-1">
                    <Link 
                      href="/admin/factory" 
                      onClick={() => setQuickActionsOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-[var(--bg-card-hover)] rounded-lg text-[var(--text-primary)]"
                    >
                      🤖 Synthesize with AI
                    </Link>
                    <Link 
                      href="/admin/blog" 
                      onClick={() => setQuickActionsOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-[var(--bg-card-hover)] rounded-lg text-[var(--text-primary)]"
                    >
                      ✍️ Compose Article
                    </Link>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setQuickActionsOpen(false);
                        alert('Local backup database task initialized. Generated data/backup.db.json.');
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-[var(--bg-card-hover)] rounded-lg text-green-500"
                    >
                      🗄️ Backup Database Now
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all relative"
                title="Notifications"
              >
                🔔
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </button>
              {notificationsOpen && (
                <div 
                  className="absolute right-0 mt-2 w-80 p-4 rounded-xl border shadow-xl z-50 space-y-3 animate-fade-in"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center justify-between border-b pb-2 mb-1" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">System Alerts</span>
                    <button 
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[10px] text-blue-500 hover:underline font-bold"
                    >
                      Mark read
                    </button>
                  </div>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-xs font-bold text-[var(--text-primary)]">AI Synthesis Pipeline complete</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Calculations and FAQs synthesized successfully.</p>
                    </div>
                    <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-xs font-bold text-[var(--text-primary)]">Daily Cron Job Completed</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Automated sitemap.xml rebuild succeeded.</p>
                    </div>
                    <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <p className="text-xs font-bold text-[var(--text-primary)]">Rate Limiter Activated</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Blocked multiple scrapers on /api/calculators.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dark/Light mode toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all duration-200"
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-8 h-8 rounded-lg bg-blue-600/10 hover:bg-blue-600/15 text-blue-500 font-black text-xs flex items-center justify-center border"
                style={{ borderColor: 'var(--border)' }}
              >
                ADM
              </button>
              {profileOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 p-2 rounded-xl border shadow-xl z-50 divide-y divide-[var(--border)] animate-fade-in"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                >
                  <div className="px-3 py-2">
                    <p className="text-xs font-black truncate text-[var(--text-primary)]">admin</p>
                    <span className="text-[9px] font-bold text-blue-500">Super Admin</span>
                  </div>
                  <div className="py-1">
                    <Link 
                      href="/admin/settings" 
                      onClick={() => setProfileOpen(false)}
                      className="block text-xs px-3 py-2 hover:bg-[var(--bg-card-hover)] rounded-lg text-[var(--text-primary)]"
                    >
                      ⚙️ Account Settings
                    </Link>
                  </div>
                  <div className="py-1">
                    <a
                      href="/api/admin/logout"
                      className="block text-xs px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                    >
                      🚪 Logout Session
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 md:p-8 overflow-y-auto max-w-6xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
