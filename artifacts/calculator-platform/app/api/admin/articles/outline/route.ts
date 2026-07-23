import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { getAiProviderKey, getAiSettings, getProviderModels } from '@/lib/ai';
import type { ArticleOutlineSection, ArticleResearchSummary } from '@/lib/types';

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

const SECTION_TYPES: ArticleOutlineSection['type'][] = [
  'h2', 'h3', 'faq', 'howto', 'examples', 'comparison', 'proscons', 'internal-links', 'related',
];

export async function POST(req: Request) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json() as {
      title?: string;
      keyword?: string;
      researchSummary?: ArticleResearchSummary;
    };

    const title = body.title?.trim() ?? '';
    const keyword = body.keyword?.trim() ?? '';
    if (!title || !keyword) {
      return NextResponse.json({ error: 'title and keyword are required' }, { status: 400 });
    }

    const db = (await import('@/lib/db')).getDb();
    const aiSettings = getAiSettings(db.settings.ai, db.settings.openrouterApiKey);
    const apiKey = getAiProviderKey(aiSettings, 'openrouter') || process.env.OPENROUTER_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenRouter API key not configured.' }, { status: 400 });
    }

    const research = body.researchSummary;
    const paaQuestions = research?.paaQuestions ?? [];
    const relatedSearches = research?.relatedSearches ?? [];
    const hasFeaturedSnippet = research?.hasFeaturedSnippet ?? false;

    const systemPrompt = `You are a Senior Content Strategist. Generate a detailed, structured article outline.
CRITICAL: Output ONLY valid JSON. No markdown, no explanation, no code fences.`;

    const userPrompt = `ARTICLE TITLE: "${title}"
FOCUS KEYWORD: "${keyword}"

RESEARCH SIGNALS:
People Also Ask (real questions to address):
${paaQuestions.slice(0, 8).map((q, i) => `${i + 1}. ${q}`).join('\n') || 'None captured'}

Related Searches (topics to cover):
${relatedSearches.slice(0, 6).map((s, i) => `${i + 1}. ${s}`).join('\n') || 'None captured'}

Featured snippet opportunity: ${hasFeaturedSnippet ? 'Yes — structure content to capture it' : 'No current snippet'}

OUTLINE REQUIREMENTS:
- Must include: introduction context, H2 main sections, H3 subsections, FAQ section (use PAA questions), How-To section, at least one Comparison or Examples section, Pros & Cons, Related Calculators, Conclusion with CTA
- Each section must directly serve the user's intent
- FAQ must use the real PAA questions above (adapted, not copied verbatim)
- Internal Links section should suggest calculator cross-links

Available section types: "h2", "h3", "faq", "howto", "examples", "comparison", "proscons", "internal-links", "related"

Return this EXACT JSON:
{
  "outline": [
    {
      "id": "sec-1",
      "type": "h2",
      "heading": "Section heading text",
      "subpoints": ["Subpoint 1", "Subpoint 2"]
    }
  ]
}

Generate 10-16 sections total. Make the outline genuinely useful — the kind a professional would actually write from.`;

    const models = getProviderModels(aiSettings, 'openrouter', [
      'google/gemma-4-31b-it:free',
      'nvidia/nemotron-3-ultra-550b-a55b:free',
      'google/gemma-4-26b-a4b:free',
    ]);

    let rawText = '';
    let lastErr = '';
    for (const model of models) {
      try {
        rawText = await callOpenRouter(apiKey, model, [
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

    let parsed: { outline?: ArticleOutlineSection[] };
    try {
      parsed = parseJson<{ outline?: ArticleOutlineSection[] }>(rawText);
    } catch {
      throw new Error('AI returned invalid JSON. Please try again.');
    }

    const outline = (parsed.outline ?? [])
      .filter((s) => s.heading?.trim())
      .map((s, i) => ({
        id: s.id || `sec-${i + 1}`,
        type: SECTION_TYPES.includes(s.type) ? s.type : 'h2',
        heading: String(s.heading ?? '').trim(),
        subpoints: Array.isArray(s.subpoints)
          ? s.subpoints.filter((sp): sp is string => typeof sp === 'string' && sp.trim().length > 0)
          : [],
      }));

    if (outline.length === 0) throw new Error('AI returned empty outline. Please try again.');

    return NextResponse.json({ outline });
  } catch (err) {
    console.error('[articles/outline]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Outline generation failed.' },
      { status: 500 },
    );
  }
}
