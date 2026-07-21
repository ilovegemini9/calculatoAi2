import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifySession } from '@/lib/session';

// ── Google Autocomplete ───────────────────────────────────────────────────────
async function fetchAutocompleteSuggestions(query: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}&hl=en`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const suggestions: string[] = Array.isArray(data[1]) ? data[1] : [];
    return suggestions.slice(0, 12);
  } catch {
    return [];
  }
}

// ── OpenRouter call ───────────────────────────────────────────────────────────
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
    if (!niche?.trim()) {
      return NextResponse.json({ error: 'niche is required' }, { status: 400 });
    }

    const db = getDb();
    const orKey = db.settings.openrouterApiKey;
    if (!orKey) {
      return NextResponse.json(
        { error: 'OpenRouter API Key is not configured. Add it in Platform Settings.' },
        { status: 400 },
      );
    }

    // 1. Fetch real Google Autocomplete suggestions in parallel
    const [nicheResults, howToResults, calculatorResults] = await Promise.all([
      fetchAutocompleteSuggestions(niche),
      fetchAutocompleteSuggestions(`how to calculate ${niche}`),
      fetchAutocompleteSuggestions(`free ${niche} calculator online`),
    ]);

    const rawSuggestions = [...new Set([...nicheResults, ...howToResults, ...calculatorResults])].slice(0, 20);

    // 2. AI: analyze queries → produce scored keyword opportunities
    const systemPrompt = `You are a Senior SEO Strategist specializing in calculator and finance/health/utility content websites. Your job is to analyze real Google search queries and produce actionable, scored keyword opportunities.

CRITICAL: Output ONLY a valid JSON object. No markdown, no explanation, no code fences.`;

    const userPrompt = `Seed Niche: "${niche}"

Real Google Autocomplete Queries (actual searches people type):
${rawSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Analyze these real search queries and identify the 6 best low-competition, high-CTR opportunities — a mix of calculator tools and article content.

For each opportunity produce:
1. The target keyword (exact or slightly refined from the autocomplete data above)
2. Whether it's best as a "calculator" or "article"
3. Search intent: "informational" or "transactional"
4. opportunityScore: integer 0-100 combining search volume, low competition, and trend momentum (higher = better opportunity)
5. estimatedMonthlySearches: estimated monthly search range as a string (e.g. "1K-10K", "10K-100K", "100K+")
6. competitionLevel: "low" | "medium" | "high" — how saturated the SERPs are
7. trendMomentum: "rising" | "stable" | "declining" — based on query patterns
8. Exactly 5 compelling, AdSense-safe titles that include the keyword. Use formats like:
   - "Free [X] Calculator – Instant & Accurate Results (2026)"
   - "How to Calculate [X]: Step-by-Step Guide"
   - "[X] Calculator: [Benefit] in Seconds"
   - "What Is [X]? Complete Guide with Free Calculator"
   - "Best [X] Calculator Online – [Unique Angle]"
9. Primary keyword (exact target)
10. 5 secondary/LSI keywords
11. Search intent analysis (1-2 sentences)
12. H2/H3 outline (4-6 headings with 2-3 subpoints each)
13. Meta title (under 60 characters, includes primary keyword)
14. Meta description (under 155 characters, includes CTA)

Return this exact JSON structure:
{
  "opportunities": [
    {
      "keyword": string,
      "type": "calculator" | "article",
      "searchIntent": "informational" | "transactional",
      "opportunityScore": number,
      "estimatedMonthlySearches": string,
      "competitionLevel": "low" | "medium" | "high",
      "trendMomentum": "rising" | "stable" | "declining",
      "titles": [string, string, string, string, string],
      "primaryKeyword": string,
      "secondaryKeywords": [string, string, string, string, string],
      "intentAnalysis": string,
      "outline": [
        { "heading": string, "level": "h2" | "h3", "subpoints": [string, string] }
      ],
      "metaTitle": string,
      "metaDescription": string
    }
  ]
}`;

    let rawText = '';
    const contentModels = [
      'google/gemma-4-31b-it:free',
      'google/gemma-4-26b-a4b:free',
      'nvidia/nemotron-3-ultra-550b-a55b:free',
    ];

    let lastErr = '';
    for (const model of contentModels) {
      try {
        rawText = await callOpenRouter(
          orKey,
          model,
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          { type: 'json_object' },
        );
        if (rawText.trim()) break;
      } catch (e: unknown) {
        lastErr = e instanceof Error ? e.message : String(e);
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
    }

    if (!rawText.trim()) {
      throw new Error(`All content models failed. Last error: ${lastErr}`);
    }

    // Parse and validate
    let parsed: { opportunities: unknown[] };
    try {
      const cleaned = rawText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      parsed = JSON.parse(start !== -1 && end > start ? cleaned.slice(start, end + 1) : cleaned);
    } catch {
      throw new Error('AI returned invalid JSON. Please try again.');
    }

    if (!Array.isArray(parsed.opportunities) || parsed.opportunities.length === 0) {
      throw new Error('AI returned empty opportunities list. Please try again.');
    }

    // Clamp opportunityScore to 0-100
    const opportunities = (parsed.opportunities as Record<string, unknown>[]).map((opp) => ({
      ...opp,
      opportunityScore: Math.max(0, Math.min(100, Number(opp.opportunityScore) || 50)),
    }));

    return NextResponse.json({
      opportunities,
      rawSuggestions,
      niche,
    });
  } catch (err: unknown) {
    console.error('[seo-finder] Error:', err);
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
