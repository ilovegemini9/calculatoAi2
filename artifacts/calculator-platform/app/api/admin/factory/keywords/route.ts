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

    // Fetch keyword signals in parallel, focused on calculator queries
    const [baseAC, calcAC, freeAC, onlineAC, howAC, bestAC, relatedSearches] =
      await Promise.all([
        fetchAutocomplete(query),
        fetchAutocomplete(`${query} calculator`),
        fetchAutocomplete(`free ${query} calculator`),
        fetchAutocomplete(`${query} calculator online`),
        fetchAutocomplete(`how to calculate ${query}`),
        fetchAutocomplete(`best ${query} calculator`),
        fetchRelatedSearches(`${query} calculator`),
      ]);

    const rawSuggestions = [
      ...new Set([...baseAC, ...calcAC, ...freeAC, ...onlineAC, ...howAC, ...bestAC]),
    ].slice(0, 30);

    // If no AI key, return scored fallback suggestions
    if (!orKey) {
      const categories = ['financial', 'fitness', 'math', 'lifestyle'];
      const fallbackOpportunities = rawSuggestions.slice(0, 8).map((kw, i) => ({
        keyword: kw,
        calculatorName: `${kw.replace(/calculator/gi, '').trim()} Calculator`,
        category: categories[i % 4],
        searchVolume: ['10K-100K', '1K-10K', '500-1K', '100-500'][i % 4],
        competition: ['low', 'medium', 'high'][i % 3],
        trend: ['rising', 'stable', 'declining'][i % 3] as 'rising' | 'stable' | 'declining',
        opportunityScore: Math.max(30, 85 - i * 7),
        estimatedTraffic: ['5K-20K/mo', '1K-5K/mo', '500-1K/mo', '100-500/mo'][i % 4],
        description: `A free online tool to calculate ${kw.replace(/calculator/gi, '').trim()} quickly and accurately.`,
        urlSlug: kw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        rationale: `High search demand with ${['low', 'medium', 'high'][i % 3]} competition. ${['Rising', 'Stable', 'Declining'][i % 3]} trend.`,
      }));
      return NextResponse.json({ opportunities: fallbackOpportunities, rawSuggestions, relatedSearches, query });
    }

    const systemPrompt = `You are a Senior SEO Strategist specializing in calculator and utility tool websites. Analyze real Google search data and identify the best calculator opportunities to build — tools that users are actively searching for.

CRITICAL: Output ONLY a valid JSON object. No markdown, no explanation, no code fences.`;

    const userPrompt = `Seed Query: "${query}"

REAL SEARCH DATA from Google Autocomplete:
${rawSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Related searches (DuckDuckGo):
${relatedSearches.slice(0, 6).map((s, i) => `${i + 1}. ${s}`).join('\n') || 'None captured'}

Identify the 8 best calculator tool opportunities. For each, output:
{
  "opportunities": [
    {
      "keyword": string,                    // the primary search query
      "calculatorName": string,             // e.g. "Compound Interest Calculator"
      "category": "financial" | "fitness" | "math" | "lifestyle",
      "searchVolume": string,               // e.g. "10K-100K", "1K-10K", "500-1K"
      "competition": "low" | "medium" | "high",
      "trend": "rising" | "stable" | "declining",
      "opportunityScore": integer 0-100,    // overall score (volume + low comp + rising trend)
      "estimatedTraffic": string,           // e.g. "5K-20K/mo" — estimated monthly clicks if ranked #1
      "description": string,               // one sentence describing what this calculator does
      "urlSlug": string,                    // e.g. "compound-interest"
      "rationale": string                  // one sentence explaining why this is a good opportunity
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
    }));

    return NextResponse.json({ opportunities, rawSuggestions, relatedSearches, query });
  } catch (err: unknown) {
    console.error('[factory/keywords] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
