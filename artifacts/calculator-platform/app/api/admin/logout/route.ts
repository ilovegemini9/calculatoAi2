export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { deleteSessionOnResponse, revokeCurrentSession } from '@/lib/session';

/**
 * Logout is intentionally POST-only.
 *
 * A GET endpoint that clears an authentication cookie is unsafe here because
 * browser/link prefetching and accidental navigation can invoke it while the
 * admin is simply moving between pages. That was causing successful sessions
 * to disappear and subsequent admin API calls to return 401.
 */
export async function POST(req: Request) {
  await revokeCurrentSession();
  const response = NextResponse.json({ success: true });
  deleteSessionOnResponse(response);
  return response;
}

// Keep GET non-destructive for old links/bookmarks. Never clear the session
// from a safe/idempotent request.
export function GET(req: Request) {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to log out.' },
    { status: 405, headers: { Allow: 'POST' } },
  );
}
