import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { getAiProviderKey, getAiSettings, getProviderModels, getSerpApiKey } from '@/lib/ai';
import type { ArticleResearchSummary, ResearchTitleCard } from '@/lib/types';

// ─── SerpAPI helpers ──────────────────────────────────────────────────────────

async function serpSearch(apiKey: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const url = new URL('https://serpapi.com/search');
  Object.entries({ ...params, api_key: apiKey, hl: 'en', gl: 'us' }).forEach(([k, v]) =>
    url.searchParams.set(k, v),
  );
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`SerpAPI ${res.status}: ${res.statusText}`);
  return res.json() as Promise<Record<string, unknown>>;
}

interface SerpOrganic { title?: string; link?: string; snippet?: string }
interface SerpPAA { question?: string }
interface SerpRelated { query?: string }
interface SerpTrendTimeline { values?: { extracted_value?: number }[] }
interface SerpTrendQuery { query?: string; type?: string }

function deriveTrendDirection(timeline: SerpTrendTimeline[]): 'rising' | 'stable' | 'declining' | null {
  if (!timeline || timeline.length < 8) return null;
  const vals = timeline.map((t) => (t.values?.[0]?.extracted_value ?? 0));
  const half = Math.floor(vals.length / 2);
  const first = vals.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const second = vals.slice(half).reduce((a, b) => a + b, 0) / (vals.length - half);
  const delta = second - first;
  if (delta > 8) return 'rising';
  if (delta < -8) return 'declining';
  return 'stable';
}

function interestToVolumeLabel(interest: number | null): string | null {
  if (interest === null) return null;
  if (interest >= 80) return '50K+/mo';
  if (interest >= 60) return '10K–50K/mo';
  if (interest >= 35) return '1K–10K/mo';
  if (interest >= 10) return '100–1K/mo';
  return '< 100/mo';
}

// ─── Free fallbacks ───────────────────────────────────────────────────────────

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

async function fetchDuckDuckGo(query: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' }, signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return [];
    const data = await res.json() as { RelatedTopics?: { Text?: string }[] };
    return (data.RelatedTopics ?? [])
      .map((t) => t.Text?.split('\n')[0]?.trim() ?? '')
      .filter(Boolean).slice(0, 8);
  } catch { return []; }
}

async function fetchQuestionAutocomplete(query: string): Promise<string[]> {
  const prefixes = ['how to', 'what is', 'why', 'when to', 'can i', 'is it', 'how much', 'what are'];
  const results = await Promise.allSettled(prefixes.map((p) => fetchAutocomplete(`${p} ${query}`)));
  return [...new Set(
    results
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => (r as PromiseFulfilledResult<string[]>).value),
  )].slice(0, 12);
}

// ─── OpenRouter ───────────────────────────────────────────────────────────────

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
      'X-Title': 'Calculator Platform',
    },
    body: JSON.stringify({ model, messages, response_format: { type: 'json_object' } }),
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${res.statusText}`);
  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}

function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  return JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned) as T;
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { topic } = await req.json() as { topic?: string };
    if (!topic?.trim()) return NextResponse.json({ error: 'topic is required' }, { status: 400 });

    const db = getDb();
    const serpKey = getSerpApiKey(db.settings);
    const aiSettings = getAiSettings(db.settings.ai, db.settings.openrouterApiKey);
    const orKey =
      getAiProviderKey(aiSettings, 'openrouter') ||
      process.env.OPENROUTER_API_KEY || '';
    if (!orKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured. Add it in Settings → AI Configuration.' },
        { status: 400 },
      );
    }

    // ── Phase 1: Parallel data collection ────────────────────────────────────

    const serpDataAvailable = Boolean(serpKey);

    const [
      serpGoogleResult,
      serpTrendsResult,
      serpRedditResult,
      autocomplete,
      duckduckgo,
      questionAC,
    ] = await Promise.allSettled([
      serpKey ? serpSearch(serpKey, { engine: 'google', q: topic, num: '10' }) : Promise.resolve(null),
      serpKey ? serpSearch(serpKey, { engine: 'google_trends', q: topic }) : Promise.resolve(null),
      serpKey ? serpSearch(serpKey, { engine: 'google', q: `site:reddit.com ${topic}`, num: '5' }) : Promise.resolve(null),
      fetchAutocomplete(topic),
      fetchDuckDuckGo(topic),
      fetchQuestionAutocomplete(topic),
    ]);

    // Extract SerpAPI data
    const googleData = serpGoogleResult.status === 'fulfilled' ? serpGoogleResult.value : null;
    const trendsData = serpTrendsResult.status === 'fulfilled' ? serpTrendsResult.value : null;
    const redditData = serpRedditResult.status === 'fulfilled' ? serpRedditResult.value : null;

    const organicResults: { title: string; link: string; snippet: string }[] =
      ((googleData?.organic_results as SerpOrganic[]) ?? [])
        .slice(0, 8)
        .map((r) => ({ title: r.title ?? '', link: r.link ?? '', snippet: r.snippet ?? '' }))
        .filter((r) => r.title);

    const featuredSnippet = (() => {
      const fs = googleData?.featured_snippet as { title?: string; snippet?: string } | undefined;
      if (!fs?.snippet) return null;
      return { title: fs.title ?? '', snippet: fs.snippet };
    })();

    const paaQuestions: string[] = (() => {
      const serpPaa = ((googleData?.related_questions as SerpPAA[]) ?? [])
        .map((q) => q.question ?? '').filter(Boolean).slice(0, 8);
      const freePaa = autocomplete.status === 'fulfilled'
        ? (questionAC.status === 'fulfilled' ? questionAC.value : [])
        : [];
      return [...new Set([...serpPaa, ...freePaa])].slice(0, 10);
    })();

    const relatedSearches: string[] = (() => {
      const serpRelated = ((googleData?.related_searches as SerpRelated[]) ?? [])
        .map((r) => r.query ?? '').filter(Boolean);
      const freeRelated = duckduckgo.status === 'fulfilled' ? duckduckgo.value : [];
      return [...new Set([...serpRelated, ...freeRelated])].slice(0, 10);
    })();

    const trendTimeline = (trendsData?.interest_over_time as { timeline_data?: SerpTrendTimeline[] })
      ?.timeline_data ?? [];
    const trendInterest = trendTimeline.length > 0
      ? Math.round(
          trendTimeline.slice(-4).reduce((sum, t) => sum + (t.values?.[0]?.extracted_value ?? 0), 0) /
          Math.min(4, trendTimeline.length),
        )
      : null;
    const trendDirection = deriveTrendDirection(trendTimeline);
    const trendingQueries: string[] = ((trendsData?.related_queries as SerpTrendQuery[]) ?? [])
      .filter((q) => q.type === 'rising').map((q) => q.query ?? '').filter(Boolean).slice(0, 6);

    const redditCount = ((redditData?.organic_results as unknown[]) ?? []).length;

    const ac = autocomplete.status === 'fulfilled' ? autocomplete.value : [];

    // ── Phase 2: AI analysis → 5 title cards ─────────────────────────────────

    const serpSummary = serpDataAvailable
      ? `
GOOGLE ORGANIC RESULTS (top ${organicResults.length}):
${organicResults.map((r, i) => `${i + 1}. [${r.title}] ${r.link}\n   ${r.snippet}`).join('\n')}

FEATURED SNIPPET: ${featuredSnippet ? `"${featuredSnippet.snippet}"` : 'None'}

PEOPLE ALSO ASK:
${paaQuestions.slice(0, 6).map((q, i) => `${i + 1}. ${q}`).join('\n') || 'None collected'}

GOOGLE TRENDS:
- Interest score (0-100): ${trendInterest ?? 'Unavailable'}
- Direction: ${trendDirection ?? 'Unknown'}
- Rising queries: ${trendingQueries.slice(0, 4).join(', ') || 'None'}

RELATED SEARCHES:
${relatedSearches.slice(0, 6).map((s, i) => `${i + 1}. ${s}`).join('\n') || 'None'}

REDDIT DISCUSSIONS FOUND: ${redditCount}`
      : '';

    const freeSummary = `
GOOGLE AUTOCOMPLETE:
${ac.map((s, i) => `${i + 1}. ${s}`).join('\n') || 'None'}

QUESTIONS FROM SEARCH PATTERNS:
${paaQuestions.slice(0, 6).map((q, i) => `${i + 1}. ${q}`).join('\n') || 'None'}

RELATED TERMS (DuckDuckGo):
${relatedSearches.slice(0, 6).map((s, i) => `${i + 1}. ${s}`).join('\n') || 'None'}`;

    const trendVolumeLabel = interestToVolumeLabel(trendInterest);
    const trendCompetition = (() => {
      if (!serpDataAvailable || organicResults.length === 0) return null;
      const strongDomains = organicResults.filter((r) =>
        /\.(gov|edu|org)$/.test(new URL(r.link).hostname) ||
        /wikipedia|nytimes|forbes|cnbc|investopedia/.test(r.link)
      ).length;
      if (strongDomains >= 4) return 'High';
      if (strongDomains >= 2) return 'Medium';
      return 'Low';
    })();

    const systemPrompt = `You are a Senior SEO Strategist. Analyze real search signals and generate the 5 strongest article title opportunities.

CRITICAL: Output ONLY valid JSON. No markdown, no explanation, no code fences.`;

    const userPrompt = `TOPIC: "${topic}"
${serpSummary}
${freeSummary}

CONTEXT:
- Trend interest (0-100): ${trendInterest ?? 'Unavailable (no SerpAPI key)'}
- Trend direction: ${trendDirection ?? 'Unknown'}
- Competition estimate: ${trendCompetition ?? 'Unknown (no SerpAPI data)'}
- Typical search volume range: ${trendVolumeLabel ?? 'Unavailable'}

TASK: Generate exactly 5 distinct, high-opportunity SEO article titles for this topic.

Rules:
- Titles must be AI-created based on research analysis — never copy raw Google/Reddit titles verbatim
- Each title must address a different angle or intent (informational, how-to, comparison, beginner, expert)
- Never invent numeric search volume figures — derive from real data only
- Opportunity score 0-100 must reflect real signals: PAA density, featured snippet gap, competition, trend

Return this EXACT JSON:
{
  "intentAnalysis": "2-3 sentences on dominant user intent and pain points from the research",
  "titleCards": [
    {
      "title": "Full article title here",
      "searchVolumeLabel": ${trendVolumeLabel ? `"${trendVolumeLabel}"` : 'null'},
      "competition": ${trendCompetition ? `"${trendCompetition}"` : 'null'},
      "trend": ${trendDirection ? `"${trendDirection === 'rising' ? 'Rising' : trendDirection === 'declining' ? 'Declining' : 'Stable'}"` : 'null'},
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
    let lastErr = '';
    for (const model of models) {
      try {
        rawText = await callOpenRouter(orKey, model, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ]);
        if (rawText.trim()) break;
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    if (!rawText.trim()) throw new Error(`All AI models failed. Last error: ${lastErr}`);

    let parsed: { intentAnalysis?: string; titleCards?: ResearchTitleCard[] };
    try {
      parsed = parseJson<{ intentAnalysis?: string; titleCards?: ResearchTitleCard[] }>(rawText);
    } catch {
      throw new Error('AI returned invalid JSON. Please try again.');
    }

    const titleCards = (parsed.titleCards ?? []).slice(0, 5).map((c) => ({
      title: String(c.title ?? '').trim(),
      searchVolumeLabel: serpDataAvailable ? (c.searchVolumeLabel ?? null) : null,
      competition: serpDataAvailable ? (c.competition ?? null) : null,
      trend: serpDataAvailable ? (c.trend ?? null) : null,
      opportunityScore: typeof c.opportunityScore === 'number'
        ? Math.max(0, Math.min(100, Math.round(c.opportunityScore)))
        : null,
    })).filter((c) => c.title);

    if (titleCards.length === 0) throw new Error('AI returned no title cards. Please try again.');

    const summary: ArticleResearchSummary = {
      topic,
      liveData: serpDataAvailable || ac.length > 0,
      serpDataAvailable,
      organicCount: organicResults.length,
      hasFeaturedSnippet: !!featuredSnippet,
      paaQuestions,
      relatedSearches,
      trendDirection,
      trendInterest,
      redditCount,
      autocomplete: ac,
      organicResults,
      featuredSnippet,
      trendingQueries,
      titleCards,
    };

    return NextResponse.json({ summary, intentAnalysis: parsed.intentAnalysis ?? '' });
  } catch (err) {
    console.error('[articles/research]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Research failed. Please try again.' },
      { status: 500 },
    );
  }
}
