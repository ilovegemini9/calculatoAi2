'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { siteConfig } from '@/config/site';
import { CALCULATORS } from '@/config/calculators';
import { ThemeToggle } from './ThemeToggle';
import { getMenuCalculators, REFERENCE_MENU_GROUPS } from '@/config/menu';

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setBrowseOpen(false);
  }, [pathname]);

  if (pathname?.startsWith('/admin')) return null;

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b transition-all duration-300"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
          boxShadow: scrolled ? 'var(--shadow-hover)' : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4 relative">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-extrabold text-lg tracking-tight hover:opacity-90 transition shrink-0"
          >
            <span className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-sm font-black shadow-sm text-white">
              ƒ
            </span>
            <span>{siteConfig.name}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] ${
                pathname === '/'
                  ? 'bg-[var(--bg-card-hover)] text-[var(--text-primary)] font-bold'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Calculators
            </Link>
            <Link
              href="/about"
              className={`px-3 py-1.5 rounded-lg transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] ${
                pathname === '/about'
                  ? 'bg-[var(--bg-card-hover)] text-[var(--text-primary)] font-bold'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              About
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setBrowseOpen((value) => !value)}
                className={`px-3 py-1.5 rounded-lg transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] ${browseOpen ? 'bg-[var(--bg-card-hover)] text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)]'}`}
                aria-expanded={browseOpen}
                aria-haspopup="true"
              >
                Browse
              </button>
              {browseOpen && (
                <div className="absolute right-0 top-10 z-50 w-[min(90vw,520px)] rounded-2xl border p-3 shadow-2xl grid grid-cols-2 gap-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  {REFERENCE_MENU_GROUPS.map((group) => {
                    const featured = getMenuCalculators(group, CALCULATORS, 3);
                    return <div key={group.id} className="rounded-xl p-2 hover:bg-[var(--bg-card-hover)]">
                      <Link href={`/#menu-${group.id}`} className="block text-sm font-bold text-blue-500 hover:underline">{group.label}</Link>
                      <p className="mt-1 text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{group.description}</p>
                      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
                        {featured.map((calculator) => <Link key={calculator.slug} href={`/${calculator.slug}-calculator`} className="text-[10px] hover:text-blue-500" style={{ color: 'var(--text-secondary)' }}>{calculator.shortName}</Link>)}
                      </div>
                    </div>;
                  })}
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden w-8 h-8 flex flex-col justify-center items-center gap-1.5 rounded-lg transition hover:bg-[var(--bg-card-hover)]"
              style={{ color: 'var(--text-primary)' }}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              <span
                className={`block w-5 h-0.5 bg-current transition-all duration-200 ${
                  menuOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span
                className={`block w-5 h-0.5 bg-current transition-all duration-200 ${
                  menuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block w-5 h-0.5 bg-current transition-all duration-200 ${
                  menuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="md:hidden border-t animate-slide-down"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }}
          >
            <nav className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
              <p className="text-[10px] font-black uppercase tracking-widest px-3 pb-1" style={{ color: 'var(--text-muted)' }}>Navigation</p>
              <Link
                href="/"
                className="px-3 py-2.5 rounded-lg text-sm font-medium transition hover:bg-[var(--bg-card-hover)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Home
              </Link>
              <Link
                href="/about"
                className="px-3 py-2.5 rounded-lg text-sm font-medium transition hover:bg-[var(--bg-card-hover)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                About
              </Link>

              <p className="text-[10px] font-black uppercase tracking-widest px-3 pb-1 pt-3" style={{ color: 'var(--text-muted)' }}>Browse by category</p>
              <div className="grid grid-cols-2 gap-1">
                {REFERENCE_MENU_GROUPS.map((group) => <Link key={group.id} href={`/#menu-${group.id}`} className="px-3 py-2 rounded-lg text-sm transition hover:bg-[var(--bg-card-hover)]" style={{ color: 'var(--text-secondary)' }}>{group.label}</Link>)}
              </div>

              <p className="text-[10px] font-black uppercase tracking-widest px-3 pb-1 pt-3" style={{ color: 'var(--text-muted)' }}>Calculators</p>
              <div className="grid grid-cols-2 gap-1">
                {CALCULATORS.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${c.slug}-calculator`}
                    className="px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 hover:bg-[var(--bg-card-hover)]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span className="text-base">{c.icon}</span>
                    <span className="truncate">{c.name}</span>
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
