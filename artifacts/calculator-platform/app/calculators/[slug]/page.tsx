import { redirect } from 'next/navigation';
import { CALCULATORS } from '@/config/calculators';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return CALCULATORS.map((c) => ({ slug: c.slug }));
}

export default async function CalculatorsOldPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/calculator/${slug}`);
}
