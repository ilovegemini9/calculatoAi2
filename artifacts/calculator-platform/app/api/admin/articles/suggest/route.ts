import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { getAiProviderKey, getAiSettings, getProviderModels } from '@/lib/ai';

type SuggestionKind = 'titles' | 'keywords' | 'slug';

async function fetchAutocomplete(query: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}&hl=en`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CalculatorPlatform/1.0)' },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data[1]) ? (data[1] as string[]).slice(0, 12) : [];
  } catch {
    return [];
  }
}

async function fetchRelatedSearches(query: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CalculatorPlatform/1.0)' },
        signal: AbortSignal.timeout(6000),
      },
    );
    if (!response.ok) return [];
    const data = await response.json() as { RelatedTopics?: { Text?: string }[] };
    return (data.RelatedTopics ?? [])
      .map((item) => item.Text?.split('\n')[0]?.trim() ?? '')
      .filter(Boolean)
      .slice(0, 8);
  } catch {
    return [];
  }
}

async function callOpenRouter(apiKey: string, model: string, prompt: string) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://calculatorplatform.com',
      'X-Title': 'Professional Calculator Platform',
    },
    body: JSON.stringify({
      model,
      temperature: 0.5,
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content: 'Return only valid JSON. Never invent search volume, competition, difficulty, traffic, or other metrics.',
        },
        { role: 'user', content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`OpenRouter error ${response.status}: ${response.statusText}`);
  const data = await response.json() as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}

function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  return JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned) as T;
}

function unavailable() {
  return NextResponse.json({ error: 'Live keyword data unavailable.' }, { status: 503 });
}

async function callWithModelFallbacks(
  apiKey: string,
  models: string[],
  prompt: string,
) {
  let lastError = '';
  for (const model of models) {
    try {
      const raw = await callOpenRouter(apiKey, model, prompt);
      if (raw.trim()) return raw;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  throw new Error(lastError || 'All configured AI models failed.');
}

export async function POST(req: Request) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json() as { kind?: SuggestionKind; title?: string };
    const kind = body.kind;
    if (!kind || !['titles', 'keywords', 'slug'].includes(kind)) {
      return NextResponse.json({ error: 'kind must be titles, keywords, or slug' }, { status: 400 });
    }
    const title = body.title?.trim() ?? '';
    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

    const db = (await import('@/lib/db')).getDb();
    const aiSettings = getAiSettings(db.settings.ai, db.settings.openrouterApiKey);
    const apiKey = getAiProviderKey(aiSettings, 'openrouter') || process.env.OPENROUTER_API_KEY || '';
    if (!apiKey) return unavailable();

    const models = getProviderModels(aiSettings, 'openrouter', [
      'google/gemma-4-31b-it:free',
      'google/gemma-4-26b-a4b:free',
      'nvidia/nemotron-3-ultra-550b-a55b:free',
    ]);

    if (kind === 'slug') {
      const raw = await callWithModelFallbacks(apiKey, models, `Create one concise, lowercase, hyphenated SEO URL slug for this article title:

${title}

Return exactly {"slug":"..."} with no more than 8 words.`);
      const parsed = parseJson<{ slug?: string }>(raw);
      const slug = (parsed.slug ?? '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');
      return slug ? NextResponse.json({ slug }) : unavailable();
    }

    const liveQueries = kind === 'titles'
      ? [title, `${title} guide`, `how to ${title}`, `best ${title}`]
      : [title, `${title} calculator`, `${title} guide`, `how to ${title}`, `best ${title}`];
    const liveResults = await Promise.all([
      ...liveQueries.map(fetchAutocomplete),
      fetchRelatedSearches(title),
    ]);
    const liveTerms = [...new Set(liveResults.flat().map((term) => term.trim()).filter(Boolean))].slice(0, 40);
    if (liveTerms.length === 0) return unavailable();

    const prompt = kind === 'titles'
      ? `Using only these live search suggestions, create 10 distinct SEO-friendly article titles for the topic "${title}".

LIVE SEARCH SUGGESTIONS:
${liveTerms.map((term, index) => `${index + 1}. ${term}`).join('\n')}

Return exactly {"suggestions":["title 1","title 2",...]} with 10 useful titles. Do not include search metrics.`
      : `Using only these live search suggestions, create 10 distinct focus keywords closely related to the article title "${title}".

LIVE SEARCH SUGGESTIONS:
${liveTerms.map((term, index) => `${index + 1}. ${term}`).join('\n')}

Return exactly {"suggestions":["keyword 1","keyword 2",...]} with 10 useful keyword phrases. Do not include search metrics.`;
    const raw = await callWithModelFallbacks(apiKey, models, prompt);
    const parsed = parseJson<{ suggestions?: unknown }>(raw);
    const suggestions = Array.isArray(parsed.suggestions)
      ? [...new Set(parsed.suggestions.filter((value): value is string => typeof value === 'string').map((value) => value.trim()).filter(Boolean))].slice(0, 10)
      : [];
    return suggestions.length ? NextResponse.json({ suggestions, liveData: true }) : unavailable();
  } catch (error) {
    console.error('[articles/suggest]', error);
    return unavailable();
  }
}