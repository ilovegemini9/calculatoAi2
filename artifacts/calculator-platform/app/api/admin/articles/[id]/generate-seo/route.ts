import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { getAiProviderKey, getAiSettings, getProviderModels } from '@/lib/ai';
import { siteConfig } from '@/config/site';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function calcWordCount(html: string): number {
  return stripHtml(html).split(/\s+/).filter(Boolean).length;
}

function calcReadingTime(html: string): number {
  return Math.max(1, Math.round(calcWordCount(html) / 238));
}

function extractHeadingHierarchy(
  html: string,
): { level: 'h2' | 'h3'; text: string; id: string }[] {
  const matches = [
    ...html.matchAll(/<(h[23])[^>]*(?:id="([^"]*)")?[^>]*>(.*?)<\/h[23]>/gi),
  ];
  return matches.map((m) => ({
    level: m[1].toLowerCase() as 'h2' | 'h3',
    text: m[3].replace(/<[^>]+>/g, '').trim(),
    id: m[2] ?? '',
  }));
}

function extractToc(html: string): string {
  const match = html.match(/<nav[^>]*class="[^"]*toc-box[^"]*"[^>]*>[\s\S]*?<\/nav>/i);
  return match?.[0] ?? '';
}

function buildBreadcrumbSchema(
  base: string,
  articleTitle: string,
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${base}/blog` },
      { '@type': 'ListItem', position: 3, name: articleTitle },
    ],
  };
}

function buildArticleSchema(params: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  wordCount: number;
  keywords: string[];
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.title,
    description: params.description,
    url: params.url,
    datePublished: params.datePublished,
    dateModified: params.dateModified,
    wordCount: params.wordCount,
    keywords: params.keywords.join(', '),
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    author: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/icon-512.png`,
        width: 512,
        height: 512,
      },
    },
  };
}

function buildFaqSchema(items: { q: string; a: string }[]): object | null {
  if (!items || items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

async function callOpenRouterForSeo(
  apiKey: string,
  model: string,
  title: string,
  focusKeyword: string,
  metaDescriptionHint: string,
): Promise<{
  seoTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
} | null> {
  const prompt = `You are an expert SEO copywriter. Generate optimized meta tags for this article.

ARTICLE TITLE: ${title}
FOCUS KEYWORD: ${focusKeyword}
CONTENT SUMMARY (first 400 chars): ${metaDescriptionHint.slice(0, 400)}

Return ONLY valid JSON (no markdown, no explanation):
{
  "seoTitle": "55-60 char SEO title starting with focus keyword, compelling and click-worthy",
  "metaDescription": "140-155 char meta description including focus keyword early, with a clear value proposition and implicit CTA",
  "ogTitle": "60-80 char social share title, slightly more engaging/emotional than SEO title",
  "ogDescription": "100-125 char OpenGraph description for social sharing, benefit-focused"
}

RULES:
- seoTitle: 55-60 characters, focus keyword near the start
- metaDescription: 140-155 characters exactly, no truncation, includes "${focusKeyword}"
- ogTitle: 60-80 characters, engaging for social shares
- ogDescription: 100-125 characters, conversational, benefit-driven
- No banned phrases: "delve", "tapestry", "unlock", "harness", "leverage", "in today's world"
- Be specific and concrete, not generic`;

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
      temperature: 0.4,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${res.statusText}`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content ?? '';
  // Strip markdown code fences if present
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try {
    return JSON.parse(jsonStr) as {
      seoTitle: string;
      metaDescription: string;
      ogTitle: string;
      ogDescription: string;
    };
  } catch {
    return null;
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: Params) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const body = (await req.json()) as { focusKeyword?: string };

    const db = getDb();
    const article = db.articles.find((a) => a.id === id);
    if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

    const focusKeyword =
      body.focusKeyword?.trim() ||
      article.keywordData?.keyword ||
      article.seoData?.keywords?.[0] ||
      article.title;

    // ── Computed fields (no AI needed) ────────────────────────────────────────
    const base = (siteConfig.url || 'https://calculatorfree.vercel.app').replace(/\/$/, '');
    const slug = article.slug;
    const canonicalUrl = `/blog/${slug}`;
    const articleUrl = `${base}/blog/${slug}`;
    const wordCount = calcWordCount(article.content);
    const readingTime = calcReadingTime(article.content);
    const toc = extractToc(article.content);
    const headingHierarchy = extractHeadingHierarchy(article.content);
    const h1 = article.title;
    const publishedDate = article.createdAt;
    const modifiedDate = article.updatedAt || article.createdAt;
    const allKeywords = [
      focusKeyword,
      ...(article.seoData?.keywords ?? []),
      ...(article.relatedKeywords ?? []),
    ].filter((v, i, a) => v && a.indexOf(v) === i);

    // ── Schemas (computed) ────────────────────────────────────────────────────
    const contentText = stripHtml(article.content);
    const descriptionHint =
      article.seoData?.description || contentText.slice(0, 200);

    const articleSchemaObj = buildArticleSchema({
      title: article.seoData?.title || article.title,
      description: descriptionHint,
      url: articleUrl,
      datePublished: publishedDate,
      dateModified: modifiedDate,
      wordCount,
      keywords: allKeywords,
    });

    const faqItems = article.faqItems ?? [];
    const faqSchemaObj = buildFaqSchema(faqItems);

    const breadcrumbSchemaObj = buildBreadcrumbSchema(base, article.title);

    // ── AI-generated fields ───────────────────────────────────────────────────
    const orKey =
      getAiProviderKey(
        getAiSettings(db.settings.ai, db.settings.openrouterApiKey),
        'openrouter',
      ) ||
      process.env.OPENROUTER_API_KEY ||
      '';

    let aiResult: {
      seoTitle: string;
      metaDescription: string;
      ogTitle: string;
      ogDescription: string;
    } | null = null;

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

      for (const model of models) {
        try {
          aiResult = await callOpenRouterForSeo(
            orKey,
            model,
            article.title,
            focusKeyword,
            contentText,
          );
          if (aiResult?.seoTitle && aiResult?.metaDescription) break;
        } catch {
          // try next model
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }

    // Fallback: derive from existing data if AI unavailable
    if (!aiResult) {
      const fallbackTitle = `${focusKeyword.charAt(0).toUpperCase() + focusKeyword.slice(1)}: ${article.title}`.slice(0, 60);
      const fallbackDesc = descriptionHint.slice(0, 155).replace(/\s\S*$/, '');
      aiResult = {
        seoTitle: fallbackTitle,
        metaDescription: fallbackDesc,
        ogTitle: article.title.slice(0, 80),
        ogDescription: descriptionHint.slice(0, 125).replace(/\s\S*$/, ''),
      };
    }

    // ── Build response package ─────────────────────────────────────────────────
    const seoPackage = {
      // Core meta
      seoTitle: aiResult.seoTitle,
      metaTitle: `${aiResult.seoTitle} | ${siteConfig.name}`,
      metaDescription: aiResult.metaDescription,
      canonicalUrl,
      // Social
      ogTitle: aiResult.ogTitle,
      ogDescription: aiResult.ogDescription,
      ogImage: `${base}/og-image.png`,
      twitterCard: 'summary_large_image' as const,
      // Structured data
      schemaArticle: JSON.stringify(articleSchemaObj, null, 2),
      schemaFaq: faqSchemaObj ? JSON.stringify(faqSchemaObj, null, 2) : null,
      schemaBreadcrumb: JSON.stringify(breadcrumbSchemaObj, null, 2),
      schemaHowTo: article.schemaHowTo ?? null,
      // Content structure
      readingTime,
      wordCount,
      lastUpdated: modifiedDate,
      tableOfContents: toc,
      h1,
      headingHierarchy,
      // Meta
      focusKeyword,
      aiUsed: !!orKey,
    };

    return NextResponse.json({ success: true, seo: seoPackage });
  } catch (err: unknown) {
    console.error('[generate-seo]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
