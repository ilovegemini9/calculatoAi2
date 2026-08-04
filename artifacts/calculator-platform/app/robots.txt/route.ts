import { getDb } from '@/lib/db';
import { getSeoSettings } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const seo = getSeoSettings((await getDb()).settings.seo);
  if (!seo.robots.enabled) {
    return new Response('User-agent: *\nDisallow: /\n', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return new Response(seo.robots.content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
