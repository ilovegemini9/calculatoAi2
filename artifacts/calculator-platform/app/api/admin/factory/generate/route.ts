import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { GoogleGenAI, Type } from '@google/genai';
import { validateGeneratedCode } from '@/lib/security';
import { CALCULATORS } from '@/config/calculators';

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  responseFormat?: { type: string },
): Promise<string> {
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
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`OpenRouter error ${res.status}: ${res.statusText}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}

async function tryOpenRouter(orKey: string, prompt: string, systemInstruction: string): Promise<string> {
  const models = ['poolside/laguna-xs-2.1', 'google/gemma-4-31b-it:free', 'google/gemma-4-26b-a4b:free'];
  let lastErr = '';
  for (const model of models) {
    try {
      const text = await callOpenRouter(
        orKey,
        model,
        [{ role: 'system', content: systemInstruction }, { role: 'user', content: prompt }],
        { type: 'json_object' },
      );
      if (text.trim()) return text;
    } catch (e: unknown) {
      lastErr = e instanceof Error ? e.message : String(e);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error(`OpenRouter generation failed. Last error: ${lastErr}`);
}

function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  return JSON.parse(start !== -1 && end > start ? cleaned.slice(start, end + 1) : cleaned) as T;
}

// ─── Stage 1: Full calculator spec ──────────────────────────────────────────

interface FullSpec {
  name: string;
  slug: string;
  category: 'financial' | 'fitness' | 'math' | 'lifestyle';
  title: string;
  description: string;
  shortDescription: string;
  keywords: string[];
  inputs: Array<{
    name: string;
    label: string;
    type: 'number' | 'select' | 'text';
    defaultValue?: number | string;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
    helpText?: string;
    options?: Array<{ value: string; label: string }>;
  }>;
  outputs: Array<{
    name: string;
    label: string;
    suffix?: string;
    highlight?: boolean;
  }>;
  calculateBody: string;
  howToUse: string[];
  faqItems: Array<{ question: string; answer: string }>;
  formula: {
    expression: string;
    variables: Array<{ symbol: string; definition: string }>;
    notes?: string;
  };
  examples: Array<{
    title: string;
    scenario: string;
    steps: string[];
    result: string;
  }>;
  internalLinks: Array<{ text: string; slug: string }>;
}

// ─── Stage 2: Tests ──────────────────────────────────────────────────────────

interface GeneratedTests {
  tests: Array<{
    name: string;
    type: 'unit' | 'edge' | 'formula';
    inputs: Record<string, number | string>;
    expectedOutputs: Record<string, number | string>;
    tolerance?: number;
  }>;
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'Description prompt is required' }, { status: 400 });

    const db = getDb();
    const orKey = db.settings.openrouterApiKey || process.env.OPENROUTER_API_KEY || '';

    // Existing calculator slugs for internal link suggestions
    const existingSlugs = CALCULATORS.map((c) => c.slug).join(', ');

    // ── Stage 1: Generate full spec ─────────────────────────────────────────

    const stage1System = `You are an expert mathematician, UX designer, and SEO specialist.
Generate a complete, production-ready calculator specification. Return a valid JSON object only — no markdown, no explanation.

SECURITY — calculateBody rules:
- NEVER use fetch, XMLHttpRequest, window, document, eval, require, import, localStorage, sessionStorage, or cookies.
- Use only pure JavaScript math and string operations.
- The function receives an "inputs" object and must return an object of output values.

Available calculator slugs for internalLinks (link to relevant ones only): ${existingSlugs}`;

    const stage1Prompt = `Generate a complete calculator specification for: "${prompt}"

Return this exact JSON shape:
{
  "name": string,                    // e.g. "Compound Interest Calculator"
  "slug": string,                    // kebab-case, no "-calculator" suffix, e.g. "compound-interest"
  "category": "financial" | "fitness" | "math" | "lifestyle",
  "title": string,                   // SEO title, e.g. "Free Compound Interest Calculator"
  "description": string,             // 150-160 char SEO meta description
  "shortDescription": string,        // 60-80 char card description
  "keywords": string[],              // 5-8 primary + LSI keywords
  "inputs": [{
    "name": string,                  // camelCase identifier
    "label": string,                 // human label
    "type": "number" | "select" | "text",
    "defaultValue": number | string,
    "min": number,                   // for number inputs
    "max": number,                   // for number inputs
    "step": number,                  // for number inputs
    "suffix": string,                // unit label, e.g. "%", "years"
    "helpText": string,              // optional tooltip
    "options": [{ "value": string, "label": string }]  // for select inputs only
  }],
  "outputs": [{
    "name": string,
    "label": string,
    "suffix": string,
    "highlight": boolean             // true for the primary result
  }],
  "calculateBody": string,           // JS function body: takes 'inputs' object, returns outputs object
  "howToUse": string[],              // 4-6 numbered steps
  "faqItems": [{ "question": string, "answer": string }],  // 5-7 FAQs
  "formula": {
    "expression": string,            // plain-text math expression, e.g. "A = P(1 + r/n)^(nt)"
    "variables": [{ "symbol": string, "definition": string }],
    "notes": string                  // optional caveat
  },
  "examples": [{
    "title": string,
    "scenario": string,
    "steps": string[],               // 3-5 calculation steps
    "result": string                 // final answer sentence
  }],                                // 2-3 worked examples
  "internalLinks": [{ "text": string, "slug": string }]  // 3-5 links to related existing calculators
}`;

    let fullSpec: FullSpec | null = null;

    if (orKey) {
      const raw = await tryOpenRouter(orKey, stage1Prompt, stage1System);
      fullSpec = parseJson<FullSpec>(raw);
    } else {
      const ai = getGeminiClient();
      if (!ai) {
        return NextResponse.json({
          error: 'No AI API key configured. Add an OpenRouter API key in Platform Settings.',
        }, { status: 400 });
      }
      const resp = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: stage1Prompt,
        config: {
          systemInstruction: stage1System,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              slug: { type: Type.STRING },
              category: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              shortDescription: { type: Type.STRING },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              inputs: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                name: { type: Type.STRING }, label: { type: Type.STRING },
                type: { type: Type.STRING }, defaultValue: { type: Type.NUMBER },
                min: { type: Type.NUMBER }, max: { type: Type.NUMBER }, step: { type: Type.NUMBER },
                suffix: { type: Type.STRING }, helpText: { type: Type.STRING },
              }}},
              outputs: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                name: { type: Type.STRING }, label: { type: Type.STRING },
                suffix: { type: Type.STRING }, highlight: { type: Type.BOOLEAN },
              }}},
              calculateBody: { type: Type.STRING },
              howToUse: { type: Type.ARRAY, items: { type: Type.STRING } },
              faqItems: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                question: { type: Type.STRING }, answer: { type: Type.STRING },
              }}},
              formula: { type: Type.OBJECT, properties: {
                expression: { type: Type.STRING },
                variables: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                  symbol: { type: Type.STRING }, definition: { type: Type.STRING },
                }}},
                notes: { type: Type.STRING },
              }},
              examples: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                title: { type: Type.STRING }, scenario: { type: Type.STRING },
                steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                result: { type: Type.STRING },
              }}},
              internalLinks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                text: { type: Type.STRING }, slug: { type: Type.STRING },
              }}},
            },
            required: ['name', 'slug', 'category', 'title', 'description', 'inputs', 'outputs', 'calculateBody'],
          },
        },
      });
      if (!resp.text) throw new Error('Empty response from Gemini');
      fullSpec = parseJson<FullSpec>(resp.text.trim());
    }

    if (!fullSpec) throw new Error('AI failed to generate calculator spec');

    // Security check
    const violations = validateGeneratedCode({ meta: { calculateBody: fullSpec.calculateBody } });
    if (violations.length > 0) {
      return NextResponse.json({
        error: `Security violation in generated formula: ${violations.join(', ')}`,
      }, { status: 400 });
    }

    // ── Stage 2: Generate tests ─────────────────────────────────────────────

    const stage2System = `You are a senior QA engineer and mathematician. Write comprehensive test cases for a calculator formula. Return valid JSON only — no markdown.`;

    const stage2Prompt = `Calculator: ${fullSpec.name}

Formula description: ${fullSpec.formula?.expression ?? ''}

Inputs spec:
${JSON.stringify(fullSpec.inputs, null, 2)}

Outputs spec:
${JSON.stringify(fullSpec.outputs, null, 2)}

calculateBody (JavaScript):
${fullSpec.calculateBody}

Write 7-10 test cases covering:
- 3 "unit" tests: typical real-world values with expected outputs you've manually verified
- 2-3 "edge" tests: boundary values (zeros, minimums, maximums, negative where applicable)
- 2 "formula" tests: verify the mathematical formula is correct with known reference values

For each number comparison use tolerance 0.01 (1%). For string outputs use exact match.

Return this exact JSON:
{
  "tests": [
    {
      "name": string,
      "type": "unit" | "edge" | "formula",
      "inputs": { "inputName": value, ... },
      "expectedOutputs": { "outputName": value, ... },
      "tolerance": 0.01
    }
  ]
}`;

    let testsSpec: GeneratedTests = { tests: [] };

    try {
      if (orKey) {
        const raw = await tryOpenRouter(orKey, stage2Prompt, stage2System);
        testsSpec = parseJson<GeneratedTests>(raw);
      } else {
        const ai = getGeminiClient();
        if (ai) {
          const resp = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: stage2Prompt,
            config: {
              systemInstruction: stage2System,
              responseMimeType: 'application/json',
            },
          });
          if (resp.text) testsSpec = parseJson<GeneratedTests>(resp.text.trim());
        }
      }
    } catch (err) {
      // Tests generation is non-fatal — continue without tests
      console.warn('[factory/generate] Test generation failed, continuing:', err);
    }

    return NextResponse.json({
      ...fullSpec,
      tests: Array.isArray(testsSpec.tests) ? testsSpec.tests : [],
    });
  } catch (err: unknown) {
    console.error('[factory/generate] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error executing AI generation' },
      { status: 500 },
    );
  }
}
