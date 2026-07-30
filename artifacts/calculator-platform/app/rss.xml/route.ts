import { siteConfig } from '@/config/site';
import { CALCULATORS } from '@/config/calculators';
import { getDb } from '@/lib/db';
import { getSeoSettings } from '@/lib/seo';

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[character] ?? character));
}

export function GET() {
  const seo = getSeoSettings(getDb().settings.seo);
  if (!seo.rss.enabled) return new Response('RSS is disabled', { status: 404 });
  const baseUrl = seo.canonicalUrl || siteConfig.url;
  const now = new Date().toUTCString();

  const items = CALCULATORS.map(
    (calc) => `
  <item>
     <title>${escapeXml(calc.name)} — Free Online Calculator</title>
     <link>${escapeXml(baseUrl)}/${calc.slug}-calculator</link>
     <guid isPermaLink="true">${escapeXml(baseUrl)}/${calc.slug}-calculator</guid>
     <description>${escapeXml(calc.description)}</description>
    <pubDate>${now}</pubDate>
     <category>${escapeXml(calc.category)}</category>
  </item>`
  ).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
   <title>${escapeXml(seo.rss.title)}</title>
     <link>${escapeXml(baseUrl)}</link>
    <atom:link href="${escapeXml(baseUrl)}/rss.xml" rel="self" type="application/rss+xml"/>
   <description>${escapeXml(seo.rss.description)}</description>
    <language>en-US</language>
    <lastBuildDate>${now}</lastBuildDate>
    <copyright>© ${new Date().getFullYear()} ${siteConfig.name}</copyright>
    <generator>Next.js</generator>
    <image>
       <url>${escapeXml(baseUrl)}/icon-192.png</url>
      <title>${siteConfig.name}</title>
       <link>${escapeXml(baseUrl)}</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
