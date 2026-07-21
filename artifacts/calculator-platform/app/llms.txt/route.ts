import { siteConfig } from '@/config/site';
import { CALCULATORS, CATEGORY_LABELS } from '@/config/calculators';

export const dynamic = 'force-static';

export function GET() {
  const calculatorList = CALCULATORS.map(
    (c) =>
      `- [${c.name}](${siteConfig.url}/${c.slug}-calculator): ${c.description}`
  ).join('\n');

  const text = `# ${siteConfig.name}

> ${siteConfig.description}

${siteConfig.name} provides free, accurate, and private online calculators. All calculations are performed entirely in the user's browser — no data is ever sent to a server.

## Available Calculators

${calculatorList}

## Categories

${Object.entries(CATEGORY_LABELS)
  .map(([key, label]) => {
    const calcs = CALCULATORS.filter((c) => c.category === key);
    return `### ${label}\n${calcs.map((c) => `- ${c.name}`).join('\n')}`;
  })
  .join('\n\n')}

## Key Facts

- All calculations: 100% client-side, zero server requests
- Privacy: No user data collected or transmitted
- Cost: Completely free, no account required
- Accuracy: Formulas verified against industry standards
- Availability: 24/7, no downtime

## Technology

Built with Next.js 15, TypeScript, and Tailwind CSS. Deployed on Vercel.

## Contact

Website: ${siteConfig.url}
`;

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
