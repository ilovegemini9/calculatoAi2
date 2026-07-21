import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { verifySession } from '@/lib/session';
import type { Article } from '@/lib/types';

// ── OpenRouter helper ─────────────────────────────────────────────────────────
async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://calculatorplatform.com',
      'X-Title': 'Professional Calculator Platform',
    },
    body: JSON.stringify({ model, messages }),
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${res.statusText}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const {
      keyword,
      primaryKeyword,
      secondaryKeywords,
      titles,
      intentAnalysis,
      outline,
      metaTitle,
      metaDescription,
    } = body as {
      keyword: string;
      primaryKeyword: string;
      secondaryKeywords: string[];
      titles: string[];
      intentAnalysis: string;
      outline: { heading: string; level: string; subpoints: string[] }[];
      metaTitle: string;
      metaDescription: string;
    };

    if (!keyword?.trim()) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    const db = getDb();
    const orKey = db.settings.openrouterApiKey;
    if (!orKey) {
      return NextResponse.json(
        { error: 'OpenRouter API Key is not configured. Add it in Platform Settings.' },
        { status: 400 },
      );
    }

    // Build a rich writer prompt from the SEO brief
    const outlineText = outline
      .map(
        (item) =>
          `${item.level === 'h2' ? '##' : '###'} ${item.heading}\n${item.subpoints?.map((sp) => `- ${sp}`).join('\n') ?? ''}`,
      )
      .join('\n\n');

    const writerPrompt = `Act as a professional copywriter and journalist. Write a deeply engaging, authoritative article based on this SEO brief.

TARGET KEYWORD: ${keyword}
PRIMARY KEYWORD: ${primaryKeyword}
LSI KEYWORDS: ${secondaryKeywords.join(', ')}
TITLE TO USE: ${titles[0]}
SEARCH INTENT: ${intentAnalysis}

OUTLINE TO FOLLOW:
${outlineText}

CRITICAL STYLE RULES:
- Write like an expert human author. NO robotic structures.
- BANNED words/phrases: "In today's digital age", "delve", "tapestry", "nestled", "testament", "moreover", "furthermore".
- Use varied sentence lengths. Short punchy sentences. Longer analytical ones. Mix both naturally.
- Seamlessly integrate the LSI keywords — never force them.
- Write in clean HTML5: <h2>, <h3>, <p>, <strong>, <ul>, <li>. No <html>/<head>/<body> wrapper.
- Target 1200–1800 words. Include at least one practical example and a FAQ section.
- Add a "Key Takeaways" box at the top: <div class="seo-summary-box"><h3>Key Takeaways</h3><ul>...</ul></div>
- Start with the Key Takeaways box, then directly into the article. No preamble.`;

    // Try article-focused models in order (google/gemma-4-31b primary per spec)
    const articleModels = [
      'google/gemma-4-31b-it:free',
      'google/gemma-4-26b-a4b:free',
      'nvidia/nemotron-3-ultra-550b-a55b:free',
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

    if (!content.trim()) {
      throw new Error(`All article models failed. Last error: ${lastErr}`);
    }

    // Clean up any leftover markdown fences
    content = content.replace(/```html\s*/gi, '').replace(/```\s*/gi, '').trim();

    // Build slug from the first title
    const slug = (titles[0] || keyword)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Save to DB
    const freshDb = getDb();
    const artId = `seo_${Date.now()}`;
    const newArticle: Article = {
      id: artId,
      calculatorId: '',
      slug,
      title: titles[0] || keyword,
      content,
      status: 'pending_review',
      seoData: {
        title: metaTitle || titles[0] || keyword,
        description: metaDescription || content.replace(/<[^>]+>/g, '').slice(0, 150),
        keywords: [primaryKeyword, ...secondaryKeywords],
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

    return NextResponse.json({ success: true, article: newArticle });
  } catch (err: unknown) {
    console.error('[seo-finder/generate-article]', err);
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
