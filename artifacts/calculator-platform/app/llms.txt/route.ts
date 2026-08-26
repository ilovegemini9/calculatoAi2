import { getDb } from '@/lib/db';
import { siteConfig } from '@/config/site';
import { getSeoSettings, defaultLlmsTxt, ensureLlmsCalculatorCoverage } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const seo = getSeoSettings((await getDb()).settings.seo);
  if (!seo.llmsTxt.enabled) return new Response('llms.txt is disabled', { status: 404 });

  const baseUrl = seo.canonicalUrl?.startsWith('http') ? seo.canonicalUrl : siteConfig.url;
  const content = ensureLlmsCalculatorCoverage(
    seo.llmsTxt.content || defaultLlmsTxt(baseUrl),
    baseUrl,
  );

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
