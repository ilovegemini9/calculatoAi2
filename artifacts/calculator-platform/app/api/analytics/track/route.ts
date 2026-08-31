import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const AI_ENGINES: Array<{ name: string; host: RegExp }> = [
  { name: 'ChatGPT', host: /(^|\\.)chatgpt\\.com$/i },
  { name: 'ChatGPT', host: /(^|\\.)openai\\.com$/i },
  { name: 'Perplexity', host: /(^|\\.)perplexity\\.ai$/i },
  { name: 'Gemini', host: /(^|\\.)gemini\\.google\\.com$/i },
  { name: 'Claude', host: /(^|\\.)claude\\.ai$/i },
  { name: 'Microsoft Copilot', host: /(^|\\.)copilot\\.microsoft\\.com$/i },
  { name: 'Grok', host: /(^|\\.)grok\\.com$/i },
  { name: 'DeepSeek', host: /(^|\\.)deepseek\\.com$/i },
  { name: 'Mistral', host: /(^|\\.)mistral\\.ai$/i },
];

const SEARCH_ENGINES: Array<{ name: string; host: RegExp }> = [
  { name: 'Google', host: /(^|\.)google\./i },
  { name: 'Bing', host: /(^|\.)bing\.com$/i },
  { name: 'Yahoo', host: /(^|\.)yahoo\./i },
  { name: 'DuckDuckGo', host: /(^|\.)duckduckgo\.com$/i },
  { name: 'Brave Search', host: /(^|\.)search\.brave\.com$/i },
  { name: 'Ecosia', host: /(^|\.)ecosia\.org$/i },
  { name: 'Yandex', host: /(^|\.)yandex\./i },
  { name: 'Baidu', host: /(^|\.)baidu\.com$/i },
  { name: 'Qwant', host: /(^|\.)qwant\.com$/i },
  { name: 'Startpage', host: /(^|\.)startpage\.com$/i },
];

function classify(referrer: string) {
  if (!referrer) return { source: 'Direct', medium: 'direct', host: '' };
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
    const ai = AI_ENGINES.find((item) => item.host.test(host));
    if (ai) return { source: ai.name, medium: 'ai', host };
    const engine = SEARCH_ENGINES.find((item) => item.host.test(host));
    if (engine) return { source: engine.name, medium: 'organic', host };
    return { source: host, medium: 'referral', host };
  } catch {
    return { source: 'Direct', medium: 'direct', host: '' };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { path?: string; referrer?: string; query?: string };
    const referrer = String(body.referrer || request.headers.get('referer') || '').slice(0, 1000);
    const path = String(body.path || '/').slice(0, 500);
    const source = classify(referrer);

    // We intentionally do not infer private search terms. Browser referrer query parameters
    // are often stripped by search engines; real Google queries come from Search Console.
    const suppliedQuery = typeof body.query === 'string' ? body.query.slice(0, 200) : '';
    const db = await getDb();
    type StateWithTraffic = typeof db & {
      trafficEvents?: Array<{
        id: string;
        timestamp: string;
        path: string;
        referrer: string;
        source: string;
        medium: string;
        referrerHost: string;
        query: string;
      }>;
    };
    const state = db as StateWithTraffic;
    state.trafficEvents = Array.isArray(state.trafficEvents) ? state.trafficEvents : [];
    state.trafficEvents.unshift({
      id: `traffic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      path,
      referrer,
      source: source.source,
      medium: source.medium,
      referrerHost: source.host,
      query: suppliedQuery,
    });
    state.trafficEvents = state.trafficEvents.slice(0, 5000);
    await saveDb(state);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
