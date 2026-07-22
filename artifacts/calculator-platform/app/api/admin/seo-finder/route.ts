import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifySession } from '@/lib/session';

// ── Google Autocomplete ───────────────────────────────────────────────────────
async function fetchAutocomplete(query: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}&hl=en`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data[1]) ? (data[1] as string[]).slice(0, 10) : [];
  } catch {
    return [];
  }
}

// ── DuckDuckGo Related Searches ───────────────────────────────────────────────
async function fetchRelatedSearches(query: string): Promise<string[]> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const data = await res.json() as {
      RelatedTopics?: { Text?: string; FirstURL?: string }[];
    };
    return (data.RelatedTopics ?? [])
      .filter((t) => t.Text && t.FirstURL && !t.FirstURL.includes('duckduckgo.com/c/'))
      .map((t) => t.Text!.split('\n')[0].trim())
      .filter(Boolean)
      .slice(0, 8);
  } catch {
    return [];
  }
}

// ── People Also Ask via question-prefix autocomplete ─────────────────────────
async function fetchPeopleAlsoAsk(query: string): Promise<string[]> {
  const prefixes = ['how to', 'what is', 'why', 'when to', 'can i', 'is it', 'how much', 'what are'];
  const results = await Promise.allSettled(
    prefixes.map((p) => fetchAutocomplete(`${p} ${query}`)),
  );
  const firstWord = query.toLowerCase().split(' ')[0];
  const questions = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => (r as PromiseFulfilledResult<string[]>).value)
    .filter((s) => s.toLowerCase().includes(firstWord))
    .filter((s, i, arr) => arr.indexOf(s) === i);
  return questions.slice(0, 10);
}

// ── OpenRouter helper ─────────────────────────────────────────────────────────
async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  responseFormat?: { type: string },
): Promise<string> {
  const body: Record<string, unknown> = { model, messages };
  if (responseFormat) body.response_format = responseFormat;
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://calculatorplatform.com',
      'X-Title': 'Professional Calculator Platform',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`OpenRouter error ${res.status}: ${res.statusText}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { niche } = await req.json();
    if (!niche?.trim()) return NextResponse.json({ error: 'niche is required' }, { status: 400 });

    const db = getDb();
    const orKey =
      db.settings.openrouterApiKey ||
      process.env.OPENROUTER_API_KEY ||
      (process.env.OPENAI_API_KEY?.startsWith('sk-or-') ? process.env.OPENAI_API_KEY : '') ||
      '';
    if (!orKey) {
      return NextResponse.json(
        { error: 'OpenRouter API Key is not configured. Add it in Platform Settings.' },
        { status: 400 },
      );
    }

    // 1. Fetch all data sources in parallel
    const [
      nicheAC,
      howToAC,
      calculatorAC,
      bestAC,
      freeAC,
      relatedSearches,
      peopleAlsoAsk,
    ] = await Promise.all([
      fetchAutocomplete(niche),
      fetchAutocomplete(`how to calculate ${niche}`),
      fetchAutocomplete(`${niche} calculator`),
      fetchAutocomplete(`best ${niche}`),
      fetchAutocomplete(`free ${niche} online`),
      fetchRelatedSearches(niche),
      fetchPeopleAlsoAsk(niche),
    ]);

    const rawSuggestions = [
      ...new Set([...nicheAC, ...howToAC, ...calculatorAC, ...bestAC, ...freeAC]),
    ].slice(0, 24);

    // 2. AI analysis → scored opportunities with full metrics
    const systemPrompt = `You are a Senior SEO Strategist specializing in calculator and finance/health/utility content websites. Analyze real Google search data and produce actionable, scored keyword opportunities.

CRITICAL: Output ONLY a valid JSON object. No markdown, no explanation, no code fences.`;

    const userPrompt = `Seed Niche: "${niche}"

REAL DATA SOURCES:

Google Autocomplete queries:
${rawSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

People Also Ask (question-prefix autocomplete):
${peopleAlsoAsk.slice(0, 6).map((s, i) => `${i + 1}. ${s}`).join('\n') || 'None captured'}

Related Searches (DuckDuckGo):
${relatedSearches.slice(0, 6).map((s, i) => `${i + 1}. ${s}`).join('\n') || 'None captured'}

Identify the 8 best opportunities — mix of calculator tools and articles. Return this EXACT JSON:
{
  "opportunities": [
    {
      "keyword": string,
      "type": "calculator" | "article",
      "searchIntent": "informational" | "transactional",
      "opportunityScore": integer 0-100,
      "estimatedMonthlySearches": string (e.g. "1K-10K"),
      "keywordDifficulty": integer 0-100,
      "competitionLevel": "low" | "medium" | "high",
      "trendMomentum": "rising" | "stable" | "declining",
      "estimatedCtr": string (e.g. "8.5%"),
      "titles": [string, string, string, string, string],
      "primaryKeyword": string,
      "secondaryKeywords": [string, string, string, string, string],
      "intentAnalysis": string,
      "outline": [
        { "heading": string, "level": "h2" | "h3", "subpoints": [string, string] }
      ],
      "metaTitle": string,
      "metaDescription": string,
      "urlSlug": string
    }
  ]
}`;

    const contentModels = [
      'google/gemma-4-31b-it:free',
      'google/gemma-4-26b-a4b:free',
      'nvidia/nemotron-3-ultra-550b-a55b:free',
    ];

    let rawText = '';
    let lastErr = '';
    for (const model of contentModels) {
      try {
        rawText = await callOpenRouter(orKey, model, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ], { type: 'json_object' });
        if (rawText.trim()) break;
      } catch (e: unknown) {
        lastErr = e instanceof Error ? e.message : String(e);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    if (!rawText.trim()) throw new Error(`All models failed. Last error: ${lastErr}`);

    let parsed: { opportunities: unknown[] };
    try {
      const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      parsed = JSON.parse(start !== -1 && end > start ? cleaned.slice(start, end + 1) : cleaned);
    } catch {
      throw new Error('AI returned invalid JSON. Please try again.');
    }

    if (!Array.isArray(parsed.opportunities) || parsed.opportunities.length === 0) {
      throw new Error('AI returned empty opportunities list. Please try again.');
    }

    const opportunities = (parsed.opportunities as Record<string, unknown>[]).map((opp) => ({
      ...opp,
      opportunityScore: Math.max(0, Math.min(100, Number(opp.opportunityScore) || 50)),
      keywordDifficulty: Math.max(0, Math.min(100, Number(opp.keywordDifficulty) || 50)),
    }));

    return NextResponse.json({ opportunities, rawSuggestions, relatedSearches, peopleAlsoAsk, niche });
  } catch (err: unknown) {
    console.error('[seo-finder] Error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}
