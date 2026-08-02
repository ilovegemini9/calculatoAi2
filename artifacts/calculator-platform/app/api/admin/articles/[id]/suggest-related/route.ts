export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { getAiProviderKey, getAiSettings, getProviderModels } from '@/lib/ai';
import { siteConfig } from '@/config/site';
import type {
  Calculator,
  Article,
  SuggestedCalculator,
  RelatedArticle,
  InternalLinkSuggestion,
} from '@/lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Build a normalized bag of words from a string, removing stop-words */
function tokenize(text: string): Set<string> {
  const STOP = new Set([
    'a','an','the','and','or','of','to','in','is','it','this','that','are',
    'was','for','on','with','as','by','at','from','be','has','had','have',
    'do','did','not','but','what','which','who','when','how','all','each',
    'if','so','can','will','use','used','using','more','one','also',
  ]);
  return new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(
      (w) => w.length > 2 && !STOP.has(w),
    ),
  );
}

/**
 * Score a calculator against the article using simple token overlap.
 * Returns 0–1 (higher = more relevant).
 */
function scoreCalculator(calc: Calculator, articleTokens: Set<string>): number {
  const calcText = [
    calc.name,
    calc.category,
    calc.metadata.title,
    calc.metadata.description,
    calc.metadata.shortDescription ?? '',
    (calc.metadata.keywords ?? []).join(' '),
  ].join(' ');
  const calcTokens = tokenize(calcText);
  let matches = 0;
  for (const t of calcTokens) if (articleTokens.has(t)) matches++;
  const union = new Set([...calcTokens, ...articleTokens]).size;
  return union === 0 ? 0 : matches / union;
}

/**
 * Score another article against the current article.
 */
function scoreArticle(other: Article, articleTokens: Set<string>): number {
  const otherText = [
    other.title,
    other.seoData?.title ?? '',
    (other.seoData?.keywords ?? []).join(' '),
    (other.relatedKeywords ?? []).join(' '),
    stripHtml(other.content).slice(0, 600),
  ].join(' ');
  const otherTokens = tokenize(otherText);
  let matches = 0;
  for (const t of otherTokens) if (articleTokens.has(t)) matches++;
  const union = new Set([...otherTokens, ...articleTokens]).size;
  return union === 0 ? 0 : matches / union;
}

// ─── AI Enrichment ────────────────────────────────────────────────────────────

interface AiRelatedResult {
  suggestedCalculatorId: string | null;
  relatedArticleIds: string[];
  internalLinkSuggestions: {
    anchorText: string;
    targetSlug: string;
    targetTitle: string;
    targetType: 'calculator' | 'article';
  }[];
}

async function callAiForRelated(
  apiKey: string,
  model: string,
  article: { title: string; contentSnippet: string; keywords: string[] },
  calculatorCandidates: { id: string; name: string; slug: string; description: string; score: number }[],
  articleCandidates: { id: string; title: string; slug: string; score: number }[],
): Promise<AiRelatedResult | null> {
  const calcList = calculatorCandidates
    .map((c) => `- id:${c.id} name:"${c.name}" slug:${c.slug} desc:"${c.description.slice(0, 80)}"`)
    .join('\n');
  const artList = articleCandidates
    .map((a) => `- id:${a.id} title:"${a.title}" slug:${a.slug}`)
    .join('\n');

  const prompt = `You are an internal-linking strategist for a calculator and finance content site.

ARTICLE:
Title: ${article.title}
Keywords: ${article.keywords.join(', ')}
Content snippet: ${article.contentSnippet}

CALCULATOR CANDIDATES (already pre-ranked by keyword overlap):
${calcList || '(none)'}

ARTICLE CANDIDATES (already pre-ranked by keyword overlap):
${artList || '(none)'}

TASK:
1. Pick the SINGLE best calculator that a reader of this article would genuinely want to use next. If none are relevant, set suggestedCalculatorId to null.
2. Pick up to 3 related articles the reader might also find useful.
3. Generate up to 5 internal link suggestions — short anchor texts with the target slug and whether it goes to a calculator or article. These are phrases an editor could search for in the article body and hyperlink.

Return ONLY valid JSON (no markdown, no explanation):
{
  "suggestedCalculatorId": "<id or null>",
  "relatedArticleIds": ["<id>", ...],
  "internalLinkSuggestions": [
    { "anchorText": "...", "targetSlug": "...", "targetTitle": "...", "targetType": "calculator|article" }
  ]
}`;

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
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${res.statusText}`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content ?? '';
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try {
    return JSON.parse(jsonStr) as AiRelatedResult;
  } catch {
    return null;
  }
}

// ─── Keyword-only fallback (no AI) ────────────────────────────────────────────

function buildRelatedByKeywords(
  article: Article,
  calculators: Calculator[],
  otherArticles: Article[],
): {
  suggestedCalculator: SuggestedCalculator | null;
  relatedArticles: RelatedArticle[];
  internalLinkSuggestions: InternalLinkSuggestion[];
} {
  const articleText = [
    article.title,
    (article.seoData?.keywords ?? []).join(' '),
    (article.relatedKeywords ?? []).join(' '),
    stripHtml(article.content).slice(0, 800),
  ].join(' ');
  const articleTokens = tokenize(articleText);

  // Score and pick best calculator
  const scoredCalcs = calculators
    .filter((c) => c.status === 'active')
    .map((c) => ({ calc: c, score: scoreCalculator(c, articleTokens) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const bestCalc = scoredCalcs[0]?.calc ?? null;
  const suggestedCalculator: SuggestedCalculator | null = bestCalc
    ? {
        calculatorId: bestCalc.id,
        slug: bestCalc.slug,
        name: bestCalc.name,
        description: bestCalc.metadata.shortDescription || bestCalc.metadata.description || '',
        category: bestCalc.category,
      }
    : null;

  // Score and pick related articles (top 3)
  const scoredArticles = otherArticles
    .filter((a) => a.status === 'published')
    .map((a) => ({ art: a, score: scoreArticle(a, articleTokens) }))
    .filter((x) => x.score > 0.02)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const relatedArticles: RelatedArticle[] = scoredArticles.map(({ art }) => ({
    articleId: art.id,
    slug: art.slug,
    title: art.title,
    description: art.seoData?.description || '',
  }));

  // Generate internal link suggestions from top calculator + articles
  const internalLinkSuggestions: InternalLinkSuggestion[] = [];

  if (bestCalc) {
    internalLinkSuggestions.push({
      anchorText: bestCalc.name,
      targetSlug: `/${bestCalc.slug}`,
      targetTitle: bestCalc.name,
      targetType: 'calculator',
    });
    // Add a short keyword variant if description exists
    const descWords = (bestCalc.metadata.shortDescription || bestCalc.metadata.description || '')
      .split(' ')
      .slice(0, 5)
      .join(' ');
    if (descWords && descWords !== bestCalc.name) {
      internalLinkSuggestions.push({
        anchorText: descWords,
        targetSlug: `/${bestCalc.slug}`,
        targetTitle: bestCalc.name,
        targetType: 'calculator',
      });
    }
  }

  for (const { art } of scoredArticles.slice(0, 3)) {
    internalLinkSuggestions.push({
      anchorText: art.title,
      targetSlug: `/blog/${art.slug}`,
      targetTitle: art.title,
      targetType: 'article',
    });
  }

  return { suggestedCalculator, relatedArticles, internalLinkSuggestions };
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

    const otherArticles = db.articles.filter((a) => a.id !== id);
    const calculators = db.calculators;

    // ── Keyword scoring for pre-ranking ──────────────────────────────────────
    const articleText = [
      article.title,
      (article.seoData?.keywords ?? []).join(' '),
      (article.relatedKeywords ?? []).join(' '),
      stripHtml(article.content).slice(0, 800),
    ].join(' ');
    const articleTokens = tokenize(articleText);

    const calcCandidates = calculators
      .filter((c) => c.status === 'active')
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.metadata.shortDescription || c.metadata.description || '',
        score: scoreCalculator(c, articleTokens),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // top 10 for AI prompt

    const artCandidates = otherArticles
      .filter((a) => a.status === 'published')
      .map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        score: scoreArticle(a, articleTokens),
      }))
      .filter((x) => x.score > 0.01)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // ── Try AI enrichment ─────────────────────────────────────────────────────
    const orKey =
      getAiProviderKey(
        getAiSettings(db.settings.ai, db.settings.openrouterApiKey),
        'openrouter',
      ) || process.env.OPENROUTER_API_KEY || '';

    let aiUsed = false;
    let result: {
      suggestedCalculator: SuggestedCalculator | null;
      relatedArticles: RelatedArticle[];
      internalLinkSuggestions: InternalLinkSuggestion[];
    } | null = null;

    if (orKey && (calcCandidates.length > 0 || artCandidates.length > 0)) {
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

      const contentSnippet = stripHtml(article.content).slice(0, 400);
      const keywords = [
        ...(article.seoData?.keywords ?? []),
        ...(article.relatedKeywords ?? []),
      ].slice(0, 8);

      for (const model of models) {
        try {
          const aiResult = await callAiForRelated(
            orKey,
            model,
            { title: article.title, contentSnippet, keywords },
            calcCandidates,
            artCandidates,
          );

          if (aiResult) {
            // Resolve IDs back to full objects
            const pickedCalc = aiResult.suggestedCalculatorId
              ? calculators.find((c) => c.id === aiResult.suggestedCalculatorId) ?? null
              : null;

            const suggestedCalculator: SuggestedCalculator | null = pickedCalc
              ? {
                  calculatorId: pickedCalc.id,
                  slug: pickedCalc.slug,
                  name: pickedCalc.name,
                  description:
                    pickedCalc.metadata.shortDescription ||
                    pickedCalc.metadata.description ||
                    '',
                  category: pickedCalc.category,
                }
              : null;

            const relatedArticles: RelatedArticle[] = (aiResult.relatedArticleIds ?? [])
              .map((aid) => db.articles.find((a) => a.id === aid))
              .filter((a): a is Article => Boolean(a))
              .map((a) => ({
                articleId: a.id,
                slug: a.slug,
                title: a.title,
                description: a.seoData?.description || '',
              }));

            // Validate internal link suggestions — ensure slugs are plausible
            const internalLinkSuggestions: InternalLinkSuggestion[] = (
              aiResult.internalLinkSuggestions ?? []
            )
              .filter(
                (s) =>
                  s.anchorText && s.targetSlug && s.targetTitle && s.targetType,
              )
              .slice(0, 5);

            result = { suggestedCalculator, relatedArticles, internalLinkSuggestions };
            aiUsed = true;
            break;
          }
        } catch {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }

    // ── Fallback: keyword-only ────────────────────────────────────────────────
    if (!result) {
      result = buildRelatedByKeywords(article, calculators, otherArticles);
    }

    return NextResponse.json({ success: true, aiUsed, ...result });
  } catch (err: unknown) {
    console.error('[suggest-related]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
