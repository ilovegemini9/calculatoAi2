'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/config/site';
import { CALCULATORS } from '@/config/calculators';

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer className="mt-16 border-t" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-extrabold text-base mb-3" style={{ color: 'var(--text-primary)' }}>
              <span className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-sm font-black shadow-sm text-white">
                ƒ
              </span>
              <span>{siteConfig.name}</span>
            </Link>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
              Free online calculators for everyday decisions. Fast, private, and always accurate.
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse-dot" />
                100% Private
              </span>
            </div>
          </div>

          {/* Calculators */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-primary)' }}>Calculators</h3>
            <ul className="space-y-2 text-sm">
              {CALCULATORS.slice(0, 4).map((c) => (
                <li key={c.slug}>
                  <Link href={`/calculator/${c.slug}`} className="transition-colors flex items-center gap-1.5 hover:text-blue-500" style={{ color: 'var(--text-secondary)' }}>
                    <span className="text-xs">{c.icon}</span>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-primary)' }}>More</h3>
            <ul className="space-y-2 text-sm">
              {CALCULATORS.slice(4).map((c) => (
                <li key={c.slug}>
                  <Link href={`/calculator/${c.slug}`} className="transition-colors flex items-center gap-1.5 hover:text-blue-500" style={{ color: 'var(--text-secondary)' }}>
                    <span className="text-xs">{c.icon}</span>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-primary)' }}>Company</h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/about',   label: 'About' },
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms',   label: 'Terms of Service' },
                { href: '/contact', label: 'Contact' },
                { href: '/sitemap', label: 'Sitemap' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="transition-colors hover:text-blue-500" style={{ color: 'var(--text-secondary)' }}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/rss.xml" className="hover:text-blue-500 transition-colors">RSS</Link>
            <Link href="/sitemap.xml" className="hover:text-blue-500 transition-colors">XML Sitemap</Link>
            <span>All calculations are client-side. Your data stays private.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
