import { ReactNode } from 'react';
import { verifySession } from '@/lib/session';
import { AdminLogin } from './AdminLogin';
import { AdminShell } from '@/components/layout/AdminShell';

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
