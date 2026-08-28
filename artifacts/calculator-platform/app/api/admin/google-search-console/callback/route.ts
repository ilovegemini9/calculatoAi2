export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { exchangeGoogleCode, clearGoogleOAuthState, googleClientConfigured, setGoogleToken, verifyGoogleOAuthState } from '@/lib/google-search-console';
import { verifySession } from '@/lib/session';

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  if (!(await verifySession())) return NextResponse.redirect(new URL('/admin?returnTo=/admin/analytics', origin));

  const url = new URL(req.url);
  const error = url.searchParams.get('error');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (error || !code || !state || !googleClientConfigured() || !(await verifyGoogleOAuthState(state))) {
    const response = NextResponse.redirect(new URL('/admin/analytics?gsc=error', origin));
    clearGoogleOAuthState(response);
    return response;
  }

  try {
    const token = await exchangeGoogleCode(code);
    const response = NextResponse.redirect(new URL('/admin/analytics?gsc=connected', origin));
    setGoogleToken(response, token);
    clearGoogleOAuthState(response);
    return response;
  } catch {
    const response = NextResponse.redirect(new URL('/admin/analytics?gsc=error', origin));
    clearGoogleOAuthState(response);
    return response;
  }
}
