import { getDb } from '@/lib/db';
import { getSeoSettings } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const seo = getSeoSettings((await getDb()).settings.seo);
  if (!seo.llmsTxt.enabled) return new Response('llms.txt is disabled', { status: 404 });

  return new Response(seo.llmsTxt.content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
