import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { CALCULATORS } from '@/config/calculators';
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

// ── Auto-inject internal calculator links ─────────────────────────────────────
/**
 * Scan the article HTML and inject <a> links to relevant calculators.
 * Strategy:
 *   1. Build a set of calculators whose name or keywords appear in the article text (stripped of tags).
 *   2. For each matched calculator, replace the FIRST plain-text occurrence of the calculator's name
 *      with a hyperlink (skipping occurrences already inside an <a> tag).
 *   3. If no text match exists, append a "Related tool" paragraph at the end.
 */
function injectCalculatorLinks(html: string, primaryKeyword: string): string {
  const plainText = html.replace(/<[^>]+>/g, ' ').toLowerCase();

  // Find relevant calculators by keyword/name match
  const relevant = CALCULATORS.filter((c) => {
    const nameLower = c.name.toLowerCase();
    const shortLower = c.shortName.toLowerCase();
    // Match name, short name, or any of the calculator's keywords
    return (
      plainText.includes(nameLower) ||
      plainText.includes(shortLower) ||
      c.keywords.some((kw) => plainText.includes(kw.toLowerCase()))
    );
  }).slice(0, 5); // cap at 5 injected links to avoid over-linking

  let result = html;

  for (const calc of relevant) {
    // Skip if a link to this calculator is already present
    if (result.includes(`href="/${calc.slug}"`)) continue;

    // Build anchor
    const anchor = `<a href="/${calc.slug}" title="${calc.name}">${calc.name}</a>`;

    // Replace first plain-text occurrence of calc.name (outside existing tags)
    // Regex: calc name NOT inside an HTML tag, NOT already inside an <a>
    const nameEscaped = calc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<!['">/])\\b(${nameEscaped})\\b(?![^<]*>)`, 'i');
    const replaced = result.replace(regex, anchor);

    if (replaced !== result) {
      result = replaced;
    } else {
      // Append reference paragraph if name not found verbatim
      result += `\n<p>Use our free <a href="/${calc.slug}" title="${calc.name}">${calc.name}</a> for instant, accurate results.</p>`;
    }
  }

  // Always inject a link to the most relevant calculator based on primaryKeyword if none found yet
  if (relevant.length === 0) {
    const kwLower = primaryKeyword.toLowerCase();
    const match = CALCULATORS.find(
      (c) => kwLower.includes(c.shortName.toLowerCase()) || c.keywords.some((k) => kwLower.includes(k.toLowerCase())),
    );
    if (match && !result.includes(`href="/${match.slug}"`)) {
      result += `\n<p>Try our free <a href="/${match.slug}" title="${match.name}">${match.name}</a> to get instant results tailored to your numbers.</p>`;
    }
  }

  return result;
}

// ── Build FAQPage JSON-LD schema ──────────────────────────────────────────────
function buildFaqSchema(keyword: string, faqs: { q: string; a: string }[]): string {
  const items = faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  }));
  return `<script type="application/ld+json">\n${JSON.stringify(
    { '@context': 'https://schema.org', '@type': 'FAQPage', name: keyword, mainEntity: items },
    null,
    2,
  )}\n</script>`;
}

// ── Extract FAQ pairs from HTML content ───────────────────────────────────────
function extractFaqPairs(html: string): { q: string; a: string }[] {
  const faqSection = html.match(/<section[^>]*class="[^"]*faq[^"]*"[^>]*>([\s\S]*?)<\/section>/i)?.[1] ?? html;
  const questions: string[] = [];
  const answers: string[] = [];

  const qRegex = /<h[23][^>]*>(.*?)<\/h[23]>/gi;
  const pRegex = /<p[^>]*>(.*?)<\/p>/gi;

  let m;
  let inFaqSection = false;

  // Simple heuristic: pairs of h3+p after a "FAQ" heading
  const lines = html.replace(/<h2[^>]*>.*?FAQ.*?<\/h2>/i, '<!-- FAQ_START -->').split(/<!--\s*FAQ_START\s*-->/i);
  const faqPart = lines[1] ?? faqSection;

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

    // Build calculator context for internal link guidance
    const calcContext = CALCULATORS.slice(0, 15)
      .map((c) => `- ${c.name} (/${c.slug}): ${c.description.slice(0, 80)}`)
      .join('\n');

    // Build outline text
    const outlineText = outline
      .map(
        (item) =>
          `${item.level === 'h2' ? '##' : '###'} ${item.heading}\n${item.subpoints?.map((sp) => `- ${sp}`).join('\n') ?? ''}`,
      )
      .join('\n\n');

    const writerPrompt = `Act as a professional copywriter and journalist writing for a high-authority financial/health/lifestyle calculator website.

Write a deeply engaging, authoritative, 100% human-sounding SEO article based on this brief.

TARGET KEYWORD: ${keyword}
PRIMARY KEYWORD: ${primaryKeyword}
LSI KEYWORDS: ${secondaryKeywords.join(', ')}
TITLE TO USE: ${titles[0]}
SEARCH INTENT: ${intentAnalysis}

OUTLINE TO FOLLOW:
${outlineText}

INTERNAL CALCULATORS AVAILABLE ON THIS SITE (embed 2-3 contextual links where relevant):
${calcContext}
To link: use <a href="/[slug]">[Calculator Name]</a>

GOOGLE E-E-A-T & AI SEO REQUIREMENTS:
1. Start with a Key Takeaways summary box:
   <div class="seo-summary-box"><h3>Key Takeaways</h3><ul><li>…</li><li>…</li><li>…</li></ul></div>
2. Include at least ONE structured comparison or data table using <table>, <thead>, <tbody>, <th>, <td> with realistic data.
3. End with a FAQ section: use <h2>Frequently Asked Questions</h2> then <h3> for each question and <p> for each answer. Include 4-6 FAQ pairs covering common user questions about the topic.

CRITICAL STYLE RULES — ZERO TOLERANCE:
- BANNED words/phrases: "delve", "tapestry", "nestled", "testament", "moreover", "furthermore", "in conclusion", "in today's digital age", "unlock", "harness", "leverage", "it's worth noting", "it is important to note", "having said that", "that being said"
- Write like an expert human. Varied sentence lengths — short punchy ones mixed with longer analytical ones.
- Seamlessly integrate LSI keywords. Never force them.
- Use clean HTML5: <h2>, <h3>, <p>, <strong>, <ul>, <li>, <table>. No <html>/<head>/<body> wrapper.
- Target 1,400–2,000 words.
- Start directly with the Key Takeaways box — no preamble, no "Introduction:" heading.
- Be specific. Include real numbers, percentages, or examples where relevant.`;

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

    // Clean up markdown fences if any
    content = content.replace(/```html\s*/gi, '').replace(/```\s*/gi, '').trim();

    // Auto-inject internal calculator links
    content = injectCalculatorLinks(content, primaryKeyword);

    // Build and append FAQPage JSON-LD schema
    const faqPairs = extractFaqPairs(content);
    if (faqPairs.length > 0) {
      content = content + '\n' + buildFaqSchema(keyword, faqPairs);
    }

    // Build slug from the first title
    const slug = (titles[0] || keyword)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Find most relevant calculator to link as primary
    const primaryCalcSlug =
      CALCULATORS.find((c) =>
        c.keywords.some((k) => primaryKeyword.toLowerCase().includes(k.toLowerCase())),
      )?.slug ?? '';

    // Save to DB
    const freshDb = getDb();
    const artId = `seo_${Date.now()}`;
    const newArticle: Article = {
      id: artId,
      calculatorId: primaryCalcSlug,
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
