import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { CALCULATORS, CATEGORY_LABELS, CATEGORY_COLORS } from '@/config/calculators';

export const metadata: Metadata = {
  title: 'Sitemap',
  description: `Full list of all free online calculators on ${siteConfig.name}.`,
  alternates: { canonical: '/sitemap' },
  robots: { index: true, follow: true },
};

const staticPages = [
  { href: '/', label: 'Home', desc: 'Browse all free online calculators' },
  { href: '/about', label: 'About', desc: `Learn about ${siteConfig.name}` },
  { href: '/privacy', label: 'Privacy Policy', desc: 'How we handle your data' },
  { href: '/terms', label: 'Terms of Service', desc: 'Usage terms and conditions' },
  { href: '/contact', label: 'Contact', desc: 'Get in touch with us' },
];

export default function SitemapPage() {
  const categories = ['financial', 'fitness', 'math', 'lifestyle'] as const;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>HTML Sitemap</h1>
      <p className="mb-10 text-sm" style={{ color: 'var(--text-secondary)' }}>
        A complete directory of all pages on {siteConfig.name}.
      </p>

      {/* Static pages */}
      <section className="mb-10">
        <h2 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Pages</h2>
        <ul className="space-y-2">
          {staticPages.map((p) => (
            <li key={p.href} className="flex items-start gap-3">
              <span className="text-blue-500 mt-0.5">→</span>
              <div>
                <Link href={p.href} className="font-semibold text-blue-500 hover:underline">{p.label}</Link>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Calculators by category */}
      {categories.map((cat) => {
        const calcs = CALCULATORS.filter((c) => c.category === cat);
        if (!calcs.length) return null;
        const colors = CATEGORY_COLORS[cat];
        return (
          <section key={cat} className="mb-10">
            <h2 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
              {CATEGORY_LABELS[cat]} Calculators
            </h2>
            <ul className="space-y-2">
              {calcs.map((calc) => (
                <li key={calc.slug} className="flex items-start gap-3">
                  <span className="text-lg leading-tight">{calc.icon}</span>
                  <div>
                    <Link
                      href={`/calculator/${calc.slug}`}
                      className="font-semibold text-blue-500 hover:underline"
                    >
                      {calc.name}
                    </Link>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{calc.description}</p>
                    <span className={`inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded mt-0.5 ${colors.bg} ${colors.text}`}>
                      {CATEGORY_LABELS[cat]}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {/* Feeds */}
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Feeds</h2>
        <ul className="space-y-2">
          <li className="flex items-start gap-3">
            <span className="text-orange-500 mt-0.5">→</span>
            <div>
              <Link href="/rss.xml" className="font-semibold text-blue-500 hover:underline">RSS Feed</Link>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Subscribe to updates in your RSS reader</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-purple-500 mt-0.5">→</span>
            <div>
              <Link href="/llms.txt" className="font-semibold text-blue-500 hover:underline">llms.txt</Link>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI-friendly site overview for LLM crawlers</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-slate-400 mt-0.5">→</span>
            <div>
              <Link href="/sitemap.xml" className="font-semibold text-blue-500 hover:underline">XML Sitemap</Link>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Machine-readable sitemap for search engines</p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  );
}
