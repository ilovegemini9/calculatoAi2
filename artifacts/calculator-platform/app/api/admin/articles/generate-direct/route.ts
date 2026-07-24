import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { CALCULATORS } from '@/config/calculators';
import type { Article } from '@/lib/types';
import { getAiProviderKey, getAiSettings, getProviderModels } from '@/lib/ai';

// ─── OpenRouter helper ────────────────────────────────────────────────────────

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
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${res.statusText}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── Schema builders ──────────────────────────────────────────────────────────

function buildFaqSchema(keyword: string, faqs: { q: string; a: string }[]): string {
  const items = faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  }));
  return JSON.stringify(
    { '@context': 'https://schema.org', '@type': 'FAQPage', name: keyword, mainEntity: items },
    null,
    2,
  );
}

function buildArticleSchema(params: {
  title: string;
  description: string;
  slug: string;
  keywords: string[];
  wordCount: number;
}): string {
  return JSON.stringify(
    {
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
    },
    null,
    2,
  );
}

function buildHowToSchema(title: string, steps: string[]): string {
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: title,
      step: steps.map((text, i) => ({ '@type': 'HowToStep', position: i + 1, text })),
    },
    null,
    2,
  );
}

// ─── Content processors ───────────────────────────────────────────────────────

function extractFaqPairs(html: string): { q: string; a: string }[] {
  const faqStart = html.replace(/<h2[^>]*>.*?FAQ.*?<\/h2>/i, '<!-- FAQ_START -->');
  const parts = faqStart.split(/<!--\s*FAQ_START\s*-->/i);
  const faqPart = parts[1] ?? html;
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
  return liMatches
    .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean)
    .slice(0, 8);
}

function addHeadingIds(html: string): string {
  let counter = 0;
  return html.replace(/<(h[23])([^>]*)>(.*?)<\/h[23]>/gi, (_, level, attrs, text) => {
    const cleanText = text.replace(/<[^>]+>/g, '').trim();
    const id = `toc-${counter++}-${cleanText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}`;
    return `<${level}${attrs} id="${id}">${text}</${level}>`;
  });
}

function buildToc(html: string): string {
  const headings = [...html.matchAll(/<(h[23])[^>]*id="([^"]+)"[^>]*>(.*?)<\/h[23]>/gi)];
  if (headings.length < 3) return '';
  const items = headings.map((m) => {
    const level = m[1];
    const id = m[2];
    const text = m[3].replace(/<[^>]+>/g, '').trim();
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

function calcReadingTime(html: string): number {
  const wordCount = html
    .replace(/<[^>]+>/g, '')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / 238));
}

function calcWordCount(html: string): number {
  return html
    .replace(/<[^>]+>/g, '')
    .split(/\s+/)
    .filter(Boolean).length;
}

// ─── Smart calculator matcher ─────────────────────────────────────────────────
// Returns the single most relevant calculator for the article, or null.
// Only returns a match when relevance is genuinely high — never forces a link.

interface CalcMatch {
  slug: string;
  name: string;
  description: string;
  score: number;
}

function findBestCalculatorMatch(
  title: string,
  keyword: string,
  articleHtml: string,
): CalcMatch | null {
  const plainText = articleHtml.replace(/<[^>]+>/g, ' ').toLowerCase();
  const titleLower = title.toLowerCase();
  const kwLower = keyword.toLowerCase();

  const scored = CALCULATORS.map((c) => {
    let score = 0;
    const nameLower = c.name.toLowerCase();
    const shortLower = c.shortName.toLowerCase();
    const descLower = c.description.toLowerCase();

    // Title / keyword exact name match (strongest signal)
    if (titleLower.includes(shortLower) || kwLower.includes(shortLower)) score += 60;
    if (titleLower.includes(nameLower) || kwLower.includes(nameLower)) score += 50;

    // Keyword-to-calculator keyword overlap
    for (const ck of c.keywords) {
      const ckLower = ck.toLowerCase();
      if (kwLower.includes(ckLower) || ckLower.includes(kwLower)) score += 40;
      if (titleLower.includes(ckLower)) score += 20;
    }

    // Article body mentions
    if (plainText.includes(shortLower)) score += 15;
    if (plainText.includes(nameLower)) score += 10;
    for (const ck of c.keywords) {
      if (plainText.includes(ck.toLowerCase())) score += 5;
    }

    // Description keyword overlap
    const kwWords = kwLower.split(/\s+/);
    for (const w of kwWords) {
      if (w.length > 3 && descLower.includes(w)) score += 3;
    }

    return { slug: c.slug, name: c.name, description: c.description, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  // Minimum threshold — don't add a link unless it's genuinely relevant
  if (!best || best.score < 30) return null;

  return best;
}

// ─── Inject ONE natural calculator link into article body ─────────────────────
// Finds the first natural mention of the calculator name in the text,
// wraps it in an anchor. Falls back to appending a sentence only if the
// match score is very high (≥ 60) — otherwise skips the inline link
// and relies solely on the Related Calculator section.

function injectOneCalculatorLink(html: string, match: CalcMatch): string {
  const href = `/${match.slug}`;
  // Skip if already linked
  if (html.includes(`href="${href}"`)) return html;

  const shortName = match.name.replace(' Calculator', '');
  const anchor = `<a href="${href}" title="${match.name}">${match.name}</a>`;

  // Try to find a natural mention of the calculator's short name or full name
  const patterns = [
    new RegExp(`(?<!['">/])\\b(${match.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b(?![^<]*>)`, 'i'),
    new RegExp(`(?<!['">/])\\b(${shortName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b(?![^<]*>)`, 'i'),
  ];

  for (const regex of patterns) {
    const replaced = html.replace(regex, anchor);
    if (replaced !== html) return replaced;
  }

  // No natural mention found — only append if very strong match
  if (match.score >= 60) {
    return (
      html +
      `\n<p>To get accurate numbers fast, try our free <a href="${href}" title="${match.name}">${match.name}</a>.</p>`
    );
  }

  return html;
}

// ─── Build Related Calculator section ─────────────────────────────────────────

function buildRelatedCalculatorSection(match: CalcMatch): string {
  return `
<div class="related-calculator-box" style="margin:2rem 0;padding:1.25rem 1.5rem;border:1px solid var(--border,#e5e7eb);border-radius:0.75rem;background:var(--bg-card,#f9fafb);">
  <p style="margin:0 0 0.5rem;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted,#6b7280);">Related Tool</p>
  <h3 style="margin:0 0 0.5rem;font-size:1rem;font-weight:700;">
    <a href="/${match.slug}" title="${match.name}" style="color:inherit;text-decoration:none;">${match.name}</a>
  </h3>
  <p style="margin:0 0 1rem;font-size:0.875rem;color:var(--text-secondary,#374151);">${match.description.slice(0, 120)}${match.description.length > 120 ? '…' : ''}</p>
  <a href="/${match.slug}" style="display:inline-flex;align-items:center;gap:0.375rem;padding:0.5rem 1rem;background:#3b82f6;color:#fff;border-radius:0.5rem;font-size:0.875rem;font-weight:600;text-decoration:none;">
    Use ${match.name} →
  </a>
</div>`;
}

// ─── Insert Related Calculator section before Conclusion / FAQ / References ───

function insertRelatedCalculatorSection(html: string, match: CalcMatch): string {
  const section = buildRelatedCalculatorSection(match);

  // Try to insert before the last H2 (typically Conclusion, FAQ, or References)
  const h2Matches = [...html.matchAll(/<h2[^>]*>/gi)];
  if (h2Matches.length >= 2) {
    // Use the second-to-last h2 as the insertion point
    const targetMatch = h2Matches[h2Matches.length - 2];
    const insertAt = targetMatch.index!;
    return html.slice(0, insertAt) + section + '\n' + html.slice(insertAt);
  }

  // Fallback: insert before FAQ section or at end
  const faqIdx = html.search(/<h2[^>]*>.*?(?:FAQ|Frequently)/i);
  if (faqIdx !== -1) {
    return html.slice(0, faqIdx) + section + '\n' + html.slice(faqIdx);
  }

  return html + '\n' + section;
}

// ─── Phase 5 writer prompt ────────────────────────────────────────────────────

function buildPhase5Prompt(
  title: string,
  keyword: string,
  slug: string,
  hasCalculator: boolean,
  calcContext: string,
): string {
  const calcInstructions = hasCalculator
    ? `INTERNAL TOOL ON THIS SITE (include ONE natural link where genuinely helpful):
${calcContext}
Link format: <a href="/[slug]">[Calculator Name]</a>
Only link once. Only if contextually natural. Never force it.`
    : `This article has no directly related calculator. Do NOT add calculator links. Focus entirely on helping the reader.`;

  return `You are a subject-matter expert writing a long-form article. You have real-world experience with this topic. Write naturally — the way a knowledgeable person would explain it to a friend who asked a serious question.

TITLE: ${title}
FOCUS KEYWORD: ${keyword}
URL SLUG: ${slug}

═══════════════════════════════════════
CONTENT RULES — READ EVERY LINE
═══════════════════════════════════════

VOICE & TONE
- Write like a real person who knows this deeply. Not a content agency. Not a bot.
- Use "you" to address the reader directly. Be conversational but authoritative.
- Vary your sentence rhythm: some short. Others build with nuance and qualify carefully.
- Occasional sentence fragments are fine. Experts use them.
- Use contractions (you'll, it's, that's, don't). Formal = robotic.

BANNED WORDS & PHRASES — never use these
- "delve", "tapestry", "nestled", "testament to", "nuanced", "landscape"
- "moreover", "furthermore", "additionally" (as sentence starters)
- "in today's world", "in today's fast-paced", "in the digital age"
- "it's important to note", "it's worth noting", "it's crucial to"
- "comprehensive guide", "ultimate guide", "deep dive"
- "unlock", "harness", "leverage" (as metaphors)
- "let's explore", "let's dive in", "let's get started"
- "in conclusion", "to summarize", "to wrap up"
- "as an AI language model" or anything meta

STRUCTURE REQUIREMENTS

1. Open with a Key Takeaways box (do not start with a paragraph first):
   <div class="seo-summary-box"><h3>Key Takeaways</h3><ul><li>…</li><li>…</li><li>…</li><li>…</li></ul></div>

2. First paragraph after the box: a strong hook. Make the reader feel the problem or opportunity. Real stat, counterintuitive truth, or vivid scenario. No generic setup.

3. Use H2 headings for major sections. H3 for sub-points. 4-6 H2 sections total.

4. Include at least ONE real data table with actual numbers:
   <table><thead><tr><th>…</th></tr></thead><tbody><tr><td>…</td></tr></tbody></table>

5. One How-To section with numbered steps (when applicable):
   <h2>How to…</h2><ol><li>…</li></ol>

6. FAQ section with 4-5 specific, real questions readers have:
   <h2>Frequently Asked Questions</h2><h3>Question?</h3><p>Answer.</p>

7. References section at the end with real authoritative sources:
   <h2>Sources</h2><ul><li><a href="…" rel="noopener noreferrer" target="_blank">Source</a> — what it covers</li></ul>

SEO RULES
- Use the focus keyword "${keyword}" naturally — in the first 100 words, in one H2, and 3-4 times in the body max.
- Don't repeat it robotically. Use natural variations and related phrases.
- Be specific: real numbers, real percentages, real examples. Vague content fails Google's helpful content check.
- Answer the actual question a real person would type into Google. Don't dance around it.

CONTENT QUALITY
- Solve the reader's problem completely. If someone reads this and still needs to Google something basic, you failed.
- Use concrete examples. "For example, if your salary is $65,000…" beats "for example, with a typical salary."
- Include tips that aren't obvious. The obvious stuff is everywhere. Add something the reader won't find in the top 5 results.
- Don't pad. If a point is made, move on. Repetition kills trust.

${calcInstructions}

FORMAT
- Output clean HTML5 only. Use: <h2>, <h3>, <p>, <strong>, <em>, <ul>, <li>, <ol>, <table>, <thead>, <tbody>, <th>, <td>, <div>, <a>
- No <html>, <head>, or <body> wrappers. No markdown. No code fences.
- Target: 1,800–2,400 words (well-developed, not padded)
- Start immediately with the Key Takeaways box. No preamble.`;
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { title, keyword, slug: rawSlug } = body as {
      title: string;
      keyword: string;
      slug: string;
    };

    if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 });
    if (!keyword?.trim())
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    if (!rawSlug?.trim()) return NextResponse.json({ error: 'slug is required' }, { status: 400 });

    const db = getDb();

    // Resolve AI key
    const orKey =
      getAiProviderKey(getAiSettings(db.settings.ai, db.settings.openrouterApiKey), 'openrouter') ||
      process.env.OPENROUTER_API_KEY ||
      (process.env.OPENAI_API_KEY?.startsWith('sk-or-') ? process.env.OPENAI_API_KEY : undefined) ||
      '';
    if (!orKey) {
      return NextResponse.json(
        {
          error:
            'No OpenRouter API key configured. Add your key in Platform Settings → AI Configuration.',
        },
        { status: 400 },
      );
    }

    // Duplicate keyword check
    const existingKeywords = db.articles.flatMap((a) => a.seoData.keywords ?? []);
    if (
      existingKeywords.some((k) => k.toLowerCase() === keyword.trim().toLowerCase())
    ) {
      return NextResponse.json(
        { error: `Duplicate keyword: "${keyword}" already exists in another article.` },
        { status: 409 },
      );
    }

    // Normalise slug
    const slug = rawSlug
      .trim()
      .toLowerCase()
      .replace(/^\//, '')
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Duplicate slug check
    if (db.articles.some((a) => a.slug === slug)) {
      return NextResponse.json(
        { error: `Duplicate slug: "${slug}" already exists. Choose a different SEO slug.` },
        { status: 409 },
      );
    }

    // Find best calculator match BEFORE generation so we can tell the model
    // whether a calculator exists and, if so, which one.
    // We pre-match on title + keyword only at this stage.
    const preMatch = findBestCalculatorMatch(title, keyword, '');
    const calcContext = preMatch
      ? `- ${preMatch.name} (/${preMatch.slug}): ${preMatch.description}`
      : '';

    // Build the Phase 5 writer prompt
    const writerPrompt = buildPhase5Prompt(
      title.trim(),
      keyword.trim(),
      slug,
      !!preMatch,
      calcContext,
    );

    // Call AI — try models in preference order
    const articleModels = getProviderModels(
      getAiSettings(db.settings.ai, db.settings.openrouterApiKey),
      'openrouter',
      [
        'nvidia/nemotron-3-ultra-550b-a55b:free',
        'google/gemma-4-31b-it:free',
        'nvidia/nemotron-3-super-120b-a12b:free',
        'nvidia/nemotron-3-nano-30b-a3b:free',
      ],
    );

    let content = '';
    let lastErr = '';
    for (const model of articleModels) {
      try {
        content = await callOpenRouter(orKey, model, [
          { role: 'user', content: writerPrompt },
        ]);
        if (content.trim()) break;
      } catch (e: unknown) {
        lastErr = e instanceof Error ? e.message : String(e);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    if (!content.trim()) throw new Error(`All article models failed. Last error: ${lastErr}`);

    // Clean up model output
    content = content.replace(/```html\s*/gi, '').replace(/```\s*/gi, '').trim();

    // Process HTML
    content = addHeadingIds(content);
    const toc = buildToc(content);
    if (toc) {
      const firstParaEnd = content.indexOf('</p>');
      content =
        firstParaEnd !== -1
          ? content.slice(0, firstParaEnd + 4) + '\n' + toc + content.slice(firstParaEnd + 4)
          : toc + '\n' + content;
    }

    // Smart calculator matching against the full article content
    const finalMatch = findBestCalculatorMatch(title, keyword, content);

    // Inject single natural link and Related Calculator section
    if (finalMatch) {
      content = injectOneCalculatorLink(content, finalMatch);
      content = insertRelatedCalculatorSection(content, finalMatch);
    }

    // Extract structured data
    const faqPairs = extractFaqPairs(content);
    const howToSteps = extractHowToSteps(content);
    const wordCount = calcWordCount(content);
    const readingTime = calcReadingTime(content);

    // AI-generated meta description (targeted 140–155 chars, front-loads keyword)
    let metaDescription = '';
    try {
      const metaPrompt = `Write a Google search meta description for this article.

TITLE: ${title}
FOCUS KEYWORD: ${keyword}

RULES:
- Exactly 140–155 characters (count carefully)
- Start with the focus keyword or a close variation
- Tell the reader what they'll learn or gain
- Conversational, active voice — no "discover", "delve", "explore"
- No quotation marks, no trailing period
- Return ONLY the meta description text, nothing else`;

      const descModels = getProviderModels(
        getAiSettings(db.settings.ai, db.settings.openrouterApiKey),
        'openrouter',
        [
          'nvidia/nemotron-3-super-120b-a12b:free',
          'google/gemma-4-31b-it:free',
          'nvidia/nemotron-3-nano-30b-a3b:free',
        ],
      );
      for (const model of descModels) {
        try {
          const raw = await callOpenRouter(orKey, model, [{ role: 'user', content: metaPrompt }]);
          const cleaned = raw
            .replace(/^["']|["']$/g, '')
            .split('\n')[0]
            .trim();
          if (cleaned.length >= 50 && cleaned.length <= 165) {
            metaDescription = cleaned.slice(0, 160);
            break;
          }
        } catch { /* try next model */ }
      }
    } catch { /* fallback below */ }

    // Fallback: extract the first meaningful sentence from the article
    if (!metaDescription) {
      const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      // Skip the key takeaways box content (usually starts with "Key Takeaways")
      const afterBox = plainText.replace(/^.*?Key Takeaways.*?\./i, '').trim();
      const source = afterBox || plainText;
      const firstSentence = source.match(/[^.!?]{40,200}[.!?]/)?.[0]?.trim() ?? '';
      metaDescription = firstSentence.length > 30
        ? firstSentence.slice(0, 158).replace(/\s\S*$/, '') + (firstSentence.length > 158 ? '…' : '')
        : source.slice(0, 155).replace(/\s\S*$/, '') + '…';
    }
    const faqSchema = faqPairs.length > 0 ? buildFaqSchema(keyword, faqPairs) : null;
    const articleSchema = buildArticleSchema({
      title,
      description: metaDescription,
      slug,
      keywords: [keyword],
      wordCount,
    });
    const howToSchema =
      howToSteps.length >= 3 ? buildHowToSchema(title, howToSteps) : null;

    // Append JSON-LD schemas
    const schemaScripts = [
      `<script type="application/ld+json">\n${articleSchema}\n</script>`,
      faqSchema ? `<script type="application/ld+json">\n${faqSchema}\n</script>` : '',
      howToSchema ? `<script type="application/ld+json">\n${howToSchema}\n</script>` : '',
    ]
      .filter(Boolean)
      .join('\n');
    content = content + '\n' + schemaScripts;

    // Related calculators list (for article metadata)
    const plainText = content.replace(/<[^>]+>/g, ' ').toLowerCase();
    const relatedCalculators = CALCULATORS.filter((c) =>
      c.keywords.some((k) => plainText.includes(k.toLowerCase())),
    )
      .slice(0, 5)
      .map((c) => c.slug);

    // Save to DB as draft
    const freshDb = getDb();
    const artId = `art_${Date.now()}`;
    const newArticle: Article = {
      id: artId,
      calculatorId: finalMatch?.slug ?? '',
      slug,
      title,
      content,
      status: 'draft',
      seoData: {
        title,
        description: metaDescription,
        keywords: [keyword],
        canonicalUrl: `/blog/${slug}`,
      },
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readingTime,
      wordCount,
      relatedCalculators,
      faqItems: faqPairs,
      howToSteps,
      schemaFaq: faqSchema ?? undefined,
      schemaArticle: articleSchema,
      schemaHowTo: howToSchema ?? undefined,
      keywordData: {
        keyword,
        searchVolume: '',
        competition: '',
        difficulty: 0,
        opportunityScore: 0,
        trend: '',
        estimatedCtr: '',
      },
      openGraph: {
        title,
        description: metaDescription,
        url: `/blog/${slug}`,
        type: 'article',
      },
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
      calculatorMatch: finalMatch
        ? { slug: finalMatch.slug, name: finalMatch.name, score: finalMatch.score }
        : null,
      meta: {
        wordCount,
        readingTime,
        faqCount: faqPairs.length,
        hasHowTo: howToSteps.length >= 3,
        hasToc: !!toc,
        schemaTypes: [
          'Article',
          faqPairs.length > 0 && 'FAQPage',
          howToSteps.length >= 3 && 'HowTo',
        ].filter(Boolean),
      },
    });
  } catch (err: unknown) {
    console.error('[articles/generate-direct]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
