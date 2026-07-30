import { ReactNode } from 'react';
import { verifySession } from '@/lib/session';
import { AdminLogin } from './AdminLogin';
import { AdminShell } from '@/components/layout/AdminShell';

// Force dynamic rendering on every request — prevents Next.js from caching
// the layout output and serving a stale (unauthenticated) shell on page
// refresh or direct URL access (e.g. /admin/seo).
export const dynamic = 'force-dynamic';

interface Props {
  children: ReactNode;
}

export default async function AdminLayout({ children }: Props) {
  const isAuthenticated = await verifySession();

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return <AdminShell>{children}</AdminShell>;
}
