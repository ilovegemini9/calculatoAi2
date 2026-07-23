import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { getAiProviderKey, getAiSettings, getProviderModels, getSerpApiKey } from '@/lib/ai';
import type { ArticleResearchSummary, ResearchKeywordChip } from '@/lib/types';

type SuggestionKind = 'keywords' | 'slug';

async function fetchAutocomplete(query: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}&hl=en`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CalculatorPlatform/1.0)' }, signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data[1]) ? (data[1] as string[]).slice(0, 12) : [];
  } catch { return []; }
}

async function fetchRelatedSearches(query: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CalculatorPlatform/1.0)' }, signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return [];
    const data = await res.json() as { RelatedTopics?: { Text?: string }[] };
    return (data.RelatedTopics ?? [])
      .map((item) => item.Text?.split('\n')[0]?.trim() ?? '')
      .filter(Boolean).slice(0, 8);
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
      max_tokens: 1200,
      messages: [
        { role: 'system', content: 'Return only valid JSON. Never invent search volume, competition, or metrics.' },
        { role: 'user', content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}

function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  return JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned) as T;
}

async function callWithFallbacks(apiKey: string, models: string[], prompt: string): Promise<string> {
  let lastError = '';
  for (const model of models) {
    try {
      const raw = await callOpenRouter(apiKey, model, prompt);
      if (raw.trim()) return raw;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(lastError || 'All AI models failed.');
}

export async function POST(req: Request) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json() as {
      kind?: SuggestionKind;
      title?: string;
      researchSummary?: ArticleResearchSummary;
    };
    const kind = body.kind;
    if (!kind || !['keywords', 'slug'].includes(kind)) {
      return NextResponse.json({ error: 'kind must be keywords or slug' }, { status: 400 });
    }
    const title = body.title?.trim() ?? '';
    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

    const db = (await import('@/lib/db')).getDb();
    const aiSettings = getAiSettings(db.settings.ai, db.settings.openrouterApiKey);
    const apiKey = getAiProviderKey(aiSettings, 'openrouter') || process.env.OPENROUTER_API_KEY || '';
    if (!apiKey) return NextResponse.json({ error: 'Live keyword data unavailable.' }, { status: 503 });

    const serpKey = getSerpApiKey(db.settings);
    const models = getProviderModels(aiSettings, 'openrouter', [
      'google/gemma-4-31b-it:free',
      'google/gemma-4-26b-a4b:free',
      'nvidia/nemotron-3-ultra-550b-a55b:free',
    ]);

    if (kind === 'slug') {
      const raw = await callWithFallbacks(apiKey, models, `Create one concise, lowercase, hyphenated SEO URL slug for this article title:

${title}

Return exactly {"slug":"..."} with no more than 8 words.`);
      const parsed = parseJson<{ slug?: string }>(raw);
      const slug = (parsed.slug ?? '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');
      return slug
        ? NextResponse.json({ slug })
        : NextResponse.json({ error: 'Live keyword data unavailable.' }, { status: 503 });
    }

    // ── Keywords ──────────────────────────────────────────────────────────────

    const serpDataAvailable = Boolean(serpKey);
    const research = body.researchSummary;

    // Collect live signals for this specific title
    const [acTitle, acRelated, duckduckgo, serpTrends] = await Promise.allSettled([
      fetchAutocomplete(title),
      fetchAutocomplete(`${title} calculator`),
      fetchRelatedSearches(title),
      serpKey ? serpSearch(serpKey, { engine: 'google_trends', q: title }) : Promise.resolve(null),
    ]);

    const liveTerms = [
      ...(acTitle.status === 'fulfilled' ? acTitle.value : []),
      ...(acRelated.status === 'fulfilled' ? acRelated.value : []),
      ...(duckduckgo.status === 'fulfilled' ? duckduckgo.value : []),
      ...(research?.autocomplete ?? []),
    ].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 30);

    const trendsData = serpTrends.status === 'fulfilled' ? serpTrends.value : null;

    interface SerpTrendTimeline { values?: { extracted_value?: number }[] }
    const trendTimeline = (trendsData?.interest_over_time as { timeline_data?: SerpTrendTimeline[] })
      ?.timeline_data ?? [];
    const trendInterest = trendTimeline.length > 0
      ? Math.round(
          trendTimeline.slice(-4).reduce((s, t) => s + (t.values?.[0]?.extracted_value ?? 0), 0) /
          Math.min(4, trendTimeline.length),
        )
      : null;

    function interestToVolumeLabel(interest: number | null): string | null {
      if (interest === null) return null;
      if (interest >= 80) return '50K+/mo';
      if (interest >= 60) return '10K–50K/mo';
      if (interest >= 35) return '1K–10K/mo';
      if (interest >= 10) return '100–1K/mo';
      return '< 100/mo';
    }

    const volLabel = interestToVolumeLabel(trendInterest);

    const prompt = `You are an SEO keyword specialist. The admin has selected this article title:

"${title}"

LIVE SEARCH SIGNALS:
${liveTerms.map((t, i) => `${i + 1}. ${t}`).join('\n') || 'None available'}

PAA QUESTIONS (from research):
${(research?.paaQuestions ?? []).slice(0, 6).map((q, i) => `${i + 1}. ${q}`).join('\n') || 'None'}

TREND DATA:
- Interest score: ${trendInterest ?? 'Unavailable'}
- SerpAPI available: ${serpDataAvailable}
- Volume estimate: ${volLabel ?? 'Unavailable'}

Generate exactly 5 focus keywords closely related to the selected title. Each must:
- Be a real keyword phrase people search for
- Be distinct from each other
- Target different search intents or specificity levels

${serpDataAvailable
  ? `For each keyword, derive metrics from the real data above. Do NOT invent numbers.
searchVolumeLabel must be "${volLabel ?? 'Unavailable'}" or a variation based on keyword specificity.
competition: "Low", "Medium", or "High" — based on SERP competitiveness analysis.
trend: "Rising", "Stable", or "Declining" — based on trends data.`
  : `searchVolumeLabel, competition, trend must all be null — no live data available.`}

Return this EXACT JSON:
{
  "keywordChips": [
    {
      "keyword": "exact keyword phrase",
      "searchVolumeLabel": ${volLabel ? `"${volLabel}" or null` : 'null'},
      "competition": ${serpDataAvailable ? '"Low" or "Medium" or "High"' : 'null'},
      "trend": ${serpDataAvailable ? '"Rising" or "Stable" or "Declining"' : 'null'}
    }
  ]
}`;

    const raw = await callWithFallbacks(apiKey, models, prompt);
    const parsed = parseJson<{ keywordChips?: ResearchKeywordChip[] }>(raw);

    const keywordChips = (parsed.keywordChips ?? []).slice(0, 5).map((c) => ({
      keyword: String(c.keyword ?? '').trim(),
      searchVolumeLabel: serpDataAvailable ? (c.searchVolumeLabel ?? null) : null,
      competition: serpDataAvailable ? (c.competition ?? null) : null,
      trend: serpDataAvailable ? (c.trend ?? null) : null,
    })).filter((c) => c.keyword);

    if (keywordChips.length === 0) {
      return NextResponse.json({ error: 'Live keyword data unavailable.' }, { status: 503 });
    }

    return NextResponse.json({ keywordChips, liveData: liveTerms.length > 0, serpDataAvailable });
  } catch (err) {
    console.error('[articles/suggest]', err);
    return NextResponse.json({ error: 'Live keyword data unavailable.' }, { status: 503 });
  }
}
