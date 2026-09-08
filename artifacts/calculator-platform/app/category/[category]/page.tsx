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
  return {
    title: `${label} Calculators — Free Online Tools`,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${label} Calculators | ${siteConfig.name}`, description, url, type: 'website' },
    robots: { index: true, follow: true },
  };
}

export default async function CalculatorCategoryPage({ params }: Props) {
  const { category } = await params;
  const label = CATEGORY_LABELS[category];
  if (!label) notFound();

  const calculators = getAllOmniCalculators()
    .filter((calculator) => calculator.category === category)
    .map((calculator) => ({
      slug: calculator.slug,
      name: calculator.name,
      shortName: calculator.shortName,
      category: category as CalculatorMeta['category'],
      description: calculator.description,
      keywords: calculator.keywords,
      icon: calculator.icon,
    }));

  const url = `${siteConfig.url}/category/${category}`;
  const schema = itemListSchema(
    calculators.slice(0, 100).map((calculator) => ({ name: calculator.name, slug: calculator.slug, description: calculator.description })),
    `${label} Calculators`,
  );
  const breadcrumbs = breadcrumbSchema([{ name: 'Home', url: siteConfig.url }, { name: label, url }]);
  const colors = CATEGORY_COLORS[category] || { bg: 'bg-blue-500/10', text: 'text-blue-500' };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />}
      <main>
        <section className="border-b" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <div className="max-w-6xl mx-auto px-4 py-10">
            <nav aria-label="Breadcrumb" className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
              <Link href="/" className="hover:text-blue-500">Home</Link><span className="mx-2">/</span><span style={{ color: 'var(--text-primary)' }}>{label}</span>
            </nav>
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${colors.bg}`}>{CATEGORY_ICONS[category] ?? '🧮'}</div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${colors.text}`}>Calculator category</p>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1" style={{ color: 'var(--text-primary)' }}>{label} Calculators</h1>
                <p className="max-w-3xl mt-3 text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{CATEGORY_DESCRIPTIONS[category]}</p>
                <p className="mt-2 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{calculators.length} published calculators in this category.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-10">
          {calculators.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No calculators are currently published in this category.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {calculators.map((calculator) => (
                <Link key={calculator.slug} href={`/${calculator.slug}-calculator`} className="group rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:border-blue-500/50" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl" aria-hidden="true">{calculator.icon}</span>
                    <div className="min-w-0">
                      <h2 className="font-bold text-base group-hover:text-blue-500" style={{ color: 'var(--text-primary)' }}>{calculator.name}</h2>
                      <p className="text-xs leading-relaxed mt-1.5" style={{ color: 'var(--text-secondary)' }}>{calculator.description}</p>
                      <span className="inline-block mt-3 text-xs font-bold text-blue-500">Open calculator →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
