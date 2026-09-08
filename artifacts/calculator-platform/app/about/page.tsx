import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { breadcrumbSchema, organizationSchema } from '@/lib/schemas';

export const metadata: Metadata = {
  title: `About ${siteConfig.name}`,
  description: 'Learn what CalculatorFree is, how its calculator library is organized, and how the site aims to make everyday calculations clearer and easier to check.',
  alternates: { canonical: `${siteConfig.url}/about` },
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  const url = `${siteConfig.url}/about`;
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([{ name: 'Home', url: siteConfig.url }, { name: 'About', url }])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }} />
      <nav aria-label="Breadcrumb" className="text-xs mb-8" style={{ color: 'var(--text-muted)' }}><Link href="/" className="hover:text-blue-500">Home</Link><span className="mx-2">/</span><span style={{ color: 'var(--text-primary)' }}>About</span></nav>
      <header className="mb-10"><p className="text-xs font-black uppercase tracking-widest text-blue-500 mb-2">About the site</p><h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>About {siteConfig.name}</h1><p className="mt-4 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>CalculatorFree is a library of free online calculators for math, finance, health and fitness, and everyday decisions. The site is designed around a practical principle: give people a calculation they can use, while making the method easier to understand and check.</p></header>
      <div className="space-y-8">
        <section><h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Useful tools, not empty pages</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>The public calculator catalog is intended for working tools. A calculator page should provide an actual calculation experience and, where supported, useful context such as formulas, examples, assumptions, and related calculators.</p></section>
        <section><h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Organized around real questions</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>The library is grouped by topic and connected with category hubs and related-tool links. This helps visitors start with a broad question such as mortgage costs, percentages, body metrics, dates, or conversions and reach the specific calculation they need.</p></section>
        <section><h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Transparent about limitations</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>A calculator is an aid, not a guarantee. Results can depend on the quality of the inputs, rounding, assumptions, and the context of the question. Financial and health estimates in particular should not be treated as individualized professional advice.</p></section>
        <section><h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>How calculators are built</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Read the <Link href="/methodology" className="text-blue-500 font-bold hover:underline">calculator methodology</Link> for the principles used to define calculations, validate inputs, explain methods, connect related questions, and describe privacy characteristics accurately.</p></section>
      </div>
    </main>
  );
}
