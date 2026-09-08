import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: {
    template: `%s — Free Online Calculator | ${siteConfig.name}`,
    default: `Free Online Calculators | ${siteConfig.name}`,
  },
};

export default function CalculatorSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
