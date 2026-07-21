import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { GoogleGenAI, Type } from '@google/genai';
import { validateGeneratedCode } from '@/lib/security';

// Initialize Gemini with optional key
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface GeneratedSpec {
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
}

export async function POST(req: Request) {
  const isAuth = await verifySession();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Description prompt is required' }, { status: 400 });
    }

    const db = getDb();
    const orKey = db.settings.openrouterApiKey;

    let resultJson: GeneratedSpec | null = null;

    const systemInstruction = `You are an expert mathematician and software architect.
Generate a complete declarative calculator specification for: "${prompt}".
You must return a valid JSON object matching this TypeScript type:
{
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
  calculateBody: string; // A JavaScript function body that takes an object parameter 'inputs' and returns an object of calculated outputs. e.g., "const res = Number(inputs.val1) + Number(inputs.val2); return { result: res };"
  howToUse: string[];
  faqItems: Array<{ question: string; answer: string }>;
}

Security constraint for calculateBody:
- NEVER use 'fetch', 'window', 'document', 'eval', 'require', or 'localStorage'.
- Stick only to basic math and clean JavaScript statements.
`;

    if (orKey) {
      // Use OpenRouter
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${orKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': req.headers.get('referer') || 'https://calculator-platform.local',
        },
        body: JSON.stringify({
          model: 'poolside/laguna-xs-2.1',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: `Generate the specs for: ${prompt}` }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API responded with status ${response.status}`);
      }

      const raw = await response.json();
      resultJson = JSON.parse(raw.choices[0].message.content);
    } else {
      // Fallback to Server-Side Gemini API SDK
      const ai = getGeminiClient();
      if (!ai) {
        return NextResponse.json({ 
          error: 'Neither OpenRouter API Key nor server-side GEMINI_API_KEY is configured. Please provide an API key in Platform Settings.' 
        }, { status: 400 });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Generate the specs for: ${prompt}`,
        config: {
          systemInstruction,
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
              inputs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    label: { type: Type.STRING },
                    type: { type: Type.STRING },
                    defaultValue: { type: Type.NUMBER },
                    min: { type: Type.NUMBER },
                    max: { type: Type.NUMBER },
                    step: { type: Type.NUMBER },
                    suffix: { type: Type.STRING },
                    helpText: { type: Type.STRING },
                  },
                },
              },
              outputs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    label: { type: Type.STRING },
                    suffix: { type: Type.STRING },
                    highlight: { type: Type.BOOLEAN },
                  },
                },
              },
              calculateBody: { type: Type.STRING },
              howToUse: { type: Type.ARRAY, items: { type: Type.STRING } },
              faqItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING },
                  }
                }
              }
            },
            required: ['name', 'slug', 'category', 'title', 'description', 'inputs', 'outputs', 'calculateBody']
          }
        }
      });

      if (response.text) {
        resultJson = JSON.parse(response.text.trim());
      } else {
        throw new Error('Empty response from Gemini API');
      }
    }

    if (!resultJson) {
      return NextResponse.json({ error: 'AI failed to generate specs' }, { status: 500 });
    }

    // Safety scan the AI generated code
    const violations = validateGeneratedCode({
      meta: { calculateBody: resultJson.calculateBody }
    });

    if (violations.length > 0) {
      return NextResponse.json({ 
        error: `Security violation: Forbidden pattern detected in generated code: ${violations.join(', ')}` 
      }, { status: 400 });
    }

    return NextResponse.json(resultJson);
  } catch (err: unknown) {
    console.error('Factory generator route error:', err);
    const errMsg = err instanceof Error ? err.message : 'Error executing AI generation';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
