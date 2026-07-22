import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifySession } from '@/lib/session';

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

async function fetchRelatedSearches(query: string): Promise<string[]> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { RelatedTopics?: { Text?: string; FirstURL?: string }[] };
    return (data.RelatedTopics ?? [])
      .filter((t) => t.Text && t.FirstURL && !t.FirstURL.includes('duckduckgo.com/c/'))
      .map((t) => t.Text!.split('\n')[0].trim())
      .filter(Boolean)
      .slice(0, 8);
  } catch {
    return [];
  }
}

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

export async function POST(req: Request) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { query } = await req.json();
    if (!query?.trim()) return NextResponse.json({ error: 'query is required' }, { status: 400 });

    const db = getDb();
    const orKey =
      db.settings.openrouterApiKey ||
      process.env.OPENROUTER_API_KEY ||
      (process.env.OPENAI_API_KEY?.startsWith('sk-or-') ? process.env.OPENAI_API_KEY : '') ||
      '';

    // Fetch keyword data sources in parallel
    const [baseAC, howToAC, guideAC, calculatorAC, bestAC, freeAC, relatedSearches] =
      await Promise.all([
        fetchAutocomplete(query),
        fetchAutocomplete(`how to calculate ${query}`),
        fetchAutocomplete(`${query} guide`),
        fetchAutocomplete(`${query} calculator`),
        fetchAutocomplete(`best ${query}`),
        fetchAutocomplete(`free ${query} online`),
        fetchRelatedSearches(query),
      ]);

    const rawSuggestions = [
      ...new Set([...baseAC, ...howToAC, ...guideAC, ...calculatorAC, ...bestAC, ...freeAC]),
    ].slice(0, 28);

    // If no AI key, return basic suggestions without scoring
    if (!orKey) {
      const fallbackOpportunities = rawSuggestions.slice(0, 8).map((kw, i) => ({
        keyword: kw,
        type: 'article',
        searchIntent: 'informational' as const,
        opportunityScore: Math.max(30, 80 - i * 6),
        searchVolume: ['1K-10K', '500-1K', '100-500', '10K-100K'][i % 4],
        competition: ['low', 'medium', 'high'][i % 3],
        difficulty: Math.min(90, 20 + i * 9),
        trend: ['rising', 'stable', 'declining'][i % 3],
        estimatedCtr: `${(8 - i * 0.5).toFixed(1)}%`,
        titles: [
          `${kw} – Complete Guide`,
          `How to Use ${kw}: Step-by-Step`,
          `${kw}: Everything You Need to Know`,
          `Top Tips for ${kw}`,
          `${kw}: Beginner to Expert`,
        ],
        primaryKeyword: kw,
        secondaryKeywords: rawSuggestions.filter((s) => s !== kw).slice(0, 5),
        intentAnalysis: `Users searching for "${kw}" want practical, actionable information.`,
        outline: [
          { heading: `What Is ${kw}?`, level: 'h2', subpoints: ['Definition', 'Why it matters'] },
          { heading: `How to Calculate ${kw}`, level: 'h2', subpoints: ['The formula', 'Step-by-step example'] },
          { heading: 'Common Mistakes', level: 'h2', subpoints: ['Mistake 1', 'Mistake 2'] },
          { heading: 'FAQ', level: 'h2', subpoints: ['Common questions'] },
        ],
        metaTitle: `${kw} – Free Online Guide & Calculator`,
        metaDescription: `Learn everything about ${kw}. Step-by-step guide, formula, and free calculator tool. Get accurate results instantly.`,
        urlSlug: kw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }));
      return NextResponse.json({ opportunities: fallbackOpportunities, rawSuggestions, relatedSearches, query });
    }

    const systemPrompt = `You are a Senior SEO Strategist specializing in calculator, finance, health, and utility content websites. Analyze real Google search data and produce actionable, scored keyword opportunities for article creation.

CRITICAL: Output ONLY a valid JSON object. No markdown, no explanation, no code fences.`;

    const userPrompt = `Seed Query: "${query}"

REAL DATA SOURCES:

Google Autocomplete queries:
${rawSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Related Searches (DuckDuckGo):
${relatedSearches.slice(0, 6).map((s, i) => `${i + 1}. ${s}`).join('\n') || 'None captured'}

Identify the 8 best article opportunities. For each, output:
{
  "opportunities": [
    {
      "keyword": string,
      "type": "article",
      "searchIntent": "informational" | "transactional" | "navigational",
      "opportunityScore": integer 0-100,
      "searchVolume": string (e.g. "1K-10K" or "500-1K"),
      "competition": "low" | "medium" | "high",
      "difficulty": integer 0-100,
      "trend": "rising" | "stable" | "declining",
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

    const models = [
      'google/gemma-4-31b-it:free',
      'google/gemma-4-26b-a4b:free',
      'nvidia/nemotron-3-ultra-550b-a55b:free',
      'nvidia/nemotron-3-super-120b-a12b:free',
    ];

    let rawText = '';
    let lastErr = '';
    for (const model of models) {
      try {
        rawText = await callOpenRouter(
          orKey,
          model,
          [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          { type: 'json_object' },
        );
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
      difficulty: Math.max(0, Math.min(100, Number(opp.difficulty) || 50)),
    }));

    return NextResponse.json({ opportunities, rawSuggestions, relatedSearches, query });
  } catch (err: unknown) {
    console.error('[articles/keywords] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
