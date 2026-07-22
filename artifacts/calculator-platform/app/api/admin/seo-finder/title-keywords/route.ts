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

async function callOpenRouter(apiKey: string, model: string, messages: { role: string; content: string }[], responseFormat?: { type: string }): Promise<string> {
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
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${res.statusText}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}

export async function POST(req: Request) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { title, keyword, existingKeywords = [] } = await req.json() as {
      title: string;
      keyword: string;
      existingKeywords: string[];
    };

    if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 });

    const db = getDb();
    const orKey =
      db.settings.openrouterApiKey ||
      process.env.OPENROUTER_API_KEY ||
      (process.env.OPENAI_API_KEY?.startsWith('sk-or-') ? process.env.OPENAI_API_KEY : '') ||
      '';
    if (!orKey) return NextResponse.json({ error: 'No AI API key configured.' }, { status: 400 });

    // Fetch title-specific autocomplete in parallel
    const [mainAC, lsiAC, questionAC, compareAC] = await Promise.all([
      fetchAutocomplete(title),
      fetchAutocomplete(`${keyword} tips`),
      fetchAutocomplete(`how to ${keyword}`),
      fetchAutocomplete(`${keyword} vs`),
    ]);

    const rawSuggestions = [...new Set([...mainAC, ...lsiAC, ...questionAC, ...compareAC])].slice(0, 20);

    const systemPrompt = `You are a Senior SEO Keyword Strategist. Analyze autocomplete data and generate targeted keyword suggestions for a specific article title.

CRITICAL: Output ONLY a valid JSON object. No markdown, no code fences.`;

    const userPrompt = `Article Title: "${title}"
Primary Keyword: "${keyword}"
Already Selected Keywords (DO NOT repeat these): ${existingKeywords.length > 0 ? existingKeywords.join(', ') : 'none'}

Google Autocomplete Data for this title:
${rawSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Generate exactly 20 keyword suggestions specifically for this article title.
Each keyword must be:
- Directly relevant to the article title
- NOT in the "Already Selected Keywords" list
- A mix of: primary variations, LSI semantics, long-tail questions, comparison terms, how-to phrases

Return this EXACT JSON:
{
  "keywords": [
    {
      "keyword": string,
      "type": "primary" | "lsi" | "question" | "longtail" | "comparison",
      "relevanceScore": integer 0-100,
      "searchVolume": string (e.g. "500-1K"),
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}`;

    const models = [
      'google/gemma-4-31b-it:free',
      'google/gemma-4-26b-a4b:free',
      'nvidia/nemotron-3-ultra-550b-a55b:free',
    ];

    let rawText = '';
    for (const model of models) {
      try {
        rawText = await callOpenRouter(orKey, model, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ], { type: 'json_object' });
        if (rawText.trim()) break;
      } catch {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    if (!rawText.trim()) throw new Error('Failed to generate keyword suggestions. Try again.');

    let parsed: { keywords: unknown[] };
    try {
      const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      parsed = JSON.parse(start !== -1 && end > start ? cleaned.slice(start, end + 1) : cleaned);
    } catch {
      throw new Error('AI returned invalid JSON.');
    }

    if (!Array.isArray(parsed.keywords) || parsed.keywords.length === 0) {
      throw new Error('No keywords returned. Try again.');
    }

    // Filter out any that match existing keywords (case-insensitive)
    const existingLower = existingKeywords.map((k) => k.toLowerCase().trim());
    const keywords = (parsed.keywords as Record<string, unknown>[])
      .filter((k) => !existingLower.includes(String(k.keyword).toLowerCase().trim()))
      .map((k) => ({
        keyword: String(k.keyword),
        type: k.type ?? 'lsi',
        relevanceScore: Math.max(0, Math.min(100, Number(k.relevanceScore) || 70)),
        searchVolume: String(k.searchVolume ?? 'Unknown'),
        difficulty: k.difficulty ?? 'medium',
        locked: false,
      }));

    return NextResponse.json({ keywords, title });
  } catch (err: unknown) {
    console.error('[title-keywords] Error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}
