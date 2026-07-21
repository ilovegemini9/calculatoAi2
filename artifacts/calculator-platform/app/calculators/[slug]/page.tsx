import { redirect } from 'next/navigation';
import { CALCULATORS } from '@/config/calculators';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return CALCULATORS.map((c) => ({ slug: c.slug }));
}

/**
 * Permanent 301 redirect: /calculators/:slug → /:slug-calculator
 */
export default async function CalculatorsLegacyRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/${slug}-calculator`);
}
