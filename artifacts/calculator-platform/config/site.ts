export const siteConfig = {
  name: 'CalculatorFree',
  description:
    'Free online calculators for finance, math, health, and everyday life. Instant, accurate, and easy to use with no signup required. All tools run in-browser.',
  // Set NEXT_PUBLIC_SITE_URL to the real production domain in Vercel.
  // Keep a neutral fallback so we never publish unrelated-domain canonicals.
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://calculatorfree.vercel.app',
  ogImage: '/og-image.svg',
  links: {
    github: 'https://github.com/ilovegemini9/calculatoAi2',
  },
  keywords: [
    'free online calculators',
    'online calculator',
    'financial calculator',
    'mortgage payment calculator',
    'home loan calculator',
    'debt payoff calculator',
    'credit card payoff calculator',
    'credit utilization calculator',
    'debt consolidation calculator',
    'bmi calculator',
    'calorie needs calculator',
    'bmr calculator',
    'tdee calculator',
    'scientific calculator',
    'percentage calculator',
    'fraction calculator',
    'unit conversion calculator',
    'date calculator',
    'fuel cost calculator',
  ],
};

export type SiteConfig = typeof siteConfig;
