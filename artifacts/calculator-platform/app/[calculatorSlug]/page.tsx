import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  CALCULATOR_BY_SLUG,
  CALCULATORS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type CalculatorMeta,
} from '@/config/calculators';
import { CALCULATOR_CONTENT, type CalcContent } from '@/config/calculator-content';
import { siteConfig } from '@/config/site';
import { CalculatorRenderer } from '@/components/calculators/CalculatorRenderer';
import { DynamicCalculator } from '@/components/calculators/DynamicCalculator';
import { calculatorSchema, breadcrumbSchema, faqSchema, howToSchema, itemListSchema } from '@/lib/schemas';
import { RelatedCalculators, getRelatedCalculators } from '@/components/RelatedCalculators';
import { getDb } from '@/lib/db';

interface Props {
  params: Promise<{ calculatorSlug: string }>;
}

/** /mortgage-calculator → base slug "mortgage" */
function toBaseSlug(calculatorSlug: string): string {
  return calculatorSlug.endsWith('-calculator')
    ? calculatorSlug.slice(0, -'-calculator'.length)
    : calculatorSlug;
}

async function getCalculatorData(calculatorSlug: string) {
  const baseSlug = toBaseSlug(calculatorSlug);

  const staticCalc = CALCULATOR_BY_SLUG[baseSlug];
  if (staticCalc) {
    return { calc: staticCalc, isDynamic: false, content: CALCULATOR_CONTENT[baseSlug] };
  }

  try {
    const db = getDb();
    // Only serve active calculators — inactive ones require passing tests first
    const dynamicCalc = db.calculators.find((c) => c.slug === baseSlug && c.status === 'active');
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
          howToSteps: dynamicCalc.metadata.howToUse ?? [],
          faqs: dynamicCalc.metadata.faqItems ?? [],
          formula: dynamicCalc.metadata.formula,
          examples: dynamicCalc.metadata.examples,
        } as CalcContent,
      };
    }
  } catch (err) {
    console.error('Error fetching dynamic calculator from DB:', err);
  }

  return null;
}

export async function generateStaticParams() {
  return CALCULATORS.map((c) => ({ calculatorSlug: `${c.slug}-calculator` }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { calculatorSlug } = await params;
  const data = await getCalculatorData(calculatorSlug);
  if (!data) return {};
  const { calc } = data;

  const canonicalUrl = `${siteConfig.url}/${calculatorSlug}`;
  const pageTitle = `${calc.name} — Free Online | ${siteConfig.name}`;

  return {
    title: calc.name,
    description: calc.description,
    keywords: calc.keywords,
    authors: [{ name: siteConfig.name, url: siteConfig.url }],
    alternates: { canonical: canonicalUrl },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title: pageTitle,
      description: calc.description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      type: 'website',
      images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: calc.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: calc.description,
    },
  };
}

// ─── Shared section shell ─────────────────────────────────────────────────

function SectionCard({
  title,
  accent = false,
  children,
}: {
  title: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="max-w-5xl mx-auto px-4 pb-8">
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2
            className={`text-xs font-black uppercase tracking-widest ${accent ? 'text-blue-500' : ''}`}
            style={accent ? undefined : { color: 'var(--text-secondary)' }}
          >
            {title}
          </h2>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function CalculatorPage({ params }: Props) {
  const { calculatorSlug } = await params;
  const data = await getCalculatorData(calculatorSlug);
  if (!data) notFound();

  const { calc, isDynamic, dynamicSpec, content } = data;
  const baseSlug = toBaseSlug(calculatorSlug);
  const colors = CATEGORY_COLORS[calc.category] || { bg: 'bg-blue-500/10', text: 'text-blue-500' };

  const db = getDb();
  const allCalculatorsList: CalculatorMeta[] = [
    ...CALCULATORS,
    ...db.calculators.map((c) => ({
      slug: c.slug,
      name: c.name,
      shortName: c.name.replace(/\s*Calculator\s*/i, ''),
      description: c.metadata.description,
      icon: '⚡' as const,
      category: c.category as CalculatorMeta['category'],
      keywords: c.metadata.keywords,
    })),
  ];

  const related = getRelatedCalculators(calc, allCalculatorsList, 6);

  // ── JSON-LD schemas ─────────────────────────────────────────────────────
  const faqSchemaResult = content?.faqs?.length ? faqSchema(content.faqs) : null;
  const howToSchemaResult = content?.howToSteps?.length ? howToSchema(calc, content.howToSteps) : null;
  const relatedItemListSchema = related.length
    ? itemListSchema(
        related.map((r) => ({ name: r.name, slug: r.slug, description: r.description })),
        `Calculators Related to ${calc.name}`,
      )
    : null;

  const schemas = [
    calculatorSchema(calc),
    breadcrumbSchema([
      { name: 'Home', url: siteConfig.url },
      { name: CATEGORY_LABELS[calc.category] || calc.category },
      { name: calc.name, url: `${siteConfig.url}/${calculatorSlug}` },
    ]),
    faqSchemaResult,
    howToSchemaResult,
    relatedItemListSchema,
  ].filter((s) => s != null) as object[];

  return (
    <>
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="border-b" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 pt-5 pb-6">
          <nav className="flex items-center gap-1.5 text-xs mb-5" style={{ color: 'var(--text-muted)' }} aria-label="Breadcrumb">
            <Link href="/" className="hover:text-blue-500 transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <span>{CATEGORY_LABELS[calc.category] || calc.category}</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{calc.name}</span>
          </nav>

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

      {/* ── Calculator widget ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {isDynamic && dynamicSpec ? (
          <DynamicCalculator
            inputs={dynamicSpec.metadata.inputs || []}
            outputs={dynamicSpec.metadata.outputs || []}
            calculateBody={dynamicSpec.metadata.calculateBody || ''}
          />
        ) : (
          <CalculatorRenderer slug={baseSlug} />
        )}
      </div>

      {/* ── How to use ────────────────────────────────────────────────────── */}
      {content?.howToSteps && content.howToSteps.length > 0 && (
        <SectionCard title={`How to Use the ${calc.name}`} accent>
          <ol className="space-y-3.5">
            {content.howToSteps.map((step, i) => (
              <li key={i} id={`step-${i + 1}`} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center mt-0.5 shadow-sm shadow-blue-600/30">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step}</p>
              </li>
            ))}
          </ol>
        </SectionCard>
      )}

      {/* ── Formula breakdown ─────────────────────────────────────────────── */}
      {content?.formula && (
        <SectionCard title="Formula & Mathematical Basis">
          <div className="space-y-5">
            <div
              className="rounded-xl p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-x-auto"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', borderLeft: '3px solid var(--border-focus)' }}
              aria-label="Mathematical formula"
            >
              {content.formula.expression}
            </div>
            {content.formula.variables.length > 0 && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                  Variable Key
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {content.formula.variables.map((v) => (
                    <div key={v.symbol} className="flex items-start gap-3 rounded-lg p-3 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
                      <code className="text-xs font-black text-blue-500 shrink-0 w-10 text-center py-0.5 rounded" style={{ backgroundColor: 'var(--bg-card)' }}>
                        {v.symbol}
                      </code>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{v.definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {content.formula.notes && (
              <p className="text-xs leading-relaxed italic border-t pt-4" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                📝 {content.formula.notes}
              </p>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── Worked examples ───────────────────────────────────────────────── */}
      {content?.examples && content.examples.length > 0 && (
        <SectionCard title="Step-by-Step Examples">
          <div className="space-y-6">
            {content.examples.map((ex, i) => (
              <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                <div className="px-5 py-3 border-b flex items-center gap-2" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{ex.title}</h3>
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-secondary)', fontStyle: 'normal' }}>Scenario: </strong>
                    {ex.scenario}
                  </p>
                  <ol className="space-y-2">
                    {ex.steps.map((step, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span className="text-[10px] font-black text-blue-500 shrink-0 mt-0.5">{j + 1}.</span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="rounded-lg px-4 py-3 border-l-4 border-blue-500 text-sm font-semibold" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                    ✅ {ex.result}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Use cases + Pitfalls ──────────────────────────────────────────── */}
      {(content?.useCases?.length || content?.commonPitfalls?.length) ? (
        <div className="max-w-5xl mx-auto px-4 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {content?.useCases && content.useCases.length > 0 && (
              <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h2 className="text-xs font-black uppercase tracking-widest mb-4 text-green-600 dark:text-green-400">Practical Use Cases</h2>
                <ul className="space-y-2.5" role="list">
                  {content.useCases.map((uc, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <span className="text-green-500 shrink-0 mt-0.5" aria-hidden="true">✓</span>
                      <span className="leading-relaxed">{uc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {content?.commonPitfalls && content.commonPitfalls.length > 0 && (
              <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <h2 className="text-xs font-black uppercase tracking-widest mb-4 text-amber-600 dark:text-amber-400">Common Mistakes to Avoid</h2>
                <ul className="space-y-2.5" role="list">
                  {content.commonPitfalls.map((p, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <span className="text-amber-500 shrink-0 mt-0.5" aria-hidden="true">⚠</span>
                      <span className="leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ── Glossary ──────────────────────────────────────────────────────── */}
      {content?.glossary && content.glossary.length > 0 && (
        <SectionCard title="Glossary of Terms">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {content.glossary.map((g) => (
              <div key={g.term} className="rounded-xl p-4 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
                <dt className="text-xs font-black uppercase tracking-wide text-blue-500 mb-1.5">{g.term}</dt>
                <dd className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{g.definition}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>
      )}

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      {content?.faqs && content.faqs.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-8">
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                Frequently Asked Questions
              </h2>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {content.faqs.map((faq, i) => (
                <details key={i} className="group" style={{ borderColor: 'var(--border)' }}>
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer transition-colors list-none hover:bg-[var(--bg-card-hover)]">
                    <h3 className="text-sm font-semibold group-hover:text-blue-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {faq.question}
                    </h3>
                    <span className="text-xs flex-shrink-0 transition-transform group-open:rotate-180" style={{ color: 'var(--text-muted)' }}>▾</span>
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

      {/* ── Sources & References ──────────────────────────────────────────── */}
      {content?.sources && content.sources.length > 0 && (
        <SectionCard title="Sources & References">
          <ol className="space-y-3" role="list">
            {content.sources.map((src, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="text-[10px] font-black text-blue-500 shrink-0 mt-0.5 w-5 text-right">[{i + 1}]</span>
                <div>
                  <a href={src.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-500 hover:underline">
                    {src.title}
                  </a>
                  <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                    — {src.publisher}{src.year ? `, ${src.year}` : ''}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>
      )}

      {/* ── Author attribution ────────────────────────────────────────────── */}
      {content?.author && (
        <div className="max-w-5xl mx-auto px-4 pb-8">
          <div className="rounded-2xl border p-5 flex items-start gap-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0" aria-hidden="true">
              {content.author.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {content.author.name}
                <span className="font-normal ml-2 text-xs text-blue-500">{content.author.credentials}</span>
              </p>
              <p className="text-xs leading-relaxed mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {content.author.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Related calculators ───────────────────────────────────────────── */}
      <RelatedCalculators related={related} />
    </>
  );
}
