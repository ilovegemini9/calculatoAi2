import { redirect } from 'next/navigation';
import { CALCULATORS } from '@/config/calculators';

interface Props {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  return CALCULATORS.map((c) => ({ slug: [c.slug] }));
}

/**
 * Permanent 301 redirect: /calculator/:slug → /:slug-calculator
 * Preserves any existing bookmarks and inbound links.
 */
export default async function CalculatorLegacyRedirect({ params }: Props) {
  const { slug } = await params;
  const baseSlug = slug ? slug[0] : '';
  redirect(`/${baseSlug}-calculator`);
}
