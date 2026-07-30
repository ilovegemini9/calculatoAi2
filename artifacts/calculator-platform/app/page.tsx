import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { CALCULATORS, CATEGORY_LABELS, CATEGORY_COLORS } from '@/config/calculators';
import { organizationSchema, websiteSchema } from '@/lib/schemas';
import { getDb } from '@/lib/db';
import { getSeoSettings } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const seo = getSeoSettings(getDb().settings.seo);
  return {
    title: seo.metaTitle,
    description: seo.metaDescription,
    keywords: siteConfig.keywords,
    alternates: { canonical: seo.canonicalUrl || '/' },
    openGraph: {
      type: seo.openGraph.type,
      url: seo.canonicalUrl || siteConfig.url,
      title: seo.openGraph.title,
      description: seo.openGraph.description,
      images: [{ url: seo.openGraph.image, width: 1200, height: 630, alt: seo.openGraph.title }],
    },
    twitter: {
      card: seo.twitter.card,
      title: seo.twitter.title,
      description: seo.twitter.description,
      images: [seo.twitter.image],
    },
  };
}

const TRUST_ITEMS = [
  {
    icon: '🔒',
    title: '100% Private',
    desc: 'All calculations happen in your browser. No data is ever sent to a server.',
  },
  {
    icon: '⚡',
    title: 'Instant Results',
    desc: 'Real-time calculations as you type. Zero loading, zero waiting.',
  },
  {
    icon: '✅',
    title: 'Always Free',
    desc: 'No sign-up, no paywall, no hidden fees — ever.',
  },
  {
    icon: '🎯',
    title: 'Verified Accurate',
    desc: 'Formulas verified against IRS, WHO, and academic standards.',
  },
];

export default function HomePage() {
  const categories = ['financial', 'fitness', 'math', 'lifestyle'] as const;

  // Retrieve dynamic calculators and merge
  const db = getDb();
  const dynamicCalcs = db.calculators.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.metadata.description,
    icon: '⚡',
    category: c.category,
  }));

  const allCalculators = [...CALCULATORS, ...dynamicCalcs];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema()) }} />

      {/* ── Hero ── */}
      <section className="hero-gradient text-white relative overflow-hidden">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-blue-200 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6 animate-fade-in">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse-dot" />
            Free · Private · Instant
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-5 animate-fade-up">
            Free Online{' '}
            <span className="text-blue-400">Calculators</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8 animate-fade-up animation-delay-100">
            Fast, accurate, and private. All {allCalculators.length} calculators run entirely in your
            browser — your data never touches our servers.
          </p>

          {/* Quick links */}
          <div className="flex flex-wrap justify-center gap-2 animate-fade-up animation-delay-200">
            {allCalculators.slice(0, 4).map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}-calculator`}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium px-3.5 py-2 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <span className="text-base">{c.icon}</span>
                {c.name}
              </Link>
            ))}
            <Link
              href="#calculators"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-3.5 py-2 rounded-xl transition-all duration-200 hover:scale-105"
            >
              View all →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Calculator grid ── */}
      <section
        id="calculators"
        className="max-w-6xl mx-auto px-4 py-14"
        aria-label="All calculators by category"
      >
        {categories.map((cat, catIdx) => {
          const calcs = allCalculators.filter((c) => c.category === cat);
          if (!calcs.length) return null;
          const colors = CATEGORY_COLORS[cat] || { bg: 'bg-blue-500/10', text: 'text-blue-500' };

          return (
            <div key={cat} className={`mb-12 animate-fade-up animation-delay-${Math.min(catIdx * 100 + 100, 400)}`}>
              <div className="flex items-center gap-3 mb-5">
                <span className={`inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${colors.bg} ${colors.text}`}>
                  {CATEGORY_LABELS[cat] || cat}
                </span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {calcs.map((calc) => (
                  <Link
                    key={calc.slug}
                    href={`/${calc.slug}-calculator`}
                    className="group relative block rounded-2xl border card-lift transition-all duration-200 overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                    aria-label={calc.name}
                  >
                    {/* Hover accent line */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                    <div className="p-5">
                      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200 inline-block">
                        {calc.icon}
                      </div>
                      <h3
                        className="font-bold text-sm mb-1 transition-colors duration-200 group-hover:text-blue-500"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {calc.name}
                      </h3>
                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                        {calc.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                          {CATEGORY_LABELS[cat] || cat}
                        </span>
                        <span className="text-[10px] text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          Open →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Trust strip ── */}
      <section
        className="border-t py-12 px-4"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
        aria-label="Why CalculatorFree"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-xs font-black uppercase tracking-widest mb-8" style={{ color: 'var(--text-muted)' }}>
            Why millions choose {siteConfig.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST_ITEMS.map((item, i) => (
              <div
                key={item.title}
                className={`flex flex-col items-center text-center gap-2 p-5 rounded-2xl border animate-fade-up animation-delay-${i * 100 + 100}`}
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="text-3xl mb-1" aria-hidden="true">{item.icon}</span>
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
