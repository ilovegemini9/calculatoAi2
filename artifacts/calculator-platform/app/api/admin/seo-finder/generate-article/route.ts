import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { CALCULATORS } from '@/config/calculators';
import type { Article } from '@/lib/types';

async function callOpenRouter(apiKey: string, model: string, messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://calculatorplatform.com',
      'X-Title': 'Professional Calculator Platform',
    },
    body: JSON.stringify({ model, messages }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${res.statusText}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}

function injectCalculatorLinks(html: string, primaryKeyword: string): string {
  const plainText = html.replace(/<[^>]+>/g, ' ').toLowerCase();
  const relevant = CALCULATORS.filter((c) => {
    const nameLower = c.name.toLowerCase();
    const shortLower = c.shortName.toLowerCase();
    return (
      plainText.includes(nameLower) ||
      plainText.includes(shortLower) ||
      c.keywords.some((kw) => plainText.includes(kw.toLowerCase()))
    );
  }).slice(0, 5);

  let result = html;
  for (const calc of relevant) {
    if (result.includes(`href="/${calc.slug}"`)) continue;
    const anchor = `<a href="/${calc.slug}" title="${calc.name}">${calc.name}</a>`;
    const nameEscaped = calc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<!['">/])\\b(${nameEscaped})\\b(?![^<]*>)`, 'i');
    const replaced = result.replace(regex, anchor);
    if (replaced !== result) {
      result = replaced;
    } else {
      result += `\n<p>Use our free <a href="/${calc.slug}" title="${calc.name}">${calc.name}</a> for instant, accurate results.</p>`;
    }
  }
  if (relevant.length === 0) {
    const kwLower = primaryKeyword.toLowerCase();
    const match = CALCULATORS.find(
      (c) => kwLower.includes(c.shortName.toLowerCase()) || c.keywords.some((k) => kwLower.includes(k.toLowerCase())),
    );
    if (match && !result.includes(`href="/${match.slug}"`)) {
      result += `\n<p>Try our free <a href="/${match.slug}" title="${match.name}">${match.name}</a> for instant, accurate results.</p>`;
    }
  }
  return result;
}

function buildFaqSchema(keyword: string, faqs: { q: string; a: string }[]): string {
  const items = faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  }));
  return JSON.stringify(
    { '@context': 'https://schema.org', '@type': 'FAQPage', name: keyword, mainEntity: items },
    null, 2,
  );
}

function buildArticleSchema(params: {
  title: string;
  description: string;
  slug: string;
  keywords: string[];
  wordCount: number;
}): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.title,
    description: params.description,
    keywords: params.keywords.join(', '),
    wordCount: params.wordCount,
    url: `https://calculatorplatform.com/blog/${params.slug}`,
    datePublished: new Date().toISOString().split('T')[0],
    dateModified: new Date().toISOString().split('T')[0],
    author: { '@type': 'Organization', name: 'Calculator Platform' },
    publisher: {
      '@type': 'Organization',
      name: 'Calculator Platform',
      url: 'https://calculatorplatform.com',
    },
  }, null, 2);
}

function buildHowToSchema(title: string, steps: string[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    step: steps.map((text, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text,
    })),
  }, null, 2);
}

function extractFaqPairs(html: string): { q: string; a: string }[] {
  const lines = html.replace(/<h2[^>]*>.*?FAQ.*?<\/h2>/i, '<!-- FAQ_START -->').split(/<!--\s*FAQ_START\s*-->/i);
  const faqPart = lines[1] ?? html;
  const qMatches = [...faqPart.matchAll(/<h3[^>]*>(.*?)<\/h3>/gi)];
  const pMatches = [...faqPart.matchAll(/<p[^>]*>(.*?)<\/p>/gi)];
  const pairs: { q: string; a: string }[] = [];
  for (let i = 0; i < Math.min(qMatches.length, 8); i++) {
    const q = qMatches[i][1].replace(/<[^>]+>/g, '').trim();
    const a = (pMatches[i]?.[1] ?? '').replace(/<[^>]+>/g, '').trim();
    if (q && a) pairs.push({ q, a });
  }
  return pairs.slice(0, 6);
}

function extractHowToSteps(html: string): string[] {
  const olMatch = html.match(/<ol[^>]*>([\s\S]*?)<\/ol>/i);
  if (!olMatch) return [];
  const liMatches = [...olMatch[1].matchAll(/<li[^>]*>(.*?)<\/li>/gi)];
  return liMatches.map((m) => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean).slice(0, 8);
}

function buildToc(html: string): string {
  const headings = [...html.matchAll(/<(h[23])[^>]*>(.*?)<\/h[23]>/gi)];
  if (headings.length < 3) return '';
  const items = headings.map((m, i) => {
    const level = m[1];
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    const id = `toc-${i}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
    const indent = level === 'h3' ? 'ml-4' : '';
    return `<li class="${indent}"><a href="#${id}" class="toc-link">${text}</a></li>`;
  });
  return `<nav class="toc-box" aria-label="Table of Contents">
<h2 class="toc-title">Table of Contents</h2>
<ol class="toc-list">
${items.join('\n')}
</ol>
</nav>`;
}

function addHeadingIds(html: string): string {
  let counter = 0;
  return html.replace(/<(h[23])([^>]*)>(.*?)<\/h[23]>/gi, (_, level, attrs, text) => {
    const cleanText = text.replace(/<[^>]+>/g, '').trim();
    const id = `toc-${counter++}-${cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
    return `<${level}${attrs} id="${id}">${text}</${level}>`;
  });
}

function calcReadingTime(html: string): number {
  const wordCount = html.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / 238));
}

export async function POST(req: Request) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const {
      keyword,
      primaryKeyword,
      secondaryKeywords,
      selectedTitle,
      intentAnalysis,
      outline,
      metaTitle,
      metaDescription,
      urlSlug: suggestedSlug,
      lockedKeywords = [],
    } = body as {
      keyword: string;
      primaryKeyword: string;
      secondaryKeywords: string[];
      selectedTitle: string;
      intentAnalysis: string;
      outline: { heading: string; level: string; subpoints: string[] }[];
      metaTitle: string;
      metaDescription: string;
      urlSlug?: string;
      lockedKeywords: string[];
    };

    if (!keyword?.trim()) return NextResponse.json({ error: 'keyword is required' }, { status: 400 });

    const db = getDb();
    const orKey =
      db.settings.openrouterApiKey ||
      process.env.OPENROUTER_API_KEY ||
      (process.env.OPENAI_API_KEY?.startsWith('sk-or-') ? process.env.OPENAI_API_KEY : undefined) ||
      '';
    if (!orKey) {
      return NextResponse.json(
        { error: 'No AI API key configured. Add your OpenRouter key in Platform Settings → AI Configuration.' },
        { status: 400 },
      );
    }

    const allKeywords = [...new Set([primaryKeyword, ...secondaryKeywords, ...lockedKeywords])];
    const calcContext = CALCULATORS.slice(0, 15).map((c) => `- ${c.name} (/${c.slug}): ${c.description.slice(0, 80)}`).join('\n');
    const outlineText = outline
      .map((item) => `${item.level === 'h2' ? '##' : '###'} ${item.heading}\n${item.subpoints?.map((sp) => `- ${sp}`).join('\n') ?? ''}`)
      .join('\n\n');

    const writerPrompt = `You are a professional copywriter writing for a high-authority finance/health/lifestyle calculator website.

Write a deeply engaging, authoritative, 100% human-sounding SEO article.

ARTICLE TITLE: ${selectedTitle}
TARGET KEYWORD: ${keyword}
PRIMARY KEYWORD: ${primaryKeyword}
LSI + LOCKED KEYWORDS (integrate naturally): ${allKeywords.join(', ')}
SEARCH INTENT: ${intentAnalysis}

CONTENT OUTLINE:
${outlineText}

INTERNAL CALCULATORS ON THIS SITE (embed 2-3 contextual links):
${calcContext}
To link: <a href="/[slug]">[Calculator Name]</a>

REQUIRED STRUCTURAL ELEMENTS:
1. Start with a Key Takeaways box:
   <div class="seo-summary-box"><h3>Key Takeaways</h3><ul><li>…</li><li>…</li><li>…</li></ul></div>

2. At least ONE comparison or data table using <table>, <thead>, <tbody>, <th>, <td> with real-world data.

3. At least ONE How-To section as an ordered list: <h2>How To…</h2><ol><li>Step 1</li>…</ol>

4. FAQ section: <h2>Frequently Asked Questions</h2> then <h3> for each question (4-6 pairs).

5. End with a References section:
   <h2>References & Further Reading</h2><ul><li><a href="…" rel="noopener noreferrer" target="_blank">Source Name</a> — short description</li>…</ul>
   (Use real, authoritative sources: gov sites, major publications, research bodies)

CRITICAL STYLE RULES:
- BANNED: "delve", "tapestry", "nestled", "testament", "moreover", "furthermore", "in conclusion", "in today's digital age", "unlock", "harness", "leverage", "it's worth noting"
- Varied sentence lengths — short punchy ones mixed with longer analytical ones.
- Seamlessly integrate LSI keywords. Never force them.
- Use clean HTML5: <h2>, <h3>, <p>, <strong>, <ul>, <li>, <table>. No <html>/<head>/<body> wrapper.
- Target 1,600–2,200 words.
- Start directly with the Key Takeaways box — no preamble.
- Be specific. Include real numbers, percentages, or examples where relevant.`;

    const articleModels = [
      'nvidia/nemotron-3-ultra-550b-a55b:free',
      'nvidia/nemotron-3-nano-30b-a3b:free',
      'google/gemma-4-31b-it:free',
    ];

    let content = '';
    let lastErr = '';
    for (const model of articleModels) {
      try {
        content = await callOpenRouter(orKey, model, [{ role: 'user', content: writerPrompt }]);
        if (content.trim()) break;
      } catch (e: unknown) {
        lastErr = e instanceof Error ? e.message : String(e);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    if (!content.trim()) throw new Error(`All article models failed. Last error: ${lastErr}`);

    // Clean up
    content = content.replace(/```html\s*/gi, '').replace(/```\s*/gi, '').trim();

    // Add heading IDs for TOC
    content = addHeadingIds(content);

    // Build TOC from headings
    const toc = buildToc(content);

    // Inject TOC after first paragraph
    if (toc) {
      const firstParaEnd = content.indexOf('</p>');
      if (firstParaEnd !== -1) {
        content = content.slice(0, firstParaEnd + 4) + '\n' + toc + content.slice(firstParaEnd + 4);
      } else {
        content = toc + '\n' + content;
      }
    }

    // Inject internal calculator links
    content = injectCalculatorLinks(content, primaryKeyword);

    // Extract structured data
    const faqPairs = extractFaqPairs(content);
    const howToSteps = extractHowToSteps(content);
    const wordCount = content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
    const readingTime = calcReadingTime(content);

    // Build slug
    const slug = (suggestedSlug?.trim()
      ? suggestedSlug.replace(/^\//, '').replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '')
      : (selectedTitle || keyword).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    );

    // Build all schema JSON-LD
    const faqSchema = faqPairs.length > 0 ? buildFaqSchema(keyword, faqPairs) : null;
    const articleSchema = buildArticleSchema({ title: selectedTitle || keyword, description: metaDescription, slug, keywords: allKeywords, wordCount });
    const howToSchema = howToSteps.length >= 3 ? buildHowToSchema(selectedTitle || keyword, howToSteps) : null;

    // Append schema scripts
    const schemaScripts = [
      `<script type="application/ld+json">\n${articleSchema}\n</script>`,
      faqSchema ? `<script type="application/ld+json">\n${faqSchema}\n</script>` : '',
      howToSchema ? `<script type="application/ld+json">\n${howToSchema}\n</script>` : '',
    ].filter(Boolean).join('\n');

    content = content + '\n' + schemaScripts;

    // Find most relevant calculator
    const primaryCalcSlug = CALCULATORS.find((c) =>
      c.keywords.some((k) => primaryKeyword.toLowerCase().includes(k.toLowerCase())),
    )?.slug ?? '';

    // OpenGraph data
    const ogData = {
      title: metaTitle || selectedTitle || keyword,
      description: metaDescription || content.replace(/<[^>]+>/g, '').slice(0, 155),
      url: `/blog/${slug}`,
      type: 'article',
    };

    // Save to DB
    const freshDb = getDb();
    const artId = `seo_${Date.now()}`;
    const newArticle: Article = {
      id: artId,
      calculatorId: primaryCalcSlug,
      slug,
      title: selectedTitle || keyword,
      content,
      status: 'draft', // Always starts as Draft
      seoData: {
        title: metaTitle || selectedTitle || keyword,
        description: metaDescription || content.replace(/<[^>]+>/g, '').slice(0, 150),
        keywords: allKeywords,
        canonicalUrl: `/blog/${slug}`,
      },
      version: 1,
      createdAt: new Date().toISOString(),
    };

    freshDb.articles.push(newArticle);
    if (!freshDb.articleVersions) freshDb.articleVersions = [];
    freshDb.articleVersions.push({
      id: `ver_${Date.now()}`,
      articleId: artId,
      content,
      createdAt: new Date().toISOString(),
    });
    saveDb(freshDb);

    return NextResponse.json({
      success: true,
      article: newArticle,
      meta: {
        wordCount,
        readingTime,
        faqCount: faqPairs.length,
        hasHowTo: howToSteps.length >= 3,
        hasToc: !!toc,
        schemaTypes: ['Article', faqPairs.length > 0 && 'FAQPage', howToSteps.length >= 3 && 'HowTo'].filter(Boolean),
        ogData,
      },
    });
  } catch (err: unknown) {
    console.error('[seo-finder/generate-article]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}
