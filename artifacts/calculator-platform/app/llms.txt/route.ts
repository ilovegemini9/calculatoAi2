import { getDb } from '@/lib/db';
import { siteConfig } from '@/config/site';
import { getSeoSettings, defaultLlmsTxt, ensureLlmsCalculatorCoverage } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const seo = getSeoSettings((await getDb()).settings.seo);
  if (!seo.llmsTxt.enabled) return new Response('llms.txt is disabled', { status: 404 });

  // Keep the machine-readable discovery document on the same production
  // origin as canonical URLs and sitemap/robots. Do not let a stale DB SEO
  // setting silently reintroduce a bare/www host split.
  const baseUrl = siteConfig.url.replace(/\/$/, '');
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
