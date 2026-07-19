export const siteConfig = {
  name: 'CalculatorFree',
  description:
    'Free online calculators for finance, health, math, and more. Fast, accurate, and private — all calculations run in your browser.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://calculatorfree.vercel.app',
  ogImage: '/og-image.png',
  links: {
    github: '',
  },
  keywords: [
    'free calculator',
    'online calculator',
    'financial calculator',
    'health calculator',
    'math calculator',
    'bmi calculator',
    'mortgage calculator',
    'loan calculator',
    'tip calculator',
    'age calculator',
  ],
};

export type SiteConfig = typeof siteConfig;
