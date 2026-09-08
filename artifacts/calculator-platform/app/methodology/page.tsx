import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { breadcrumbSchema } from '@/lib/schemas';

export const metadata: Metadata = {
  title: `Calculator Methodology | ${siteConfig.name}`,
  description: 'How CalculatorFree builds, tests, documents, and presents online calculators, including formulas, inputs, examples, assumptions, and privacy considerations.',
  alternates: { canonical: `${siteConfig.url}/methodology` },
  robots: { index: true, follow: true },
};

export default function MethodologyPage() {
  const url = `${siteConfig.url}/methodology`;
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([{ name: 'Home', url: siteConfig.url }, { name: 'Methodology', url }])) }} />
      <nav aria-label="Breadcrumb" className="text-xs mb-8" style={{ color: 'var(--text-muted)' }}><Link href="/" className="hover:text-blue-500">Home</Link><span className="mx-2">/</span><span style={{ color: 'var(--text-primary)' }}>Methodology</span></nav>
      <header className="mb-10"><p className="text-xs font-black uppercase tracking-widest text-blue-500 mb-2">How we build calculators</p><h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Calculator methodology</h1><p className="mt-4 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Our goal is simple: a calculator should produce a useful result and make it possible to understand what that result means.</p></header>

      <div className="space-y-8">
        <section><h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>1. Define the calculation</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Each calculator starts with a defined calculation problem: the inputs it accepts, the output it produces, the units involved, and the assumptions that affect the result. The implementation is kept separate from the presentation so the calculation logic can be tested independently.</p></section>
        <section><h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>2. Validate inputs and edge cases</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Inputs are validated according to the needs of the calculation. Where relevant, the implementation handles zero values, negative values, empty inputs, invalid ranges, unit conversions, rounding, and other boundary conditions instead of silently returning a meaningless number.</p></section>
        <section><h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>3. Explain the method</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Where the calculator supports it, the page shows the formula or method, defines important variables, provides a worked example, and explains how to interpret the result. This is intended to help users check the calculation rather than treating the output as a black box.</p></section>
        <section><h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>4. Keep related questions connected</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Calculators are organized into categories and related-tool links so a user can move from one step of a problem to the next. For example, a financial question may require a payment estimate, an affordability estimate, and an amortization view rather than one isolated number.</p></section>
        <section><h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>5. Be clear about estimates and assumptions</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Some calculations are inherently estimates. Health, finance, taxes, and other real-world topics can depend on information that a general calculator cannot know. Calculator pages should therefore make material assumptions visible and avoid presenting estimates as personalized professional advice.</p></section>
        <section><h2 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>6. Privacy by design where supported</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Client-side calculators can process inputs in the browser without sending those calculation inputs to a server. This is a property of supported client-side tools, not a blanket claim that every feature of the website is server-free.</p></section>
      </div>

      <section className="mt-12 rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}><h2 className="text-lg font-extrabold" style={{ color: 'var(--text-primary)' }}>See the calculators</h2><p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Use the category hubs to find a calculator and review the method, examples, and related tools available on that page.</p><div className="flex flex-wrap gap-2 mt-4"><Link href="/category/financial" className="text-sm font-bold text-blue-500 hover:underline">Financial →</Link><Link href="/category/math" className="text-sm font-bold text-blue-500 hover:underline">Math →</Link><Link href="/category/fitness" className="text-sm font-bold text-blue-500 hover:underline">Health & fitness →</Link><Link href="/category/lifestyle" className="text-sm font-bold text-blue-500 hover:underline">Everyday →</Link></div></section>
    </main>
  );
}
