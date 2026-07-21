'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * The Editorial Blog Workspace has been unified into the SEO Finder / Editorial Workspace.
 * This page redirects there automatically.
 */
export default function BlogRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/seo-finder');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[40vh] space-y-3 flex-col">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Redirecting to Editorial Workspace…
      </p>
    </div>
  );
}
