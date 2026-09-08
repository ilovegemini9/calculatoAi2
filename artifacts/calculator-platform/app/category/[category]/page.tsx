import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATEGORY_LABELS, CATEGORY_COLORS, type CalculatorMeta } from '@/config/calculators';
import { getAllOmniCalculators } from '@/lib/omni-catalog-full';
import { siteConfig } from '@/config/site';
import { breadcrumbSchema, itemListSchema } from '@/lib/schemas';

interface Props { params: Promise<{ category: string }> }

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  financial: 'Free financial calculators for loans, mortgages, income, debt, investing, and everyday money decisions.',
  fitness: 'Free health and fitness calculators for practical estimates, body metrics, exercise, and wellness planning.',
  math: 'Free math calculators for arithmetic, algebra, geometry, statistics, probability, and everyday calculations.',
  lifestyle: 'Free everyday calculators for dates, time, conversions, planning, and practical life calculations.',
};

const CATEGORY_GUIDES: Record<string, { heading: string; body: string; tips: string[] }> = {
  financial: { heading: 'Choose a financial calculator by the question you need to answer', body: 'Financial calculations often depend on several inputs and assumptions. Start with the calculator that matches your decision, check the inputs carefully, and use the result as an estimate rather than a substitute for personalized financial advice.', tips: ['Check the interest rate, term, payment frequency, and starting balance when they apply.', 'Compare scenarios by changing one important input at a time.', 'Review the formula, assumptions, and examples on the calculator page before relying on a result.'] },
  fitness: { heading: 'Use health and fitness calculators as practical estimates', body: 'Health and fitness calculators can help with common measurements and planning, but individual results vary. Pay attention to the units, assumptions, and interpretation provided with each tool.', tips: ['Use the correct units and measurements for the calculator.', 'Treat estimates as a starting point, especially for calorie and exercise planning.', 'For medical decisions, use qualified professional guidance alongside any calculator estimate.'] },
  math: { heading: 'Solve the calculation, then understand the method', body: 'Math calculators are most useful when the result is accompanied by the steps or formula behind it. Use the inputs and examples on each page to check your work and understand how the result was obtained.', tips: ['Enter values exactly as intended, including negative signs and fractions.', 'Check units and rounding when a problem involves measurements.', 'Use worked examples and formula explanations to verify the result.'] },
  lifestyle: { heading: 'Turn everyday questions into clear calculations', body: 'Everyday calculators help with dates, time, conversions, planning, and other practical decisions. Select the tool that matches your question and confirm the units or date conventions before using the result.', tips: ['Double-check units when converting measurements or costs.', 'For dates and time, confirm the start date, end date, and timezone assumptions when relevant.', 'Use related calculators when your question involves more than one step.'] },
};

const CATEGORY_ICONS: Record<string, string> = { financial: '💰', fitness: '❤️', math: '🧮', lifestyle: '🧭' };

export function generateStaticParams() {
  return Object.keys(CATEGORY_LABELS).map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const label = CATEGORY_LABELS[category];
  if (!label) return {};
  const description = CATEGORY_DESCRIPTIONS[category] ?? `Browse ${label.toLowerCase()} calculators.`;
  const url = `${siteConfig.url}/category/${category}`;
  return { title: `${label} Calculators — Free Online Tools`, description, alternates: { canonical: url }, openGraph: { title: `${label} Calculators | ${siteConfig.name}`, description, url, type: 'website' }, robots: { index: true, follow: true } };
}

export default async function CalculatorCategoryPage({ params }: Props) {
  const { category } = await params;
  const label = CATEGORY_LABELS[category];
  if (!label) notFound();

  const calculators = getAllOmniCalculators().filter((calculator) => calculator.category === category).map((calculator) => ({ slug: calculator.slug, name: calculator.name, shortName: calculator.shortName, category: category as CalculatorMeta['category'], description: calculator.description, keywords: calculator.keywords, icon: calculator.icon }));
  const url = `${siteConfig.url}/category/${category}`;
  const schema = itemListSchema(calculators.slice(0, 100).map((calculator) => ({ name: calculator.name, slug: calculator.slug, description: calculator.description })), `${label} Calculators`);
  const breadcrumbs = breadcrumbSchema([{ name: 'Home', url: siteConfig.url }, { name: label, url }]);
  const colors = CATEGORY_COLORS[category] || { bg: 'bg-blue-500/10', text: 'text-blue-500' };
  const guide = CATEGORY_GUIDES[category];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />}
      <main>
        <section className="border-b" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="max-w-6xl mx-auto px-4 py-10">
            <nav aria-label="Breadcrumb" className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}><Link href="/" className="hover:text-blue-500">Home</Link><span className="mx-2">/</span><span style={{ color: 'var(--text-primary)' }}>{label}</span></nav>
            <div className="flex items-start gap-4"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${colors.bg}`}>{CATEGORY_ICONS[category] ?? '🧮'}</div><div><p className={`text-[10px] font-black uppercase tracking-widest ${colors.text}`}>Calculator category</p><h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1" style={{ color: 'var(--text-primary)' }}>{label} Calculators</h1><p className="max-w-3xl mt-3 text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{CATEGORY_DESCRIPTIONS[category]}</p><p className="mt-2 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{calculators.length} published calculators in this category.</p></div></div>
          </div>
        </section>

        {guide && <section className="max-w-5xl mx-auto px-4 py-10" aria-labelledby="category-guide-heading"><div className="rounded-2xl border p-6 sm:p-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}><h2 id="category-guide-heading" className="text-xl sm:text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{guide.heading}</h2><p className="mt-3 text-sm leading-relaxed max-w-4xl" style={{ color: 'var(--text-secondary)' }}>{guide.body}</p><ul className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">{guide.tips.map((tip) => <li key={tip} className="rounded-xl border p-4 text-xs leading-relaxed" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>✓ {tip}</li>)}</ul></div></section>}

        <section className="max-w-6xl mx-auto px-4 py-10" aria-labelledby="calculator-list-heading">
          <div className="mb-6"><h2 id="calculator-list-heading" className="text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Browse {label.toLowerCase()} calculators</h2><p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Choose a tool below to calculate a result and review the method behind it.</p></div>
          {calculators.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No calculators are currently published in this category.</p> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{calculators.map((calculator) => <Link key={calculator.slug} href={`/${calculator.slug}-calculator`} className="group rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:border-blue-500/50" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}><div className="flex items-start gap-3"><span className="text-2xl" aria-hidden="true">{calculator.icon}</span><div className="min-w-0"><h3 className="font-bold text-base group-hover:text-blue-500" style={{ color: 'var(--text-primary)' }}>{calculator.name}</h3><p className="text-xs leading-relaxed mt-1.5" style={{ color: 'var(--text-secondary)' }}>{calculator.description}</p><span className="inline-block mt-3 text-xs font-bold text-blue-500">Open calculator →</span></div></div></Link>)}</div>}
        </section>
      </main>
    </>
  );
}
