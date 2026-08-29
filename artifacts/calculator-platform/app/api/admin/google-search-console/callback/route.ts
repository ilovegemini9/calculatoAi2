export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { exchangeGoogleCode, clearGoogleOAuthState, googleClientConfigured, setGoogleToken, verifyGoogleOAuthState } from '@/lib/google-search-console';
import { verifySession } from '@/lib/session';

function errorRedirect(origin: string, code: string) {
  const target = new URL('/admin/analytics', origin);
  target.searchParams.set('gsc', 'error');
  target.searchParams.set('reason', code);
  return target;
}

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  if (!(await verifySession())) return NextResponse.redirect(new URL('/admin?returnTo=/admin/analytics', origin));

  const url = new URL(req.url);
  const error = url.searchParams.get('error');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (error) {
    console.error('[GSC OAuth] Google returned an authorization error:', error);
    const response = NextResponse.redirect(errorRedirect(origin, error));
    clearGoogleOAuthState(response);
    return response;
  }

  if (!code || !state) {
    console.error('[GSC OAuth] Missing authorization code or state.');
    const response = NextResponse.redirect(errorRedirect(origin, 'missing_code_or_state'));
    clearGoogleOAuthState(response);
    return response;
  }

  if (!googleClientConfigured()) {
    console.error('[GSC OAuth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not configured.');
    const response = NextResponse.redirect(errorRedirect(origin, 'oauth_not_configured'));
    clearGoogleOAuthState(response);
    return response;
  }

  if (!(await verifyGoogleOAuthState(state))) {
    console.error('[GSC OAuth] OAuth state validation failed.');
    const response = NextResponse.redirect(errorRedirect(origin, 'invalid_state'));
    clearGoogleOAuthState(response);
    return response;
  }

  try {
    const token = await exchangeGoogleCode(code);
    const response = NextResponse.redirect(new URL('/admin/analytics?gsc=connected', origin));
    setGoogleToken(response, token);
    clearGoogleOAuthState(response);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'token_exchange_failed';
    console.error('[GSC OAuth] Callback failed:', message);
    const safeReason = message.toLowerCase().includes('redirect_uri') ? 'redirect_uri_mismatch'
      : message.toLowerCase().includes('invalid_client') ? 'invalid_client'
      : message.toLowerCase().includes('unauthorized_client') ? 'unauthorized_client'
      : 'token_exchange_failed';
    const response = NextResponse.redirect(errorRedirect(origin, safeReason));
    clearGoogleOAuthState(response);
    return response;
  }
}
