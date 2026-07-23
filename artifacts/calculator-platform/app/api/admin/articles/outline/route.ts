import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { getAiProviderKey, getAiSettings, getProviderModels } from '@/lib/ai';
import type { ArticleAutoSeoData, ArticleOutlineSection, ArticleResearchSummary } from '@/lib/types';

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
    const trendDirection = research?.trendDirection ?? null;
    const serpDataAvailable = research?.serpDataAvailable ?? false;

    const systemPrompt = `You are a Senior SEO Content Strategist. Generate complete SEO data AND a detailed article outline simultaneously.
CRITICAL: Output ONLY valid JSON. No markdown, no explanation, no code fences.`;

    const userPrompt = `ARTICLE TITLE: "${title}"
FOCUS KEYWORD: "${keyword}"

RESEARCH SIGNALS:
People Also Ask (real questions to address):
${paaQuestions.slice(0, 8).map((q, i) => `${i + 1}. ${q}`).join('\n') || 'None captured'}

Related Searches (topics to cover):
${relatedSearches.slice(0, 6).map((s, i) => `${i + 1}. ${s}`).join('\n') || 'None captured'}

Trend direction: ${trendDirection ?? 'Unknown'}
Featured snippet opportunity: ${hasFeaturedSnippet ? 'Yes — structure content to capture it' : 'No current snippet'}
SerpAPI live data: ${serpDataAvailable ? 'Available' : 'Not available'}

TASK: Generate both SEO data and content outline for this article.

SEO DATA requirements:
- focusKeyword: the primary keyword to rank for (use the focus keyword above)
- secondaryKeywords: 5-8 closely related keywords that support the primary
- longTailKeywords: 5-8 specific longer phrases (4+ words) people search for
- semanticKeywords: 5-8 LSI/topical keywords in the same semantic field
- entityKeywords: 4-6 named entities (people, places, organizations, concepts) relevant to this topic
- userIntent: what the user ultimately wants to achieve (1 sentence)
- searchIntent: "informational" | "transactional" | "navigational" | "commercial"
- targetAudience: who specifically is searching for this (1-2 sentences)
- contentAngle: the unique editorial angle / perspective for this article (1-2 sentences)

OUTLINE requirements:
- Must include: H2 main sections, H3 subsections, FAQ (use PAA questions), How-To, at least one Comparison or Examples section, Pros & Cons, Related section, Conclusion with CTA
- Each section must directly serve the user's intent
- FAQ must use the real PAA questions above (adapted, not copied verbatim)
- Internal Links section should suggest calculator cross-links
- 10-16 sections total

Available section types: "h2", "h3", "faq", "howto", "examples", "comparison", "proscons", "internal-links", "related"

Return this EXACT JSON (no extra fields, no extra nesting):
{
  "seoData": {
    "focusKeyword": "string",
    "secondaryKeywords": ["string"],
    "longTailKeywords": ["string"],
    "semanticKeywords": ["string"],
    "entityKeywords": ["string"],
    "userIntent": "string",
    "searchIntent": "informational",
    "targetAudience": "string",
    "contentAngle": "string"
  },
  "outline": [
    {
      "id": "sec-1",
      "type": "h2",
      "heading": "Section heading text",
      "subpoints": ["Subpoint 1", "Subpoint 2"]
    }
  ]
}`;

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

    let parsed: { seoData?: ArticleAutoSeoData; outline?: ArticleOutlineSection[] };
    try {
      parsed = parseJson<{ seoData?: ArticleAutoSeoData; outline?: ArticleOutlineSection[] }>(rawText);
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

    // Normalize seoData fields
    const raw = parsed.seoData ?? {} as Partial<ArticleAutoSeoData>;
    const seoData: ArticleAutoSeoData = {
      focusKeyword: String(raw.focusKeyword ?? keyword).trim(),
      secondaryKeywords: Array.isArray(raw.secondaryKeywords) ? raw.secondaryKeywords.filter(Boolean).slice(0, 8) : [],
      longTailKeywords: Array.isArray(raw.longTailKeywords) ? raw.longTailKeywords.filter(Boolean).slice(0, 8) : [],
      semanticKeywords: Array.isArray(raw.semanticKeywords) ? raw.semanticKeywords.filter(Boolean).slice(0, 8) : [],
      entityKeywords: Array.isArray(raw.entityKeywords) ? raw.entityKeywords.filter(Boolean).slice(0, 6) : [],
      userIntent: String(raw.userIntent ?? '').trim(),
      searchIntent: String(raw.searchIntent ?? 'informational').trim(),
      targetAudience: String(raw.targetAudience ?? '').trim(),
      contentAngle: String(raw.contentAngle ?? '').trim(),
    };

    return NextResponse.json({ outline, seoData });
  } catch (err) {
    console.error('[articles/outline]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Outline generation failed.' },
      { status: 500 },
    );
  }
}
