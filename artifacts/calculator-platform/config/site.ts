export const siteConfig = {
  name: 'CalculatorFree',
  description:
    'Free online calculators for finance, math, health, and everyday life. Instant, accurate, and easy to use with no signup required. All tools run in-browser.',
  // Keep one canonical production origin so canonical URLs, sitemap, robots,
  // structured data, and social metadata all resolve to the same host.
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.luckyhoroscope.online',
  ogImage: '/icon.svg',
  links: {
    github: '',
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
