import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { CALCULATORS, CATEGORY_LABELS, type CalculatorMeta } from '@/config/calculators';
import { organizationSchema, websiteSchema } from '@/lib/schemas';
import { getDb } from '@/lib/db';
import { getSeoSettings } from '@/lib/seo';
import { KEYWORD_CLUSTERS } from '@/config/keyword-clusters';
import { getMenuCalculators, REFERENCE_MENU_GROUPS } from '@/config/menu';
import { getAllOmniCalculators } from '@/lib/omni-catalog-full';
import { OmniCatalogExplorer } from '@/components/calculators/OmniCatalogExplorer';

export async function generateMetadata(): Promise<Metadata> {
  const seo = getSeoSettings((await getDb()).settings.seo);
  return { title: seo.metaTitle, description: seo.metaDescription, keywords: siteConfig.keywords, alternates: { canonical: seo.canonicalUrl || '/' }, openGraph: { type: seo.openGraph.type, url: seo.canonicalUrl || siteConfig.url, title: seo.openGraph.title, description: seo.openGraph.description, images: [{ url: seo.openGraph.image, width: 1200, height: 630, alt: seo.openGraph.title }] }, twitter: { card: seo.twitter.card, title: seo.twitter.title, description: seo.twitter.description, images: [seo.twitter.image] } };
}

const TRUST_ITEMS = [
  { icon: '🔒', title: 'Privacy-first', desc: 'Supported client-side calculators process inputs in your browser instead of requiring an account.' },
  { icon: '⚡', title: 'Instant results', desc: 'Change an input and see the calculation update without a signup or page reload.' },
  { icon: '🧮', title: 'Real calculation logic', desc: 'Published tools are connected to calculation logic, not just calculator names or empty metadata pages.' },
  { icon: '📚', title: 'Clear methods', desc: 'Calculator pages explain inputs, formulas, examples, assumptions, and related tools where available.' },
];
const CATEGORY_ORDER = ['financial', 'math', 'fitness', 'lifestyle'] as const;

export default async function HomePage() {
  const db = await getDb();
  const dynamicCalcs: CalculatorMeta[] = db.calculators.map((c) => ({ slug: c.slug, name: c.name, shortName: c.name.replace(/\s*Calculator\s*/i, ''), description: c.metadata.description, keywords: c.metadata.keywords, icon: '⚡', category: c.category as CalculatorMeta['category'] }));
  const allCalculators = [...CALCULATORS, ...dynamicCalcs];
  const publishedCalculators = getAllOmniCalculators();
  const publishedCount = publishedCalculators.length;
  const categoryCounts = Object.fromEntries(CATEGORY_ORDER.map((category) => [category, publishedCalculators.filter((calculator) => calculator.category === category).length]));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema()) }} />
      <section className="hero-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)', backgroundSize: '40px 40px' }} aria-hidden="true" />
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-blue-200 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />{publishedCount.toLocaleString()} free calculators · instant results</div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-5">Free Online <span className="text-blue-400">Calculators</span></h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">Free calculators for math, finance, health, and everyday decisions — with instant results, clear formulas, worked examples, and practical explanations.</p>
          <div className="flex flex-wrap justify-center gap-2">{allCalculators.slice(0, 5).map((c) => <Link key={c.slug} href={`/${c.slug}-calculator`} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium px-3.5 py-2 rounded-xl transition-all"><span className="text-base">{c.icon}</span>{c.name}</Link>)}<Link href="#calculators" className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-3.5 py-2 rounded-xl transition-all">Explore calculators →</Link></div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-14" aria-labelledby="categories-heading">
        <div className="mb-8"><span className="text-xs font-black uppercase tracking-widest text-blue-500">Browse by topic</span><h2 id="categories-heading" className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1" style={{ color: 'var(--text-primary)' }}>Calculator categories</h2><p className="text-sm mt-2 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>Start with a topic to find related tools, then move between calculators through contextual links.</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{CATEGORY_ORDER.map((category) => <Link key={category} href={`/category/${category}`} className="rounded-2xl border p-5 hover:border-blue-500/50 transition-colors" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}><h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{CATEGORY_LABELS[category]}</h3><p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{categoryCounts[category]} published tools</p><span className="inline-block mt-4 text-xs font-bold text-blue-500">Browse {CATEGORY_LABELS[category]} →</span></Link>)}</div>
      </section>

      <section id="calculators" className="max-w-6xl mx-auto px-4 pb-14" aria-label="Published calculator catalog">
        <div className="mb-10 text-center sm:text-left"><span className="text-xs font-black uppercase tracking-widest text-blue-500">Complete catalog</span><h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1" style={{ color: 'var(--text-primary)' }}>Explore published calculators</h2><p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Search and browse the calculators that are currently part of the public working catalog.</p></div>
        <OmniCatalogExplorer calculators={publishedCalculators} />
      </section>

      <section className="border-t py-14 px-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-page)' }} aria-labelledby="menu-map-heading">
        <div className="max-w-6xl mx-auto"><div className="mb-7"><p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Calculator menu</p><h2 id="menu-map-heading" className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Browse calculators by topic</h2><p className="text-sm mt-2 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>Use the editorial menu to move from a question to a relevant calculator.</p></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">{REFERENCE_MENU_GROUPS.map((group) => { const entries = getMenuCalculators(group, allCalculators, 4); return <div key={group.id} id={`menu-${group.id}`} className="rounded-2xl border p-4 scroll-mt-20" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}><h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{group.label}</h3><p className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>{group.description}</p><ul className="space-y-1.5">{entries.map((calculator) => <li key={calculator.slug}><Link href={`/${calculator.slug}-calculator`} className="text-xs text-blue-500 hover:underline">{calculator.name}</Link></li>)}</ul><Link href="/sitemap" className="inline-block mt-3 text-[10px] font-bold text-blue-500 hover:underline">See full directory →</Link></div>; })}</div></div>
      </section>

      <section className="border-t py-14 px-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-page)' }} aria-labelledby="topic-clusters-heading">
        <div className="max-w-5xl mx-auto"><div className="mb-7"><p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Browse by intent</p><h2 id="topic-clusters-heading" className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Find the right calculator for your question</h2></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{KEYWORD_CLUSTERS.map((cluster) => { const featured = cluster.routes.find((slug) => CALCULATORS.some((calc) => calc.slug === slug)); return <div key={cluster.id} className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}><h3 className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>{cluster.label}</h3><p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{cluster.description}</p><div className="flex flex-wrap gap-2">{cluster.keywords.slice(0, 4).map((keyword) => <span key={keyword} className="rounded-full px-2.5 py-1 text-[11px]" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}>{keyword}</span>)}</div>{featured && <Link href={`/${featured}-calculator`} className="inline-block mt-4 text-xs font-bold text-blue-500 hover:underline">Explore {CALCULATORS.find((calc) => calc.slug === featured)?.shortName} →</Link>}</div>; })}</div></div>
      </section>

      <section className="border-t py-14 px-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }} aria-labelledby="methodology-heading">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Built for useful answers</p>
          <h2 id="methodology-heading" className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>More than a number</h2>
          <p className="max-w-3xl mx-auto mt-3 text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>A useful calculator should do more than return a result. Where supported, our calculator pages explain what the inputs mean, show the formula or method, include a worked example, and link to related tools so you can understand and act on the result.</p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link href="/methodology" className="rounded-xl border px-4 py-2.5 text-sm font-bold hover:border-blue-500/50" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>How our calculators are built →</Link>
            <Link href="/about" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500">About CalculatorFree →</Link>
          </div>
        </div>
      </section>

      <section className="border-t py-12 px-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }} aria-label={`Why use ${siteConfig.name}`}><div className="max-w-5xl mx-auto"><h2 className="text-center text-xs font-black uppercase tracking-widest mb-8" style={{ color: 'var(--text-muted)' }}>Why use {siteConfig.name}</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{TRUST_ITEMS.map((item) => <div key={item.title} className="flex flex-col items-center text-center gap-2 p-5 rounded-2xl border" style={{ borderColor: 'var(--border)' }}><span className="text-3xl mb-1" aria-hidden="true">{item.icon}</span><h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{item.title}</h3><p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.desc}</p></div>)}</div></div></section>
    </>
  );
}
