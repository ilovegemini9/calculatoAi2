import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CALCULATOR_BY_SLUG, CALCULATORS, CATEGORY_LABELS, CATEGORY_COLORS, type CalculatorMeta } from '@/config/calculators';
import { CALCULATOR_CONTENT } from '@/config/calculator-content';
import { siteConfig } from '@/config/site';
import { CalculatorRenderer } from '@/components/calculators/CalculatorRenderer';
import { DynamicCalculator } from '@/components/calculators/DynamicCalculator';
import { calculatorSchema, breadcrumbSchema, faqSchema, howToSchema } from '@/lib/schemas';
import { getDb } from '@/lib/db';

interface Props {
  params: Promise<{ slug: string[] }>;
}

async function getCalculatorData(slug: string) {
  // Check static calculators first
  const staticCalc = CALCULATOR_BY_SLUG[slug];
  if (staticCalc) {
    return {
      calc: staticCalc,
      isDynamic: false,
      content: CALCULATOR_CONTENT[slug],
    };
  }

  // Check database for dynamically generated calculators
  try {
    const db = getDb();
    const dynamicCalc = db.calculators.find((c) => c.slug === slug);
    if (dynamicCalc) {
      return {
        calc: {
          slug: dynamicCalc.slug,
          name: dynamicCalc.name,
          shortName: dynamicCalc.name.replace(/\s*Calculator\s*/i, ''),
          description: dynamicCalc.metadata.description,
          icon: '⚡',
          category: dynamicCalc.category,
          keywords: dynamicCalc.metadata.keywords,
        } as CalculatorMeta,
        isDynamic: true,
        dynamicSpec: dynamicCalc,
        content: {
          howToSteps: dynamicCalc.metadata.howToUse,
          faqs: dynamicCalc.metadata.faqItems,
        },
      };
    }
  } catch (err) {
    console.error('Error fetching dynamic calculator from DB:', err);
  }

  return null;
}

export async function generateStaticParams() {
  return CALCULATORS.map((c) => ({ slug: [c.slug] }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const mainSlug = slug ? slug[0] : '';
  const data = await getCalculatorData(mainSlug);
  if (!data) return {};
  const { calc } = data;

  return {
    title: calc.name,
    description: calc.description,
    keywords: calc.keywords,
    alternates: {
      canonical: `/calculator/${mainSlug}`,
    },
    openGraph: {
      title: `${calc.name} — Free Online | ${siteConfig.name}`,
      description: calc.description,
      url: `/calculator/${mainSlug}`,
      type: 'website',
      images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: calc.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${calc.name} — Free Online | ${siteConfig.name}`,
      description: calc.description,
    },
  };
}

export default async function CalculatorCatchAllPage({ params }: Props) {
  const { slug } = await params;
  const mainSlug = slug ? slug[0] : '';
  const data = await getCalculatorData(mainSlug);
  if (!data) notFound();

  const { calc, isDynamic, dynamicSpec, content } = data;
  const colors = CATEGORY_COLORS[calc.category] || { bg: 'bg-blue-500/10', text: 'text-blue-500' };
  
  // Mix static and dynamic to show in related cards
  const db = getDb();
  const allCalculatorsList = [
    ...CALCULATORS,
    ...db.calculators.map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.metadata.description,
      icon: '⚡',
      category: c.category,
    }))
  ];

  const related = allCalculatorsList
    .filter((c) => c.slug !== mainSlug && c.category === calc.category)
    .slice(0, 3);

  const schemas = [
    calculatorSchema(calc),
    breadcrumbSchema([
      { name: 'Home', url: siteConfig.url },
      { name: CATEGORY_LABELS[calc.category] || calc.category },
      { name: calc.name, url: `${siteConfig.url}/calculator/${mainSlug}` },
    ]),
    ...(content?.faqs ? [faqSchema(content.faqs)] : []),
    ...(content?.howToSteps ? [howToSchema(calc, content.howToSteps)] : []),
  ];

  return (
    <>
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      {/* Page chrome */}
      <div
        className="border-b"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-5xl mx-auto px-4 pt-5 pb-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs mb-5" style={{ color: 'var(--text-muted)' }} aria-label="Breadcrumb">
            <Link href="/" className="hover:text-blue-500 transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <span>{CATEGORY_LABELS[calc.category] || calc.category}</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{calc.name}</span>
          </nav>

          {/* Header */}
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm border"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}
              aria-hidden="true"
            >
              {calc.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                  {CATEGORY_LABELS[calc.category] || calc.category}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {calc.name}
              </h1>
              <p className="text-sm leading-relaxed mt-1 max-w-xl" style={{ color: 'var(--text-secondary)' }}>
                {calc.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calculator widget */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {isDynamic && dynamicSpec ? (
          <DynamicCalculator
            inputs={dynamicSpec.metadata.inputs || []}
            outputs={dynamicSpec.metadata.outputs || []}
            calculateBody={dynamicSpec.metadata.calculateBody || ''}
          />
        ) : (
          <CalculatorRenderer slug={mainSlug} />
        )}
      </div>

      {/* How to use */}
      {content?.howToSteps && content.howToSteps.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-8">
          <div
            className="rounded-2xl border p-6"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-5">
              How to Use the {calc.name}
            </h2>
            <ol className="space-y-3.5">
              {content.howToSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center mt-0.5 shadow-sm shadow-blue-600/30">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* FAQ */}
      {content?.faqs && content.faqs.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-8">
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                Frequently Asked Questions
              </h2>
            </div>
            <div className="divide-y" style={{ '--tw-divide-opacity': '1' } as React.CSSProperties}>
              {content.faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <summary
                    className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer transition-colors list-none hover:bg-[var(--bg-card-hover)]"
                  >
                    <h3 className="text-sm font-semibold group-hover:text-blue-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {faq.question}
                    </h3>
                    <span className="text-xs flex-shrink-0 transition-transform group-open:rotate-180" style={{ color: 'var(--text-muted)' }}>
                      ▾
                    </span>
                  </summary>
                  <div className="px-5 pb-4 pt-1 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-input)' }}>
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related calculators */}
      {related.length > 0 && (
        <section
          className="border-t py-10 px-4"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: 'var(--text-muted)' }}>
              Related Calculators
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/calculator/${r.slug}`}
                  className="group flex items-center gap-3 p-4 rounded-xl border card-lift transition-all duration-200"
                  style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border)' }}
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{r.icon}</span>
                  <div>
                    <p className="font-semibold text-sm group-hover:text-blue-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {r.name}
                    </p>
                    <p className="text-[11px] line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                      {r.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
