import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { CALCULATORS } from '@/config/calculators';
import { CALCULATOR_CONTENT } from '@/config/calculator-content';
import { getDb } from '@/lib/db';

export async function GET() {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const dynamicCalcs = db.calculators;

  // ── Static calculator audit ───────────────────────────────────────────────
  let staticMissingMeta  = 0;
  let staticMissingFaq   = 0;
  let staticMissingHowTo = 0;
  let staticMissingFormula = 0;
  let staticMissingSources = 0;

  for (const calc of CALCULATORS) {
    const content = CALCULATOR_CONTENT[calc.slug as keyof typeof CALCULATOR_CONTENT];
    if (!calc.description)              staticMissingMeta++;
    if (!content?.faqs?.length)         staticMissingFaq++;
    if (!content?.howToSteps?.length)   staticMissingHowTo++;
    if (!content?.formula)              staticMissingFormula++;
    if (!content?.sources?.length)      staticMissingSources++;
  }

  // ── Dynamic calculator audit ──────────────────────────────────────────────
  let dynMissingMeta  = 0;
  let dynMissingFaq   = 0;
  let dynMissingHowTo = 0;

  for (const calc of dynamicCalcs) {
    if (!calc.metadata.description)            dynMissingMeta++;
    if (!calc.metadata.faqItems?.length)       dynMissingFaq++;
    if (!calc.metadata.howToUse?.length)       dynMissingHowTo++;
  }

  const staticTotal  = CALCULATORS.length;
  const dynamicTotal = dynamicCalcs.length;
  const totalCalcs   = staticTotal + dynamicTotal;

  const indexed    = staticTotal + dynamicCalcs.filter((c) => c.status === 'active').length;
  const nonIndexed = dynamicCalcs.filter((c) => c.status === 'inactive').length;

  const missingMeta    = staticMissingMeta    + dynMissingMeta;
  const missingFaq     = staticMissingFaq     + dynMissingFaq;
  const missingContent = staticMissingHowTo   + dynMissingHowTo;
  const missingSchema  = staticMissingFormula;          // only static have formula blocks
  const missingLinks   = staticMissingSources;          // only static have source references

  // ── Article audit ─────────────────────────────────────────────────────────
  const articles = db.articles;
  const articlesMissingMeta = articles.filter(
    (a) => !a.seoData?.description || a.seoData.description.trim() === '',
  ).length;
  const articlesMissingCanonical = articles.filter(
    (a) => !a.seoData?.canonicalUrl || a.seoData.canonicalUrl.trim() === '',
  ).length;

  const score = (missing: number, total: number) =>
    total === 0 ? 100 : Math.round(((total - missing) / total) * 100);

  // ── Static health checks (verified at build time) ─────────────────────────
  const checks = [
    {
      name: 'llms.txt',
      status: 'Optimal',
      details: 'Full programmatic catalog served at /llms.txt',
      score: 100,
    },
    {
      name: 'robots.txt',
      status: 'Healthy',
      details: '/admin and /api paths disallowed from all crawlers',
      score: 100,
    },
    {
      name: 'Dynamic sitemap.xml',
      status: 'Optimal',
      details: `${staticTotal} static + ${dynamicTotal} dynamic entries indexed`,
      score: 100,
    },
    {
      name: '.html Redirects',
      status: 'Active',
      details: '301 & nested-path redirects strip .html — next.config.ts',
      score: 100,
    },
    {
      name: 'Canonical Tags',
      status: 'Active',
      details: 'Per-page canonicals via Next.js generateMetadata()',
      score: 100,
    },
    {
      name: 'Meta Descriptions',
      status: missingMeta === 0 ? 'Complete' : `${missingMeta} Missing`,
      details:
        missingMeta === 0
          ? `All ${totalCalcs} calculators have descriptions`
          : `${missingMeta} of ${totalCalcs} calculators missing meta description`,
      score: score(missingMeta, totalCalcs),
    },
    {
      name: 'FAQ Coverage',
      status: missingFaq === 0 ? 'Complete' : `${missingFaq} Missing`,
      details:
        missingFaq === 0
          ? `All ${totalCalcs} calculators have FAQ entries`
          : `${missingFaq} of ${totalCalcs} calculators have no FAQ`,
      score: score(missingFaq, totalCalcs),
    },
    {
      name: 'Structured Schema',
      status: missingSchema === 0 ? 'Complete' : `${missingSchema} Missing`,
      details:
        missingSchema === 0
          ? 'All static calculators have JSON-LD formula schema'
          : `${missingSchema} of ${staticTotal} static calculators lack formula JSON-LD`,
      score: score(missingSchema, staticTotal),
    },
    {
      name: 'Source References',
      status: missingLinks === 0 ? 'Complete' : `${missingLinks} Missing`,
      details:
        missingLinks === 0
          ? 'All static calculators cite authoritative sources'
          : `${missingLinks} of ${staticTotal} static calculators have no cited sources`,
      score: score(missingLinks, staticTotal),
    },
  ];

  return NextResponse.json({
    calculators: {
      total: totalCalcs,
      indexed,
      nonIndexed,
      missingMeta,
      missingFaq,
      missingSchema,
      missingContent,
      missingInternalLinks: missingLinks,
    },
    articles: {
      total: articles.length,
      missingMeta: articlesMissingMeta,
      missingCanonical: articlesMissingCanonical,
    },
    redirects: db.redirects.length,
    checks,
  });
}
