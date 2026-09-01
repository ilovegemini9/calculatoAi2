import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { CATEGORY_LABELS, CATEGORY_COLORS, type CalculatorMeta } from '@/config/calculators';
import { organizationSchema, websiteSchema } from '@/lib/schemas';
import { getSeoSettings } from '@/lib/seo';
import { KEYWORD_CLUSTERS } from '@/config/keyword-clusters';
import { getMenuCalculators, REFERENCE_MENU_GROUPS } from '@/config/menu';
import * as fs from 'fs';
import * as path from 'path';

// قراءة جميع الحاسبات من ملف JSON مباشرة لضمان وجودها
function getAllCalculators(): CalculatorMeta[] {
  try {
    const dbPath = path.join(process.cwd(), 'config', 'omni-full-database.json');
    if (!fs.existsSync(dbPath)) {
      console.warn('Database file not found at:', dbPath);
      return [];
    }
    const rawData = fs.readFileSync(dbPath, 'utf-8');
    const data = JSON.parse(rawData);
    
    // تحويل البيانات إلى الصيغة المطلوبة
    return data.map((item: any) => ({
      slug: item.slug || item.id || '',
      name: item.name || item.title || 'Unknown Calculator',
      shortName: (item.name || item.title || '').replace(/\s*Calculator\s*/i, ''),
      description: item.description || item.metadata?.description || 'Online calculator tool',
      keywords: item.keywords || item.metadata?.keywords || [],
      icon: item.icon || '🧮',
      category: mapCategory(item.category || item.metadata?.category || 'other'),
    })).filter((c: any) => c.slug && c.slug !== 'undefined');
  } catch (error) {
    console.error('Error loading calculators:', error);
    return [];
  }
}

// توحيد أسماء التصنيفات
function mapCategory(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes('financ') || c.includes('money') || c.includes('loan') || c.includes('mortgage') || c.includes('tax')) return 'financial';
  if (c.includes('health') || c.includes('fitness') || c.includes('medical') || c.includes('body')) return 'fitness';
  if (c.includes('math') || c.includes('algebra') || c.includes('geometry') || c.includes('stat')) return 'math';
  if (c.includes('physic') || c.includes('science')) return 'math'; // نضعها في math مؤقتاً
  if (c.includes('life') || c.includes('time') || c.includes('date') || c.includes('age')) return 'lifestyle';
  if (c.includes('construct') || c.includes('build')) return 'construction';
  if (c.includes('food') || c.includes('cook') || c.includes('recipe')) return 'food';
  return 'other';
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = getSeoSettings((await getDb()).settings.seo);
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
    icon: '📚',
    title: 'Transparent Methods',
    desc: 'Formula explanations, worked examples, and source links are shown on calculator pages.',
  },
];

export default async function HomePage() {
  // استخدام الدالة الجديدة لجلب جميع الحاسبات من الملف
  const allCalculators = getAllCalculators();
  
  // فلترة التصنيفات الرئيسية اللي عندنا بيانات فيها
  const categories = ['financial', 'fitness', 'math', 'lifestyle', 'construction', 'food', 'other'] as const;

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

      {/* ── Reference-style menu map ── */}
      <section
        className="border-t py-14 px-4"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-page)' }}
        aria-labelledby="menu-map-heading"
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-7">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Calculator menu</p>
            <h2 id="menu-map-heading" className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
              Browse calculators by topic
            </h2>
            <p className="text-sm mt-2 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
              Use the editorial menu to move from a question to a relevant calculator. Some tools appear in more than one topic when the intent genuinely overlaps.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {REFERENCE_MENU_GROUPS.map((group) => {
              const entries = getMenuCalculators(group, allCalculators, 4);
              return <div key={group.id} id={`menu-${group.id}`} className="rounded-2xl border p-4 scroll-mt-20" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{group.label}</h3>
                <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>{group.description}</p>
                <ul className="space-y-1.5">
                  {entries.map((calculator) => <li key={calculator.slug}><Link href={`/${calculator.slug}-calculator`} className="text-xs text-blue-500 hover:underline">{calculator.name}</Link></li>)}
                </ul>
                <Link href="/sitemap" className="inline-block mt-3 text-[10px] font-bold text-blue-500 hover:underline">See full directory →</Link>
              </div>;
            })}
          </div>
        </div>
      </section>

      {/* ── Topic clusters ── */}
      <section
        className="border-t py-14 px-4"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-page)' }}
        aria-labelledby="topic-clusters-heading"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between gap-4 mb-7">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Browse by intent</p>
              <h2 id="topic-clusters-heading" className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                Find the right calculator for your question
              </h2>
            </div>
            <Link href="/sitemap" className="hidden sm:inline text-sm font-semibold text-blue-500 hover:underline">
              View directory →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {KEYWORD_CLUSTERS.map((cluster) => {
              const featured = cluster.routes.find((slug) => CALCULATORS.some((calc) => calc.slug === slug));
              return (
                <div key={cluster.id} className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>{cluster.label}</h3>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{cluster.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {cluster.keywords.slice(0, 4).map((keyword) => (
                      <span key={keyword} className="rounded-full px-2.5 py-1 text-[11px]" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                        {keyword}
                      </span>
                    ))}
                  </div>
                  {featured && (
                    <Link href={`/${featured}-calculator`} className="inline-block mt-4 text-xs font-bold text-blue-500 hover:underline">
                      Explore {CALCULATORS.find((calc) => calc.slug === featured)?.shortName} →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section
        className="border-t py-12 px-4"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
        aria-label="Why CalculatorFree"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-xs font-black uppercase tracking-widest mb-8" style={{ color: 'var(--text-muted)' }}>
            Why use {siteConfig.name}
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
