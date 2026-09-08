import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { CalculatorClusterLinks } from '@/components/calculators/CalculatorClusterLinks';

export const metadata: Metadata = {
  title: {
    template: `%s — Free Online Calculator | ${siteConfig.name}`,
    default: `Free Online Calculators | ${siteConfig.name}`,
  },
};

export default async function CalculatorSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ calculatorSlug: string }>;
}) {
  const { calculatorSlug } = await params;
  const slug = calculatorSlug.endsWith('-calculator')
    ? calculatorSlug.slice(0, -'-calculator'.length)
    : calculatorSlug;

  return (
    <>
      {children}
      <CalculatorClusterLinks slug={slug} />
    </>
  );
}
