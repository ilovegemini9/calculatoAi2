import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { getAiProviderKey, getAiSettings, getProviderModels, getSerpApiKey } from '@/lib/ai';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchAutocomplete(query: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}&hl=en`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' }, signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data[1]) ? (data[1] as string[]).slice(0, 12) : [];
  } catch { return []; }
}

async function serpSearch(apiKey: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const url = new URL('https://serpapi.com/search');
  Object.entries({ ...params, api_key: apiKey, hl: 'en', gl: 'us' }).forEach(([k, v]) =>
    url.searchParams.set(k, v),
  );
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`SerpAPI ${res.status}`);
  return res.json() as Promise<Record<string, unknown>>;
}

async function callOpenRouter(apiKey: string, model: string, prompt: string): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://calculatorplatform.com',
      'X-Title': 'Calculator Platform',
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 600,
      messages: [
        {
          role: 'system',
          content: 'You are a senior SEO content strategist. Return only valid JSON. Never invent search volume numbers.',
        },
        { role: 'user', content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}

function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  return JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned) as T;
}

// ─── GET handler ──────────────────────────────────────────────────────────────

export async function GET() {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = (await import('@/lib/db')).getDb();
    const serpKey = getSerpApiKey(db.settings);
    const aiSettings = getAiSettings(db.settings.ai, db.settings.openrouterApiKey);
    const orKey = getAiProviderKey(aiSettings, 'openrouter') || process.env.OPENROUTER_API_KEY || '';

    // Get existing active calculators for context (avoid duplicating content)
    const existingCalculators: string[] = (() => {
      try {
        const calcs = (db as unknown as Record<string, unknown>).calculators;
        if (!Array.isArray(calcs)) return [];
        return (calcs as { status?: string; name?: string }[])
          .filter((c) => c.status === 'active' && c.name)
          .map((c) => c.name!)
          .slice(0, 25);
      } catch { return []; }
    })();

    // Discovery seeds — broad calculator/finance/health topics
    const seeds = [
      'calculator',
      'how to calculate',
      'financial calculator',
      'health calculator',
      'tax calculator',
      'investment calculator',
      'percentage calculator',
    ];

    // ── Parallel data collection ──────────────────────────────────────────────
    const [
      acResults,
      serpGoogleResult,
      serpTrendsResult,
      serpRedditResult,
      serpQuoraResult,
    ] = await Promise.allSettled([
      // Google Autocomplete for all seeds
      Promise.all(seeds.map((s) => fetchAutocomplete(s))),
      // Google Search — PAA + organic signals
      serpKey
        ? serpSearch(serpKey, { engine: 'google', q: 'calculator guide 2024', num: '10' })
        : Promise.resolve(null),
      // Google Trends — what calculators are rising
      serpKey
        ? serpSearch(serpKey, { engine: 'google_trends', q: 'calculator' })
        : Promise.resolve(null),
      // Reddit discussions
      serpKey
        ? serpSearch(serpKey, { engine: 'google', q: 'site:reddit.com how to calculate', num: '5' })
        : Promise.resolve(null),
      // Quora questions
      serpKey
        ? serpSearch(serpKey, { engine: 'google', q: 'site:quora.com how to calculate', num: '5' })
        : Promise.resolve(null),
    ]);

    // Collect all autocomplete signals
    const allTerms: string[] = [];
    if (acResults.status === 'fulfilled') {
      for (const terms of acResults.value) allTerms.push(...terms);
    }
    const uniqueTerms = [...new Set(allTerms)].filter((t) => t.length > 4).slice(0, 50);

    // PAA questions from Google
    const googleData = serpGoogleResult.status === 'fulfilled' ? serpGoogleResult.value : null;
    const paaQuestions: string[] = ((googleData?.related_questions as { question?: string }[]) ?? [])
      .map((q) => q.question ?? '').filter(Boolean).slice(0, 8);

    // Trending queries
    const trendsData = serpTrendsResult.status === 'fulfilled' ? serpTrendsResult.value : null;
    const trendingQueries: string[] = (
      (trendsData?.related_queries as { query?: string; type?: string }[]) ?? []
    )
      .filter((q) => q.type === 'rising')
      .map((q) => q.query ?? '')
      .filter(Boolean)
      .slice(0, 10);

    // Reddit threads
    const redditData = serpRedditResult.status === 'fulfilled' ? serpRedditResult.value : null;
    const redditTitles: string[] = ((redditData?.organic_results as { title?: string }[]) ?? [])
      .map((r) => r.title ?? '').filter(Boolean).slice(0, 5);

    // Quora questions
    const quoraData = serpQuoraResult.status === 'fulfilled' ? serpQuoraResult.value : null;
    const quoraTitles: string[] = ((quoraData?.organic_results as { title?: string }[]) ?? [])
      .map((r) => r.title ?? '').filter(Boolean).slice(0, 5);

    const hasSerpData = Boolean(serpKey && (googleData || trendsData));

    // ── AI analysis → 3 best article opportunities ───────────────────────────
    const prompt = `You are a senior SEO content strategist for a calculator platform website.

${existingCalculators.length > 0 ? `EXISTING CALCULATORS ON THIS PLATFORM (avoid directly duplicating these as article topics):
${existingCalculators.join(', ')}` : ''}

GOOGLE AUTOCOMPLETE SIGNALS (real user search queries):
${uniqueTerms.slice(0, 30).join('\n') || 'None available'}

${paaQuestions.length > 0 ? `PEOPLE ALSO ASK QUESTIONS (Google):
${paaQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}` : ''}

${trendingQueries.length > 0 ? `RISING SEARCH TRENDS (Google Trends):
${trendingQueries.join(', ')}` : ''}

${redditTitles.length > 0 ? `REDDIT DISCUSSIONS (what users discuss):
${redditTitles.join('\n')}` : ''}

${quoraTitles.length > 0 ? `QUORA QUESTIONS (user intent signals):
${quoraTitles.join('\n')}` : ''}

TASK: Identify exactly 3 high-opportunity SEO article titles for this calculator platform.

Selection criteria (rank by these in order):
1. Highest search volume signal (from autocomplete frequency)
2. Lowest competition (avoid topics dominated by huge brands)
3. Highest opportunity score (content gap + intent match)
4. Rising or stable trend
5. Clear search intent (how-to, guide, explainer)

Requirements for each title:
- Must be a complete, specific, compelling article title (not just a keyword)
- Must have clear user intent (how-to, guide, calculator explanation, comparison)
- Strongly prefer long-tail, specific angles over generic head terms
- Topics like "how to calculate X", "X calculator guide", "what is X and how to use it"
${!hasSerpData ? '- No live metrics available — base selections on autocomplete signal strength and SEO intuition' : '- Use the real data signals above to justify your selections'}

Return ONLY this JSON — no explanation, no markdown:
{
  "opportunities": [
    { "title": "Full compelling article title here" },
    { "title": "Full compelling article title here" },
    { "title": "Full compelling article title here" }
  ]
}`;

    // Try AI models in order
    const models = getProviderModels(aiSettings, 'openrouter', [
      'google/gemma-4-31b-it:free',
      'google/gemma-4-26b-a4b:free',
      'nvidia/nemotron-3-ultra-550b-a55b:free',
    ]);

    let rawText = '';
    if (orKey) {
      for (const model of models) {
        try {
          rawText = await callOpenRouter(orKey, model, prompt);
          if (rawText.trim()) break;
        } catch {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }

    // Parse AI response or fall back to autocomplete-derived titles
    if (rawText.trim()) {
      try {
        const parsed = parseJson<{ opportunities?: { title?: string }[] }>(rawText);
        const opportunities = (parsed.opportunities ?? [])
          .slice(0, 3)
          .map((o) => ({ title: String(o.title ?? '').trim() }))
          .filter((o) => o.title.length > 10);

        if (opportunities.length >= 2) {
          return NextResponse.json({ opportunities, hasSerpData });
        }
      } catch { /* fall through to fallback */ }
    }

    // Fallback: derive titles from top autocomplete terms
    const fallbackOpportunities = uniqueTerms
      .filter((t) => t.split(' ').length >= 2)
      .slice(0, 3)
      .map((t) => ({
        title: t.charAt(0).toUpperCase() + t.slice(1) + ' — Complete Guide',
      }));

    return NextResponse.json({
      opportunities: fallbackOpportunities.length > 0
        ? fallbackOpportunities
        : [
            { title: 'How to Calculate Your Monthly Mortgage Payment' },
            { title: 'BMI Calculator Guide: What Your Body Mass Index Really Means' },
            { title: 'Compound Interest Calculator: How to Grow Your Money Faster' },
          ],
      hasSerpData: false,
    });
  } catch (err) {
    console.error('[articles/discover]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Discovery failed.' },
      { status: 500 },
    );
  }
}
