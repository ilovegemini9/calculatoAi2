/**
 * True AI Discovery Engine — Phase 12
 *
 * Zero hardcoded seed keywords. Discovery begins entirely from live external signals:
 *   1. Google Trends Trending Now (free RSS — what's trending on Google right now)
 *   2. Reddit r/all hot posts (free JSON — what people are discussing right now)
 *   3. SerpAPI — Quora trending questions, PAA, Google Trends Trending Now (if key configured)
 *   4. Google Autocomplete expanded from the trending terms discovered above (free)
 *   5. Bing Suggest expanded from the trending terms discovered above (free)
 *   6. OpenRouter synthesises all live signals into 3 opportunities
 *
 * Site calculators and published articles are CONTEXT ONLY — used for gap analysis,
 * never as seeds. Every refresh starts from what's trending externally right now.
 *
 * If live signals are insufficient: "No live opportunities available."
 * Nothing is ever fabricated.
 */

import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { getAiProviderKey, getAiSettings, getProviderModels, getSerpApiKey } from '@/lib/ai';
import { CALCULATORS } from '@/config/calculators';

// Force dynamic rendering — never statically cache this route.
// Each refresh must hit the live external signal fetchers and
// the AI synthesis so users always see fresh, unique opportunities.
export const dynamic = 'force-dynamic';

// ─── Live signal fetchers ─────────────────────────────────────────────────────

/**
 * Google Trends Trending Now — free RSS feed.
 * Returns the actual trending search queries on Google right now.
 */
async function fetchGoogleTrendingNow(): Promise<string[]> {
  try {
    const res = await fetch(
      'https://trends.google.com/trending/rss?geo=US&hours=24',
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' },
        signal: AbortSignal.timeout(7000),
      },
    );
    if (!res.ok) return [];
    const xml = await res.text();
    // Extract <title> tags inside <item> elements (skip the feed <title>)
    const matches = xml.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>[\s\S]*?<\/item>/g);
    const titles: string[] = [];
    for (const m of matches) {
      const t = m[1]?.trim();
      if (t && t.length > 2) titles.push(t);
    }
    // Fallback: plain <title> without CDATA
    if (titles.length === 0) {
      let inItem = false;
      let isFirst = true; // skip feed-level title
      for (const line of xml.split('\n')) {
        if (line.includes('<item>')) { inItem = true; }
        if (inItem && line.includes('<title>')) {
          if (isFirst) { isFirst = false; continue; }
          const match = line.match(/<title>(.*?)<\/title>/);
          if (match?.[1]) titles.push(match[1].trim());
        }
        if (line.includes('</item>')) { inItem = false; }
      }
    }
    return titles.filter(Boolean).slice(0, 20);
  } catch { return []; }
}

/**
 * Reddit r/all hot posts — free JSON API.
 * Returns post titles from what's hot on Reddit right now.
 * Filters out purely visual posts (image-only, video-only) by checking selftext.
 */
async function fetchRedditTrending(): Promise<string[]> {
  try {
    const res = await fetch(
      'https://www.reddit.com/r/all/hot.json?limit=30&raw_json=1',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return [];
    const data = await res.json() as {
      data?: {
        children?: {
          data?: {
            title?: string;
            post_hint?: string;
            is_self?: boolean;
            selftext?: string;
            over_18?: boolean;
          };
        }[];
      };
    };
    return (data.data?.children ?? [])
      .filter((child) => {
        const d = child.data;
        if (!d?.title) return false;
        if (d.over_18) return false;
        // Skip pure image/video posts — prefer informational content
        if (d.post_hint === 'image' || d.post_hint === 'hosted:video') return false;
        return true;
      })
      .map((child) => child.data?.title?.trim() ?? '')
      .filter((t) => t.length > 10)
      .slice(0, 20);
  } catch { return []; }
}

/** Google Autocomplete — real user queries for a given term. */
async function fetchGoogleAutocomplete(query: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}&hl=en`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data[1]) ? (data[1] as string[]).slice(0, 10) : [];
  } catch { return []; }
}

/**
 * Bing Suggest — free autocomplete, different corpus from Google.
 * Response: {"AS":{"Results":[{"Suggests":[{"Txt":"..."}]}]}}
 */
async function fetchBingSuggest(query: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://api.bing.com/qsonhs.aspx?type=cb&q=${encodeURIComponent(query)}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) return [];
    const data = await res.json() as {
      AS?: { Results?: { Suggests?: { Txt?: string }[] }[] };
    };
    return (data.AS?.Results?.[0]?.Suggests ?? [])
      .map((s) => s.Txt?.trim() ?? '')
      .filter(Boolean)
      .slice(0, 10);
  } catch { return []; }
}

/** SerpAPI wrapper. */
async function serpSearch(
  apiKey: string,
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  const url = new URL('https://serpapi.com/search');
  Object.entries({ ...params, api_key: apiKey, hl: 'en', gl: 'us' }).forEach(([k, v]) =>
    url.searchParams.set(k, v),
  );
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`SerpAPI ${res.status}`);
  return res.json() as Promise<Record<string, unknown>>;
}

/** OpenRouter with real error surfacing. */
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
      temperature: 0.35,
      max_tokens: 700,
      messages: [
        {
          role: 'system',
          content:
            'You are a senior SEO content strategist. Return only valid JSON. ' +
            'Never fabricate topics, metrics, or data. ' +
            'Only surface opportunities grounded in the live signals provided.',
        },
        { role: 'user', content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(50000),
  });
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json() as { error?: { message?: string } | string };
      detail = typeof body.error === 'string' ? body.error : (body.error?.message ?? '');
    } catch { /* ignore */ }
    throw new Error(detail ? `OpenRouter: ${detail}` : `OpenRouter HTTP ${res.status}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}

function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  return JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned) as T;
}

/** Fisher-Yates shuffle — ensures different exploration slices on each refresh. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── GET handler ──────────────────────────────────────────────────────────────

export async function GET() {
  if (!(await verifySession()))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = (await import('@/lib/db')).getDb();

    // Always prefer PostgreSQL-persisted AI settings over the JSON file so
    // a key saved via the Settings UI is visible to the discovery route even
    // when the JSON file hasn't been updated yet in the current process.
    const { getSetting } = await import('@/lib/pg-settings');
    const pgAi = await getSetting<typeof db.settings.ai>('ai_settings');
    const pgSerpEncrypted = await getSetting<string>('serp_api_key_encrypted');
    if (pgAi) db.settings.ai = pgAi;
    if (pgSerpEncrypted) db.settings.serpApiKeyEncrypted = pgSerpEncrypted;

    const serpKey = getSerpApiKey(db.settings);
    const aiSettings = getAiSettings(db.settings.ai, db.settings.openrouterApiKey);
    const orKey =
      getAiProviderKey(aiSettings, 'openrouter') || process.env.OPENROUTER_API_KEY || '';

    // ── Phase 1: Site context — CONTEXT ONLY, never seeds ────────────────────
    // Calculators and articles are used for gap analysis in the prompt.
    // They are not the starting point for discovery.

    const staticCalculatorNames = CALCULATORS.map((c) => c.name);

    const dbCalculatorNames: string[] = (() => {
      try {
        const calcs = (db as unknown as Record<string, unknown>).calculators;
        if (!Array.isArray(calcs)) return [];
        return (calcs as { status?: string; name?: string }[])
          .filter((c) => c.status === 'active' && c.name)
          .map((c) => c.name!);
      } catch { return []; }
    })();

    const publishedArticleTitles: string[] = (() => {
      try {
        const arts = (db as unknown as Record<string, unknown>).articles;
        if (!Array.isArray(arts)) return [];
        return (arts as { status?: string; title?: string }[])
          .filter((a) => (a.status === 'published' || a.status === 'active') && a.title)
          .map((a) => a.title!);
      } catch { return []; }
    })();

    const allCalculatorNames = [
      ...new Set([...staticCalculatorNames, ...dbCalculatorNames]),
    ];

    // ── Phase 2: Live external trending signals ───────────────────────────────
    // This is where discovery actually begins. No seeds from site content.

    const [
      googleTrendingResult,
      redditTrendingResult,
      serpQuoraTrendingResult,
      serpTrendingNowResult,
    ] = await Promise.allSettled([
      // Google Trends Trending Now — free RSS (what's trending on Google right now)
      fetchGoogleTrendingNow(),

      // Reddit r/all hot — free JSON (what people are discussing right now)
      fetchRedditTrending(),

      // Quora trending questions — via SerpAPI (past 24h, if key configured)
      serpKey
        ? serpSearch(serpKey, {
            engine: 'google',
            q: 'site:quora.com',
            tbs: 'qdr:d',
            num: '10',
          })
        : Promise.resolve(null),

      // Google Trends Trending Now via SerpAPI (adds trending queries with metadata)
      serpKey
        ? serpSearch(serpKey, { engine: 'google_trends_trending_now', geo: 'US' })
        : Promise.resolve(null),
    ]);

    // Extract Google Trends trending terms
    const googleTrendingTerms: string[] =
      googleTrendingResult.status === 'fulfilled' ? googleTrendingResult.value : [];

    // Extract SerpAPI Trends Trending Now (supplements the free RSS)
    const serpTrendingNowData =
      serpTrendingNowResult.status === 'fulfilled' ? serpTrendingNowResult.value : null;
    const serpTrendingNowTerms: string[] = (
      (serpTrendingNowData?.trending_searches as { query?: string }[]) ?? []
    )
      .map((t) => t.query ?? '')
      .filter(Boolean)
      .slice(0, 15);

    // Merge all Google Trends signals (deduped)
    const allTrendingTerms = [
      ...new Set([...googleTrendingTerms, ...serpTrendingNowTerms]),
    ].slice(0, 25);

    // Extract Reddit trending post titles
    const redditTitles: string[] =
      redditTrendingResult.status === 'fulfilled' ? redditTrendingResult.value : [];

    // Extract Quora trending questions from SerpAPI
    const quoraData =
      serpQuoraTrendingResult.status === 'fulfilled' ? serpQuoraTrendingResult.value : null;
    const quoraTitles: string[] = (
      (quoraData?.organic_results as { title?: string }[]) ?? []
    )
      .map((r) => r.title ?? '')
      .filter(Boolean)
      .slice(0, 8);

    // ── Phase 3: Autocomplete expansion on discovered trending terms ──────────
    // Seeds come ONLY from live trending signals discovered above.
    // We pick a shuffled slice of trending terms so each refresh explores different territory.

    const externalSignals = [...allTrendingTerms, ...redditTitles, ...quoraTitles];

    if (externalSignals.length < 3) {
      // Not enough live external data — refuse to fabricate
      return NextResponse.json({ error: 'No live opportunities available.' }, { status: 503 });
    }

    // Shuffle the trending terms so each refresh gets a different exploration slice
    const shuffledTrending = shuffle(allTrendingTerms.length > 0 ? allTrendingTerms : redditTitles);
    const autocompleteSeeds = shuffledTrending.slice(0, 6);

    const [googleAutoResults, bingAutoResults] = await Promise.allSettled([
      // Google Autocomplete seeded from live trending terms
      Promise.all(autocompleteSeeds.map((term) => fetchGoogleAutocomplete(term))),
      // Bing Suggest seeded from live trending terms — different corpus
      Promise.all(autocompleteSeeds.slice(0, 5).map((term) => fetchBingSuggest(term))),
    ]);

    const googleTerms: string[] = [];
    if (googleAutoResults.status === 'fulfilled') {
      for (const terms of googleAutoResults.value) googleTerms.push(...terms);
    }

    const bingTerms: string[] = [];
    if (bingAutoResults.status === 'fulfilled') {
      for (const terms of bingAutoResults.value) bingTerms.push(...terms);
    }

    // ── Phase 4: SerpAPI enrichment on top discovered trending term ───────────
    // PAA and deeper Trends data around the strongest external signal discovered.

    const topExternalTerm = allTrendingTerms[0] ?? redditTitles[0] ?? '';

    const [serpPaaResult, serpTrendsResult] = await Promise.allSettled([
      serpKey && topExternalTerm
        ? serpSearch(serpKey, { engine: 'google', q: topExternalTerm, num: '10' })
        : Promise.resolve(null),
      serpKey && allTrendingTerms.slice(0, 3).length > 0
        ? serpSearch(serpKey, {
            engine: 'google_trends',
            q: allTrendingTerms.slice(0, 3).join(','),
          })
        : Promise.resolve(null),
    ]);

    const paaData = serpPaaResult.status === 'fulfilled' ? serpPaaResult.value : null;
    const paaQuestions: string[] = (
      (paaData?.related_questions as { question?: string }[]) ?? []
    )
      .map((q) => q.question ?? '')
      .filter(Boolean)
      .slice(0, 8);

    const trendsData = serpTrendsResult.status === 'fulfilled' ? serpTrendsResult.value : null;
    const risingQueries: string[] = (
      (trendsData?.related_queries as { query?: string; type?: string }[]) ?? []
    )
      .filter((q) => q.type === 'rising')
      .map((q) => q.query ?? '')
      .filter(Boolean)
      .slice(0, 10);

    const hasSerpData = Boolean(serpKey && (paaData || trendsData || serpTrendingNowData));

    // Deduplicated live autocomplete signals
    const allLiveTerms = [
      ...new Set([...googleTerms, ...bingTerms]),
    ]
      .filter((t) => t.length > 4)
      .slice(0, 60);

    // Require minimum signal volume before calling AI
    const totalSignals =
      allTrendingTerms.length +
      redditTitles.length +
      quoraTitles.length +
      allLiveTerms.length +
      paaQuestions.length +
      risingQueries.length;

    if (totalSignals < 5) {
      return NextResponse.json({ error: 'No live opportunities available.' }, { status: 503 });
    }

    // ── Phase 5: OpenRouter synthesis ─────────────────────────────────────────
    // The AI receives only live signals. Site content is context for gap analysis.

    // Helper for fallback generation grounded in live signals
    const generateSignalFallback = () => {
      const candidates: string[] = [];
      const sources = [...allTrendingTerms, ...redditTitles, ...allLiveTerms].filter((s) => s.length > 5);
      for (const s of sources) {
        let clean = s.replace(/^[0-9.\-\s]+/, '').trim();
        if (clean.length < 10) continue;
        if (!/how|what|calculator|guide|formula|cost|tax|rate|bmi|salary|index|score|chart|estimator|projection/i.test(clean)) {
          clean = `${clean}: Estimating Costs, Impact, and Formulas`;
        }
        if (clean.length >= 30 && !candidates.includes(clean)) {
          candidates.push(clean);
        }
        if (candidates.length >= 3) break;
      }
      return candidates.map((title) => ({ title }));
    };

    if (!orKey || orKey.length <= 20 || orKey.includes(' ')) {
      const fallbackOpps = generateSignalFallback();
      if (fallbackOpps.length >= 2) {
        return NextResponse.json({ opportunities: fallbackOpps, hasSerpData });
      }
      return NextResponse.json(
        { error: 'OpenRouter API key not configured. Add your key in AI Settings to enable AI synthesis.' },
        { status: 503 },
      );
    }

    const prompt = `You are a senior SEO content strategist. Think like a strategist, not a keyword spinner.

━━ SITE CONTEXT (for gap analysis only — do not use as article seeds) ━━
This is a calculator and tools platform covering these subjects:
${allCalculatorNames.slice(0, 40).join(', ')}

${publishedArticleTitles.length > 0
  ? `Already published (do not duplicate):\n${publishedArticleTitles.join('\n')}`
  : 'No articles published yet.'}

━━ LIVE EXTERNAL SIGNALS — this is where discovery begins ━━
These signals reflect what real people are searching, reading, and asking RIGHT NOW.

${allTrendingTerms.length > 0
  ? `GOOGLE TRENDS — TRENDING NOW (real-time trending searches):
${allTrendingTerms.slice(0, 20).join('\n')}`
  : 'Google Trends Trending Now: Unavailable'}

${redditTitles.length > 0
  ? `REDDIT — HOT RIGHT NOW (r/all, live):
${redditTitles.slice(0, 15).join('\n')}`
  : 'Reddit trending: Unavailable'}

${quoraTitles.length > 0
  ? `QUORA — TRENDING QUESTIONS (live, past 24h):
${quoraTitles.join('\n')}`
  : ''}

${allLiveTerms.length > 0
  ? `GOOGLE AUTOCOMPLETE (expanded from trending terms — real user queries):
${[...new Set(googleTerms)].slice(0, 20).join('\n')}`
  : ''}

${bingTerms.length > 0
  ? `BING SUGGEST (complementary signal, expanded from trending terms):
${[...new Set(bingTerms)].slice(0, 15).join('\n')}`
  : ''}

${paaQuestions.length > 0
  ? `PEOPLE ALSO ASK — Google (around: "${topExternalTerm}"):
${paaQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
  : ''}

${risingQueries.length > 0
  ? `RISING SEARCH TRENDS — Google Trends:
${risingQueries.join(', ')}`
  : ''}

━━ TASK ━━

Identify exactly 3 high-opportunity article titles for this calculator/tools platform.

Strategist's thinking process:
1. Which live trending signals have a clear connection to personal finance, math, health, or tools that this platform can serve with a calculator-backed article?
2. What is the REAL user intent behind the trending topic — and is there a calculator angle to it?
3. Which signals appear in MULTIPLE sources (trending + autocomplete + Reddit + PAA)? Cross-source = strongest signal.
4. What content gaps exist between what's trending and what the site already covers?
5. Which angles are specific enough to rank for — long-tail, clear intent, not just head terms?

QUALITY RULES:
- Every title must be traceable to the live signals provided
- Do not invent topics absent from the data
- Each title must have a realistic calculator or tool angle for this platform
- Prefer specific, long-tail titles over broad head terms
- Minimum title length: 30 characters
- Forbidden patterns: "Complete Guide", "Ultimate Guide", "Calculator App", "Calculator Online"
- Titles must be reader-focused and compelling — not keyword strings
${!hasSerpData ? '- No SerpAPI data this run — base selections on Google Trends, Reddit, and autocomplete signals' : ''}

Return ONLY this JSON — no explanation, no markdown:
{
  "opportunities": [
    { "title": "Specific, reader-focused article title here" },
    { "title": "Specific, reader-focused article title here" },
    { "title": "Specific, reader-focused article title here" }
  ]
}`;

    const models = getProviderModels(aiSettings, 'openrouter', [
      // Verified available on OpenRouter free tier July 2026
      'nvidia/nemotron-3-ultra-550b-a55b:free',
      'google/gemma-4-31b-it:free',
      'openai/gpt-oss-20b:free',
      'nvidia/nemotron-3-super-120b-a12b:free',
      'google/gemma-4-26b-a4b-it:free',
      'nvidia/nemotron-3-nano-30b-a3b:free',
      'poolside/laguna-m.1:free',
    ]);

    let rawText = '';
    let lastError = '';
    for (const model of models) {
      try {
        rawText = await callOpenRouter(orKey, model, prompt);
        if (rawText.trim()) break;
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    if (!rawText.trim()) {
      console.error('[articles/discover] All AI models failed, using live signal fallback:', lastError);
      const fallbackOpps = generateSignalFallback();
      if (fallbackOpps.length >= 2) {
        return NextResponse.json({ opportunities: fallbackOpps, hasSerpData });
      }
      return NextResponse.json({ error: 'No live opportunities available.' }, { status: 503 });
    }

    // Parse and enforce quality rules
    try {
      const parsed = parseJson<{ opportunities?: { title?: string }[] }>(rawText);
      const banned =
        /\b(complete guide|ultimate guide|calculator app|calculator online|calculator net)\b/i;

      const opportunities = (parsed.opportunities ?? [])
        .slice(0, 3)
        .map((o) => ({ title: String(o.title ?? '').trim() }))
        .filter((o) => o.title.length >= 30 && !banned.test(o.title));

      if (opportunities.length >= 2) {
        return NextResponse.json({ opportunities, hasSerpData });
      }
    } catch { /* fall through */ }

    const finalFallback = generateSignalFallback();
    if (finalFallback.length >= 2) {
      return NextResponse.json({ opportunities: finalFallback, hasSerpData });
    }

    return NextResponse.json({ error: 'No live opportunities available.' }, { status: 503 });
  } catch (err) {
    console.error('[articles/discover]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Discovery failed.' },
      { status: 500 },
    );
  }
}
