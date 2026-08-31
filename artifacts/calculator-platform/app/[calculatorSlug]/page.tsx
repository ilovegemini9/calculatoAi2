import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CALCULATOR_BY_SLUG, CALCULATORS, CATEGORY_LABELS, CATEGORY_COLORS, type CalculatorMeta } from '@/config/calculators';
import { CALCULATOR_CONTENT, type CalcContent } from '@/config/calculator-content';
import { siteConfig } from '@/config/site';
import { CalculatorRenderer } from '@/components/calculators/CalculatorRenderer';
import { DynamicCalculator } from '@/components/calculators/DynamicCalculator';
import { calculatorSchema, breadcrumbSchema, faqSchema, howToSchema, itemListSchema } from '@/lib/schemas';
import { RelatedCalculators, getRelatedCalculators } from '@/components/RelatedCalculators';
import { getDb } from '@/lib/db';
import { getAdsSettings } from '@/lib/ads';
import { AdSlot } from '@/components/ads/AdSlot';
import { checkP0Quality } from '@/lib/p0-quality-gate';
import { getOmniCalculator, toCalculatorMeta, toCalcContent } from '@/lib/omni-catalog-full';

interface Props { params: Promise<{ calculatorSlug: string }> }

function toBaseSlug(calculatorSlug: string) {
  return calculatorSlug.endsWith('-calculator') ? calculatorSlug.slice(0, -'-calculator'.length) : calculatorSlug;
}

async function getCalculatorData(calculatorSlug: string) {
  const baseSlug = toBaseSlug(calculatorSlug);
  const staticCalc = CALCULATOR_BY_SLUG[baseSlug];
  if (staticCalc) return { calc: staticCalc, isDynamic: false, content: CALCULATOR_CONTENT[baseSlug] };
  try {
    const db = await getDb();
    const dynamicCalc = db.calculators.find((c) => c.slug === baseSlug && c.status === 'active');
    if (dynamicCalc) return { calc: { slug: dynamicCalc.slug, name: dynamicCalc.name, shortName: dynamicCalc.name.replace(/\s*Calculator\s*/i, ''), description: dynamicCalc.metadata.description, icon: '⚡', category: dynamicCalc.category, keywords: dynamicCalc.metadata.keywords } as CalculatorMeta, isDynamic: true, dynamicSpec: dynamicCalc, content: { howToSteps: dynamicCalc.metadata.howToUse ?? [], faqs: dynamicCalc.metadata.faqItems ?? [], formula: dynamicCalc.metadata.formula, examples: dynamicCalc.metadata.examples } as CalcContent };
  } catch (err) { console.error('Error fetching dynamic calculator from DB:', err); }

  const omni = getOmniCalculator(baseSlug);
  if (omni) {
    return {
      calc: toCalculatorMeta(omni),
      isDynamic: true,
      dynamicSpec: {
        slug: omni.slug,
        name: omni.name,
        category: omni.category,
        metadata: {
          inputs: omni.inputs,
          outputs: omni.outputs,
          formula: omni.formula,
          howToUse: omni.howToSteps,
          faqItems: omni.faqs,
          examples: omni.examples,
        },
      },
      content: toCalcContent(omni),
    };
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
  const quality = checkP0Quality(calc.slug, calc);
  const indexable = !quality.reasons.includes('missing-calculator-meta') && !quality.reasons.includes('missing-name') && !quality.reasons.includes('missing-description') && !quality.reasons.includes('missing-content') && (!quality.reasons.includes('not-p0') || !CALCULATOR_CONTENT[calc.slug]);
  const canonicalUrl = `${siteConfig.url}/${calculatorSlug}`;
  const pageTitle = `${calc.name} — Free Online | ${siteConfig.name}`;
  return { title: calc.name, description: calc.description, keywords: calc.keywords, authors: [{ name: siteConfig.name, url: siteConfig.url }], alternates: { canonical: canonicalUrl }, robots: { index: indexable, follow: true, googleBot: { index: indexable, follow: true, 'max-snippet': -1, 'max-image-preview': 'large', 'max-video-preview': -1 } }, openGraph: { title: pageTitle, description: calc.description, url: canonicalUrl, siteName: siteConfig.name, type: 'website', images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: calc.name }] }, twitter: { card: 'summary_large_image', title: pageTitle, description: calc.description } };
}

function SectionCard({ title, accent = false, children }: { title: string; accent?: boolean; children: React.ReactNode }) {
  return <section className="max-w-5xl mx-auto px-4 pb-8"><div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}><div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}><h2 className={`text-xs font-black uppercase tracking-widest ${accent ? 'text-blue-500' : ''}`} style={accent ? undefined : { color: 'var(--text-secondary)' }}>{title}</h2></div><div className="p-6">{children}</div></div></section>;
}

export default async function CalculatorPage({ params }: Props) {
  const { calculatorSlug } = await params;
  const data = await getCalculatorData(calculatorSlug);
  if (!data) notFound();
  const { calc, isDynamic, dynamicSpec, content } = data;
  const baseSlug = toBaseSlug(calculatorSlug);
  const colors = CATEGORY_COLORS[calc.category] || { bg: 'bg-blue-500/10', text: 'text-blue-500' };
  const db = await getDb();
  const ads = getAdsSettings(db.settings.ads);
  const allCalculatorsList: CalculatorMeta[] = [...CALCULATORS, ...db.calculators.map((c) => ({ slug: c.slug, name: c.name, shortName: c.name.replace(/\s*Calculator\s*/i, ''), description: c.metadata.description, icon: '⚡' as const, category: c.category as CalculatorMeta['category'], keywords: c.metadata.keywords }))];
  const related = getRelatedCalculators(calc, allCalculatorsList, 6);
  const safeFaqs = Array.isArray(content?.faqs) ? content.faqs : [];
  const safeHowToSteps = Array.isArray(content?.howToSteps) ? content.howToSteps : [];
  const safeExamples = Array.isArray(content?.examples) ? content.examples : [];
  const safeUseCases = Array.isArray(content?.useCases) ? content.useCases : [];
  const safeCommonPitfalls = Array.isArray(content?.commonPitfalls) ? content.commonPitfalls : [];
  const safeFormula = content?.formula && Array.isArray(content.formula.variables)
    ? content.formula
    : null;
  const faqSchemaResult = safeFaqs.length > 0 ? faqSchema(safeFaqs) : null;
  const howToSchemaResult = safeHowToSteps.length > 0 ? howToSchema(calc, safeHowToSteps) : null;
  const relatedItemListSchema = related.length ? itemListSchema(related.map((r) => ({ name: r.name, slug: r.slug, description: r.description })), `Calculators Related to ${calc.name}`) : null;
  const schemas = [calculatorSchema(calc), breadcrumbSchema([{ name: 'Home', url: siteConfig.url }, { name: CATEGORY_LABELS[calc.category] || calc.category }, { name: calc.name, url: `${siteConfig.url}/${calculatorSlug}` }]), faqSchemaResult, howToSchemaResult, relatedItemListSchema].filter((s) => s != null) as object[];

  return <>{schemas.map((schema, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />)}<div className="border-b" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}><div className="max-w-5xl mx-auto px-4 pt-5 pb-6"><nav className="flex items-center gap-1.5 text-xs mb-5" style={{ color: 'var(--text-muted)' }} aria-label="Breadcrumb"><Link href="/" className="hover:text-blue-500 transition-colors">Home</Link><span aria-hidden="true">/</span><span>{CATEGORY_LABELS[calc.category] || calc.category}</span><span aria-hidden="true">/</span><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{calc.name}</span></nav><div className="flex items-start gap-4"><div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm border" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }} aria-hidden="true">{calc.icon}</div><div><div className="flex items-center gap-2 mb-1.5"><span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>{CATEGORY_LABELS[calc.category] || calc.category}</span></div><h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>{calc.name}</h1><p className="text-sm leading-relaxed mt-1 max-w-xl" style={{ color: 'var(--text-secondary)' }}>{calc.description}</p></div></div></div></div><div className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_280px]"><div className="min-w-0">{isDynamic && dynamicSpec ? <DynamicCalculator inputs={dynamicSpec.metadata.inputs || []} outputs={dynamicSpec.metadata.outputs || []} calculatorId={baseSlug} /> : <CalculatorRenderer slug={baseSlug} />}</div><aside className="min-w-0 lg:sticky lg:top-20"><AdSlot placement="sidebar" ads={ads} /></aside></div><div className="max-w-5xl mx-auto px-4 pb-8"><AdSlot placement="inContent" ads={ads} /></div>{safeHowToSteps.length > 0 && <SectionCard title={`How to Use the ${calc.name}`} accent><ol className="space-y-3.5">{safeHowToSteps.map((step, i) => <li key={i} id={`step-${i + 1}`} className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center mt-0.5 shadow-sm shadow-blue-600/30">{i + 1}</span><p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step}</p></li>)}</ol></SectionCard>}{safeFormula && <SectionCard title="Formula & Mathematical Basis"><div className="space-y-5"><div className="rounded-xl p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-x-auto" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', borderLeft: '3px solid var(--border-focus)' }} aria-label="Mathematical formula">{safeFormula.expression}</div>{safeFormula.variables.length > 0 && <div><p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Variable Key</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{safeFormula.variables.map((v) => <div key={v.symbol} className="flex items-start gap-3 rounded-lg p-3 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}><code className="text-xs font-black text-blue-500 shrink-0 w-10 text-center py-0.5 rounded" style={{ backgroundColor: 'var(--bg-card)' }}>{v.symbol}</code><p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{v.definition}</p></div>)}</div></div>}{safeFormula.notes && <p className="text-xs leading-relaxed italic border-t pt-4" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>📝 {safeFormula.notes}</p>}</div></SectionCard>}{safeExamples.length > 0 && <SectionCard title="Step-by-Step Examples"><div className="space-y-6">{safeExamples.map((ex, i) => <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}><div className="px-5 py-3 border-b flex items-center gap-2" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}><span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span><h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{ex.title}</h3></div><div className="p-5 space-y-4"><p className="text-sm italic" style={{ color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text-secondary)', fontStyle: 'normal' }}>Scenario: </strong>{ex.scenario}</p><ol className="space-y-2">{(Array.isArray(ex.steps) ? ex.steps : []).map((step, j) => <li key={j} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}><span className="text-[10px] font-black text-blue-500 shrink-0 mt-0.5">{j + 1}.</span><span className="leading-relaxed">{step}</span></li>)}</ol><div className="rounded-lg px-4 py-3 border-l-4 border-blue-500 text-sm font-semibold" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}>✅ {ex.result}</div></div></div>)}</div></SectionCard>}{(safeUseCases.length || safeCommonPitfalls.length) ? <div className="max-w-5xl mx-auto px-4 pb-8"><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{safeUseCases.length > 0 && <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}><h2 className="text-xs font-black uppercase tracking-widest mb-4 text-green-600 dark:text-green-400">Practical Use Cases</h2><ul className="space-y-2.5 list-disc list-inside">{safeUseCases.map((u, i) => <li key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{u}</li>)}</ul></div>}{safeCommonPitfalls.length > 0 && <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}><h2 className="text-xs font-black uppercase tracking-widest mb-4 text-amber-600 dark:text-amber-400">Common Pitfalls</h2><ul className="space-y-2.5 list-disc list-inside">{safeCommonPitfalls.map((p, i) => <li key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{p}</li>)}</ul></div>}</div></div> : null}{safeFaqs.length > 0 && <SectionCard title="Frequently Asked Questions" accent><div className="divide-y" style={{ borderColor: 'var(--border)' }}>{safeFaqs.map((faq, i) => <details key={i} className="group py-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{faq.question}<span className="text-blue-500 transition-transform group-open:rotate-45 text-xl font-light">+</span></summary><p className="pt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{faq.answer}</p></details>)}</div></SectionCard>}{safeCommonPitfalls.length > 0 ? null : null}<RelatedCalculators current={calc} calculators={related} /></>;
}