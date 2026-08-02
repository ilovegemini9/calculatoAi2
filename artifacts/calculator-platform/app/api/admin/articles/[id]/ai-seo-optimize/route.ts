export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { getAiProviderKey, getAiSettings, getProviderModels } from '@/lib/ai';
import { siteConfig } from '@/config/site';
import type {
  Article,
  ArticleEntity,
  EeatSignals,
  SeoAudit,
  SeoCheck,
  SeoCheckStatus,
} from '@/lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function wordCount(html: string): number {
  return stripHtml(html).split(/\s+/).filter(Boolean).length;
}

function keywordDensity(html: string, keyword: string): number {
  const text = stripHtml(html).toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const kw = keyword.toLowerCase();
  const matches = words.filter((w) => w.includes(kw)).length;
  return words.length > 0 ? (matches / words.length) * 100 : 0;
}

function check(label: string, status: SeoCheckStatus, detail: string): SeoCheck {
  return { label, status, detail };
}

// ─── SEO Audit (computed — no AI needed) ──────────────────────────────────────

function runSeoAudit(article: Article): Omit<SeoAudit, 'optimizedAt'> {
  const html = article.content ?? '';
  const plain = stripHtml(html);
  const wc = wordCount(html);
  const focusKw =
    article.keywordData?.keyword ||
    article.seoData?.keywords?.[0] ||
    article.title;
  const density = keywordDensity(html, focusKw);
  const metaDesc = article.seoData?.description ?? '';
  const metaTitle = article.seoData?.title ?? '';

  const checks: SeoCheck[] = [];

  // ── Helpful Content ──────────────────────────────────────────────────────
  checks.push(
    check(
      'Word count ≥ 1,200 (Helpful Content)',
      wc >= 1200 ? 'pass' : wc >= 800 ? 'warn' : 'fail',
      wc >= 1200 ? `${wc.toLocaleString()} words — meets Google's helpful content standard.` :
        `${wc.toLocaleString()} words — aim for at least 1,200 for comprehensive coverage.`,
    ),
  );

  const hasTable = /<table/i.test(html);
  checks.push(
    check(
      'Data table present (Rich Results)',
      hasTable ? 'pass' : 'warn',
      hasTable
        ? 'Article includes at least one data table — helps with rich results and featured snippets.'
        : 'No data table found. Adding a comparison table improves Featured Snippet eligibility.',
    ),
  );

  const hasOl = /<ol/i.test(html);
  checks.push(
    check(
      'Numbered steps / How-To (Rich Results)',
      hasOl ? 'pass' : 'warn',
      hasOl
        ? 'Ordered list found — eligible for HowTo rich result.'
        : 'No ordered list detected. A step-by-step section improves HowTo eligibility.',
    ),
  );

  const hasFaq = /faq|frequently asked/i.test(html);
  checks.push(
    check(
      'FAQ section (FAQPage schema)',
      hasFaq ? 'pass' : 'warn',
      hasFaq
        ? 'FAQ section found — supports FAQPage rich result in Search.'
        : 'No FAQ section detected. A 4–6 question FAQ section enables FAQPage rich results.',
    ),
  );

  const hasRefs = /references|sources|further reading/i.test(html);
  checks.push(
    check(
      'References / Sources (E-E-A-T Trust)',
      hasRefs ? 'pass' : 'warn',
      hasRefs
        ? 'References section found — signals authoritative sourcing to Google.'
        : 'No references section. Citing authoritative sources (gov, academic) improves E-E-A-T.',
    ),
  );

  // ── E-E-A-T ────────────────────────────────────────────────────────────
  const hasExternalLinks = /<a[^>]+href="https?:\/\//i.test(html);
  checks.push(
    check(
      'External authority links (E-E-A-T)',
      hasExternalLinks ? 'pass' : 'warn',
      hasExternalLinks
        ? 'External links to authoritative sources found.'
        : 'No external links found. Linking out to .gov, .edu, or major publications signals trust.',
    ),
  );

  const hasSchema = article.schemaArticle || article.schemaFaq || article.schemaHowTo;
  checks.push(
    check(
      'Structured data / JSON-LD (Rich Results)',
      hasSchema ? 'pass' : 'fail',
      hasSchema
        ? 'Structured data present — eligible for rich results in Google Search.'
        : 'No JSON-LD schema detected. Run the SEO Engine to generate Article, FAQ, and HowTo schemas.',
    ),
  );

  // ── Featured Snippet ────────────────────────────────────────────────────
  const first200 = plain.slice(0, 300);
  // Look for a direct answer pattern: short, declarative sentences ≤ 60 words early in the article
  const sentences = first200.match(/[^.!?]{20,200}[.!?]/g) ?? [];
  const hasDirectAnswer = sentences.some((s) => {
    const wds = s.trim().split(/\s+/).length;
    return wds >= 20 && wds <= 70;
  });
  checks.push(
    check(
      'Direct answer early (Featured Snippet)',
      hasDirectAnswer ? 'pass' : 'warn',
      hasDirectAnswer
        ? 'A concise direct-answer paragraph found near the top — good Featured Snippet candidate.'
        : 'First 300 words lack a clear direct answer. Move a 40–60 word factual answer to paragraph 2 to target featured snippets.',
    ),
  );

  // ── Voice Search ─────────────────────────────────────────────────────────
  const hasFaqItems = (article.faqItems?.length ?? 0) >= 3;
  checks.push(
    check(
      'FAQ items for voice search',
      hasFaqItems ? 'pass' : 'warn',
      hasFaqItems
        ? `${article.faqItems!.length} FAQ items stored — voice assistants can use these for spoken answers.`
        : 'Fewer than 3 FAQ items. Expand the FAQ section with natural-language questions for voice search.',
    ),
  );

  // ── AI Overview / LLM Citations ─────────────────────────────────────────
  const hasAiOverviewTarget = !!article.aiOverviewTarget?.trim();
  checks.push(
    check(
      'AI Overview target (ChatGPT / Gemini / Perplexity)',
      hasAiOverviewTarget ? 'pass' : 'warn',
      hasAiOverviewTarget
        ? 'AI Overview snippet set — direct answer ready for AI search engine citations.'
        : 'No AI Overview target set. Click "Optimize" to generate a 40–60 word direct answer that AI search engines can cite.',
    ),
  );

  // ── Keyword SEO ─────────────────────────────────────────────────────────
  const kwInTitle = metaTitle.toLowerCase().includes(focusKw.toLowerCase());
  checks.push(
    check(
      'Focus keyword in meta title',
      kwInTitle ? 'pass' : 'warn',
      kwInTitle
        ? 'Focus keyword appears in meta title.'
        : `Focus keyword "${focusKw}" not found in meta title. Update in Meta Tags tab.`,
    ),
  );

  const kwInMeta = metaDesc.toLowerCase().includes(focusKw.toLowerCase());
  checks.push(
    check(
      'Focus keyword in meta description',
      kwInMeta ? 'pass' : 'warn',
      kwInMeta
        ? 'Focus keyword appears in meta description.'
        : 'Focus keyword missing from meta description. Run SEO Engine to regenerate.',
    ),
  );

  checks.push(
    check(
      'Keyword density 0.5–2% (no stuffing)',
      density <= 2.5 && density >= 0.3 ? 'pass' : density > 2.5 ? 'warn' : 'warn',
      density > 2.5
        ? `Density ${density.toFixed(1)}% — slightly high. Vary with synonyms to avoid over-optimization.`
        : density < 0.3
        ? `Density ${density.toFixed(1)}% — keyword used infrequently. Ensure it appears naturally 3–5× in the body.`
        : `Density ${density.toFixed(1)}% — in the healthy range.`,
    ),
  );

  const metaDescLen = metaDesc.length;
  checks.push(
    check(
      'Meta description length (140–155 chars)',
      metaDescLen >= 140 && metaDescLen <= 160 ? 'pass' : metaDescLen > 0 ? 'warn' : 'fail',
      metaDescLen === 0
        ? 'No meta description set. Run SEO Engine to generate one.'
        : metaDescLen >= 140 && metaDescLen <= 160
        ? `${metaDescLen} characters — ideal range.`
        : `${metaDescLen} characters — target 140–155 for full SERP display.`,
    ),
  );

  checks.push(
    check(
      'Canonical URL set',
      article.seoData?.canonicalUrl ? 'pass' : 'warn',
      article.seoData?.canonicalUrl
        ? `Canonical: ${article.seoData.canonicalUrl}`
        : 'No canonical URL set. Prevents duplicate content issues.',
    ),
  );

  // ── Score ────────────────────────────────────────────────────────────────
  const passed = checks.filter((c) => c.status === 'pass').length;
  const warned = checks.filter((c) => c.status === 'warn').length;
  const score = Math.round((passed / checks.length) * 100 - (warned / checks.length) * 10);

  return { score: Math.max(0, Math.min(100, score)), checks };
}

// ─── AI Enrichment ────────────────────────────────────────────────────────────

interface AiSeoResult {
  aiOverviewTarget: string;
  semanticKeywords: string[];
  entities: ArticleEntity[];
  eeatSignals: EeatSignals;
  schemaArticleEnhanced: string | null;
}

async function callAiForSeoOptimization(
  apiKey: string,
  model: string,
  article: {
    title: string;
    focusKeyword: string;
    contentSnippet: string;
    existingKeywords: string[];
    base: string;
    slug: string;
    wordCount: number;
    faqCount: number;
    hasReferences: boolean;
    hasCitations: boolean;
  },
): Promise<AiSeoResult | null> {
  const prompt = `You are an expert SEO strategist and semantic search specialist. Analyze this article and produce structured optimization data.

ARTICLE: ${article.title}
FOCUS KEYWORD: ${article.focusKeyword}
EXISTING KEYWORDS: ${article.existingKeywords.slice(0, 10).join(', ')}
CONTENT SNIPPET (first 600 chars): ${article.contentSnippet}
STATS: ${article.wordCount} words, ${article.faqCount} FAQs, references: ${article.hasReferences}, citations: ${article.hasCitations}

TASK — produce ONLY the following valid JSON (no markdown, no explanation):
{
  "aiOverviewTarget": "A 40-60 word direct, factual answer to the main question implied by the focus keyword. This is what Google AI Overview, ChatGPT, Gemini, and Perplexity will cite. Must start with the focus keyword or a direct statement. Conversational but authoritative. No banned phrases.",
  "semanticKeywords": ["10-15 LSI and semantic keyword phrases related to the topic — topic cluster vocabulary, not just keyword variations. These should expand topic depth."],
  "entities": [
    { "name": "Entity name", "type": "Organization|Person|Concept|Place|Product|FinancialProduct|MedicalCondition|Other", "description": "One-sentence description of relevance to the topic" }
  ],
  "eeatSignals": {
    "expertiseLevel": "beginner|intermediate|expert",
    "authoritySignals": ["3-5 specific things in this article that signal expertise or authority"],
    "trustSignals": ["3-5 specific trust indicators (e.g. cites government data, links to institutions, uses real statistics)"],
    "experienceIndicators": ["2-4 things that show real-world experience with the topic"]
  },
  "schemaArticleEnhanced": null
}

RULES:
- aiOverviewTarget: exactly 40-60 words, declarative, factual, no hedge words, starts with the topic
- semanticKeywords: topic-cluster terms, not keyword stuffing — think of what a thorough Wikipedia article would cover
- entities: 3-6 real entities; skip if the topic has few named entities
- All text must be accurate, non-fabricated, professional
- Return valid JSON only`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': siteConfig.url,
      'X-Title': siteConfig.name,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${res.statusText}`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content ?? '';
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try {
    const parsed = JSON.parse(jsonStr) as AiSeoResult;
    // Validate key fields
    if (!parsed.aiOverviewTarget || !Array.isArray(parsed.semanticKeywords)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ─── Enhanced Article schema with E-E-A-T signals ─────────────────────────────

function buildEnhancedArticleSchema(
  article: Article,
  base: string,
  eeat: EeatSignals,
): string {
  const url = `${base}/blog/${article.slug}`;
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.seoData?.title || article.title,
      description: article.seoData?.description || '',
      url,
      datePublished: article.createdAt,
      dateModified: article.updatedAt || article.createdAt,
      wordCount: article.wordCount ?? 0,
      keywords: (article.seoData?.keywords ?? []).join(', '),
      inLanguage: 'en-US',
      isAccessibleForFree: true,
      // E-E-A-T: author as Organization with expertise context
      author: {
        '@type': 'Organization',
        name: siteConfig.name,
        url: base,
        description: `${siteConfig.name} provides expert-reviewed calculators and financial guides. ${eeat.authoritySignals[0] ?? ''}`,
      },
      publisher: {
        '@type': 'Organization',
        name: siteConfig.name,
        url: base,
        logo: {
          '@type': 'ImageObject',
          url: `${base}/icon-512.png`,
          width: 512,
          height: 512,
        },
      },
      // Speakable — signals voice search candidates
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['.article-body p:first-of-type', 'h1', 'h2'],
      },
      // About entities
      about: {
        '@type': 'Thing',
        name: article.keywordData?.keyword || article.seoData?.keywords?.[0] || article.title,
        description: article.seoData?.description || '',
      },
    },
    null,
    2,
  );
}

// ─── Route ────────────────────────────────────────────────────────────────────

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const db = getDb();
    const article = db.articles.find((a) => a.id === id);
    if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

    // ── Run audit (always, no AI needed) ──────────────────────────────────
    const auditResult = runSeoAudit(article);
    const seoAudit: SeoAudit = {
      ...auditResult,
      optimizedAt: new Date().toISOString(),
    };

    // ── Try AI enrichment ─────────────────────────────────────────────────
    const orKey =
      getAiProviderKey(
        getAiSettings(db.settings.ai, db.settings.openrouterApiKey),
        'openrouter',
      ) || process.env.OPENROUTER_API_KEY || '';

    let aiResult: AiSeoResult | null = null;
    let aiUsed = false;

    if (orKey) {
      const models = getProviderModels(
        getAiSettings(db.settings.ai, db.settings.openrouterApiKey),
        'openrouter',
        [
          'google/gemma-3-12b-it:free',
          'google/gemma-4-31b-it:free',
          'meta-llama/llama-4-scout:free',
          'nvidia/nemotron-3-nano-30b-a3b:free',
        ],
      );

      const base = (siteConfig.url || 'https://calculatorfree.vercel.app').replace(/\/$/, '');
      const focusKeyword =
        article.keywordData?.keyword ||
        article.seoData?.keywords?.[0] ||
        article.title;

      for (const model of models) {
        try {
          aiResult = await callAiForSeoOptimization(orKey, model, {
            title: article.title,
            focusKeyword,
            contentSnippet: stripHtml(article.content).slice(0, 600),
            existingKeywords: [
              ...(article.seoData?.keywords ?? []),
              ...(article.relatedKeywords ?? []),
            ],
            base,
            slug: article.slug,
            wordCount: article.wordCount ?? wordCount(article.content),
            faqCount: article.faqItems?.length ?? 0,
            hasReferences: /references|sources/i.test(article.content),
            hasCitations: /<a[^>]+href="https?:\/\//i.test(article.content),
          });
          if (aiResult?.aiOverviewTarget) {
            aiUsed = true;
            break;
          }
        } catch {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }

    // ── Build patch ───────────────────────────────────────────────────────
    const base = (siteConfig.url || 'https://calculatorfree.vercel.app').replace(/\/$/, '');
    const patch: Partial<Article> = {
      seoAudit,
      aiSeoOptimized: true,
      updatedAt: new Date().toISOString(),
    };

    if (aiResult) {
      patch.aiOverviewTarget = aiResult.aiOverviewTarget.trim().slice(0, 300);
      patch.semanticKeywords = aiResult.semanticKeywords.slice(0, 20);
      patch.entities = (aiResult.entities ?? []).slice(0, 10) as ArticleEntity[];
      patch.eeatSignals = aiResult.eeatSignals as EeatSignals;
      // Re-build enhanced Article schema with E-E-A-T signals
      patch.schemaArticle = buildEnhancedArticleSchema(
        article,
        base,
        aiResult.eeatSignals as EeatSignals,
      );
    }

    // Save to DB
    const idx = db.articles.findIndex((a) => a.id === id);
    db.articles[idx] = { ...db.articles[idx], ...patch };
    saveDb(db);

    return NextResponse.json({
      success: true,
      aiUsed,
      seoAudit,
      ...(aiResult
        ? {
            aiOverviewTarget: patch.aiOverviewTarget,
            semanticKeywords: patch.semanticKeywords,
            entities: patch.entities,
            eeatSignals: patch.eeatSignals,
            schemaArticle: patch.schemaArticle,
          }
        : {}),
    });
  } catch (err: unknown) {
    console.error('[ai-seo-optimize]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
