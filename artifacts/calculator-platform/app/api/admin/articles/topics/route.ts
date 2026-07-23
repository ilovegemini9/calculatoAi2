import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { getAiProviderKey, getAiSettings, getProviderModels, getSerpApiKey } from '@/lib/ai';
import type { TopicSuggestion } from '@/lib/types';

// ─── Free helpers ─────────────────────────────────────────────────────────────

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
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
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
      temperature: 0.3,
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content:
            'You are an SEO strategist. Return only valid JSON. Never invent search volume or metric numbers.',
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

interface SerpTrendTimeline { values?: { extracted_value?: number }[] }

function interestToVolumeLabel(interest: number | null): string | null {
  if (interest === null) return null;
  if (interest >= 80) return '50K+/mo';
  if (interest >= 60) return '10K–50K/mo';
  if (interest >= 35) return '1K–10K/mo';
  if (interest >= 10) return '100–1K/mo';
  return '< 100/mo';
}

function deriveTrendDirection(timeline: SerpTrendTimeline[]): 'Rising' | 'Stable' | 'Declining' | null {
  if (!timeline || timeline.length < 6) return null;
  const vals = timeline.map((t) => (t.values?.[0]?.extracted_value ?? 0));
  const half = Math.floor(vals.length / 2);
  const first = vals.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const second = vals.slice(half).reduce((a, b) => a + b, 0) / (vals.length - half);
  const delta = second - first;
  if (delta > 8) return 'Rising';
  if (delta < -8) return 'Declining';
  return 'Stable';
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { query } = (await req.json()) as { query?: string };
    if (!query?.trim() || query.trim().length < 3) {
      return NextResponse.json({ error: 'query must be at least 3 characters' }, { status: 400 });
    }

    const db = (await import('@/lib/db')).getDb();
    const aiSettings = getAiSettings(db.settings.ai, db.settings.openrouterApiKey);
    const orKey = getAiProviderKey(aiSettings, 'openrouter') || process.env.OPENROUTER_API_KEY || '';
    if (!orKey) {
      return NextResponse.json({ error: 'OpenRouter API key not configured.' }, { status: 400 });
    }

    const serpKey = getSerpApiKey(db.settings);

    // ── Parallel data collection ──────────────────────────────────────────────
    const [acBase, acQuestion, acBest, serpTrendsResult] = await Promise.allSettled([
      fetchAutocomplete(query.trim()),
      fetchAutocomplete(`best ${query.trim()}`),
      fetchAutocomplete(`how to ${query.trim()}`),
      serpKey ? serpSearch(serpKey, { engine: 'google_trends', q: query.trim() }) : Promise.resolve(null),
    ]);

    const allTerms = [
      query.trim(),
      ...(acBase.status === 'fulfilled' ? acBase.value : []),
      ...(acQuestion.status === 'fulfilled' ? acQuestion.value : []),
      ...(acBest.status === 'fulfilled' ? acBest.value : []),
    ].filter((v, i, arr) => arr.indexOf(v) === i && v.length > 3).slice(0, 25);

    const trendsData = serpTrendsResult.status === 'fulfilled' ? serpTrendsResult.value : null;
    const trendTimeline =
      (trendsData?.interest_over_time as { timeline_data?: SerpTrendTimeline[] })?.timeline_data ?? [];
    const trendInterest =
      trendTimeline.length > 0
        ? Math.round(
            trendTimeline
              .slice(-4)
              .reduce((sum, t) => sum + (t.values?.[0]?.extracted_value ?? 0), 0) /
              Math.min(4, trendTimeline.length),
          )
        : null;
    const trendDirection = deriveTrendDirection(trendTimeline);
    const volLabel = interestToVolumeLabel(trendInterest);
    const serpDataAvailable = Boolean(serpKey && trendsData);

    // ── AI ranking ───────────────────────────────────────────────────────────
    const prompt = `The administrator is researching the topic: "${query.trim()}"

AUTOCOMPLETE SIGNALS (real Google data):
${allTerms.map((t, i) => `${i + 1}. ${t}`).join('\n') || 'None available'}

TREND DATA:
- Interest score (0-100): ${trendInterest ?? 'Unavailable'}
- Direction: ${trendDirection ?? 'Unknown'}
- Volume estimate: ${volLabel ?? 'Unavailable'}

TASK: From the autocomplete signals above, select and rank exactly 5 distinct topic variations that represent the strongest SEO opportunities. Each must be a real topic people search for. Prefer topics with:
- High search intent clarity
- Lower competition signals
- Evergreen or rising trend
- Content potential (can become a full article)

${
  serpDataAvailable
    ? `Use the real trend data for metrics. Do NOT invent numbers.`
    : `Set searchVolumeLabel, competition, and trend to null — no live data available.`
}

Return this EXACT JSON:
{
  "suggestions": [
    {
      "topic": "exact topic phrase",
      "searchVolumeLabel": ${volLabel ? `"${volLabel}" or null` : 'null'},
      "competition": ${serpDataAvailable ? '"Low" or "Medium" or "High" or null' : 'null'},
      "trend": ${serpDataAvailable ? '"Rising" or "Stable" or "Declining" or null' : 'null'},
      "opportunityScore": <integer 0-100>
    }
  ]
}`;

    const models = getProviderModels(aiSettings, 'openrouter', [
      'google/gemma-4-31b-it:free',
      'google/gemma-4-26b-a4b:free',
      'nvidia/nemotron-3-ultra-550b-a55b:free',
    ]);

    let rawText = '';
    for (const model of models) {
      try {
        rawText = await callOpenRouter(orKey, model, prompt);
        if (rawText.trim()) break;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    if (!rawText.trim()) {
      // Graceful fallback: return the autocomplete terms as plain suggestions (no metrics)
      const fallback: TopicSuggestion[] = allTerms.slice(0, 5).map((t) => ({
        topic: t,
        searchVolumeLabel: null,
        competition: null,
        trend: null,
        opportunityScore: null,
      }));
      return NextResponse.json({ suggestions: fallback, serpDataAvailable: false });
    }

    let parsed: { suggestions?: TopicSuggestion[] };
    try {
      parsed = parseJson<{ suggestions?: TopicSuggestion[] }>(rawText);
    } catch {
      const fallback: TopicSuggestion[] = allTerms.slice(0, 5).map((t) => ({
        topic: t,
        searchVolumeLabel: null,
        competition: null,
        trend: null,
        opportunityScore: null,
      }));
      return NextResponse.json({ suggestions: fallback, serpDataAvailable: false });
    }

    const suggestions: TopicSuggestion[] = (parsed.suggestions ?? [])
      .slice(0, 5)
      .map((s) => ({
        topic: String(s.topic ?? '').trim(),
        searchVolumeLabel: serpDataAvailable ? (s.searchVolumeLabel ?? null) : null,
        competition: serpDataAvailable ? (s.competition ?? null) : null,
        trend: serpDataAvailable ? (s.trend ?? null) : null,
        opportunityScore:
          typeof s.opportunityScore === 'number'
            ? Math.max(0, Math.min(100, Math.round(s.opportunityScore)))
            : null,
      }))
      .filter((s) => s.topic);

    return NextResponse.json({ suggestions, serpDataAvailable });
  } catch (err) {
    console.error('[articles/topics]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Topic suggestions unavailable.' },
      { status: 500 },
    );
  }
}
