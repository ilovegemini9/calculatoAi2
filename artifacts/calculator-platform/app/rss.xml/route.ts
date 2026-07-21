import { siteConfig } from '@/config/site';
import { CALCULATORS } from '@/config/calculators';

export const dynamic = 'force-static';
export const revalidate = 86400; // 24 hours

export function GET() {
  const now = new Date().toUTCString();

  const items = CALCULATORS.map(
    (calc) => `
  <item>
    <title><![CDATA[${calc.name} — Free Online Calculator]]></title>
    <link>${siteConfig.url}/${calc.slug}-calculator</link>
    <guid isPermaLink="true">${siteConfig.url}/${calc.slug}-calculator</guid>
    <description><![CDATA[${calc.description}]]></description>
    <pubDate>${now}</pubDate>
    <category><![CDATA[${calc.category}]]></category>
  </item>`
  ).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${siteConfig.name} — Free Online Calculators</title>
    <link>${siteConfig.url}</link>
    <atom:link href="${siteConfig.url}/rss.xml" rel="self" type="application/rss+xml"/>
    <description>${siteConfig.description}</description>
    <language>en-US</language>
    <lastBuildDate>${now}</lastBuildDate>
    <copyright>© ${new Date().getFullYear()} ${siteConfig.name}</copyright>
    <generator>Next.js</generator>
    <image>
      <url>${siteConfig.url}/icon-192.png</url>
      <title>${siteConfig.name}</title>
      <link>${siteConfig.url}</link>
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
