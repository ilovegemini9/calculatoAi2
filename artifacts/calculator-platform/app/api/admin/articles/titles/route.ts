import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { getAiProviderKey, getAiSettings, getProviderModels, getSerpApiKey } from '@/lib/ai';
import type { ArticleResearchSummary, ResearchTitleCard } from '@/lib/types';

async function fetchAutocomplete(query: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}&hl=en`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)' }, signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data[1]) ? (data[1] as string[]).slice(0, 10) : [];
  } catch { return []; }
}

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
    signal: AbortSignal.timeout(60000),
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

export async function POST(req: Request) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json() as {
      keyword?: string;
      researchSummary?: ArticleResearchSummary;
    };

    const keyword = body.keyword?.trim() ?? '';
    if (!keyword) return NextResponse.json({ error: 'keyword is required' }, { status: 400 });

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

    const research = body.researchSummary;
    const serpDataAvailable = Boolean(serpKey) || Boolean(research?.serpDataAvailable);

    // Gather live signals specific to this keyword
    const [acKeyword, acHowTo, acBest] = await Promise.allSettled([
      fetchAutocomplete(keyword),
      fetchAutocomplete(`how to ${keyword}`),
      fetchAutocomplete(`best ${keyword}`),
    ]);

    const liveTerms = [
      ...(acKeyword.status === 'fulfilled' ? acKeyword.value : []),
      ...(acHowTo.status === 'fulfilled' ? acHowTo.value : []),
      ...(acBest.status === 'fulfilled' ? acBest.value : []),
    ].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 20);

    const paaQuestions = research?.paaQuestions ?? [];
    const relatedSearches = research?.relatedSearches ?? [];
    const trendVolumeLabel = research?.keywordChips?.find((c) => c.keyword === keyword)?.searchVolumeLabel ?? null;
    const trendCompetition = research?.keywordChips?.find((c) => c.keyword === keyword)?.competition ?? null;
    const trendDir = research?.keywordChips?.find((c) => c.keyword === keyword)?.trend ?? null;

    const systemPrompt = `You are a Senior SEO Strategist and expert copywriter. Generate the 5 strongest article titles for a selected keyword.

CRITICAL: Output ONLY valid JSON. No markdown, no explanation, no code fences.`;

    const userPrompt = `SELECTED KEYWORD: "${keyword}"

RESEARCH CONTEXT:
People Also Ask:
${paaQuestions.slice(0, 6).map((q, i) => `${i + 1}. ${q}`).join('\n') || 'None captured'}

Related Searches:
${relatedSearches.slice(0, 6).map((s, i) => `${i + 1}. ${s}`).join('\n') || 'None captured'}

Live Autocomplete Signals:
${liveTerms.slice(0, 15).map((t, i) => `${i + 1}. ${t}`).join('\n') || 'None captured'}

Keyword metrics:
- Search volume: ${trendVolumeLabel ?? 'Unavailable'}
- Competition: ${trendCompetition ?? 'Unavailable'}
- Trend: ${trendDir ?? 'Unavailable'}

TASK: Generate exactly 5 distinct, high-CTR SEO article titles targeting this exact keyword.

Title requirements:
- Must be human, attractive, click-worthy, helpful, and SEO optimized
- Each title must address a different angle or intent:
  1. Informational / educational
  2. How-To / step-by-step
  3. Comparison / best options
  4. Beginner / complete guide
  5. Expert / advanced / tips
- Never copy PAA questions verbatim — use them as inspiration only
- Target 50-65 characters for optimal SERP display
- Rank by: highest CTR potential × ranking opportunity × search intent match

${serpDataAvailable
  ? `Use real research data for metrics. Do NOT invent numbers.`
  : `Set searchVolumeLabel, competition, trend to null — no live data available.`}

Return this EXACT JSON:
{
  "titleCards": [
    {
      "title": "Full article title here",
      "searchVolumeLabel": ${trendVolumeLabel ? `"${trendVolumeLabel}"` : 'null'},
      "competition": ${trendCompetition ? `"${trendCompetition}"` : 'null'},
      "trend": ${trendDir ? `"${trendDir}"` : 'null'},
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

    let parsed: { titleCards?: ResearchTitleCard[] };
    try {
      parsed = parseJson<{ titleCards?: ResearchTitleCard[] }>(rawText);
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

    if (titleCards.length === 0) throw new Error('AI returned no title suggestions. Please try again.');

    return NextResponse.json({ titleCards, serpDataAvailable });
  } catch (err) {
    console.error('[articles/titles]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Title generation failed. Please try again.' },
      { status: 500 },
    );
  }
}
