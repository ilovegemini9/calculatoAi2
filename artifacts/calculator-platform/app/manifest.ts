import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: 'CalcFree',
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#0b2545',
    theme_color: '#0066cc',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/apple-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    categories: ['utilities', 'finance', 'education', 'health'],
    lang: 'en',
    dir: 'ltr',
  };
}
