export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { verifySession } from '@/lib/session';
import { googleClientConfigured, googleRedirectUri, setGoogleOAuthState } from '@/lib/google-search-console';

export async function GET(req: Request) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!googleClientConfigured()) return NextResponse.json({ error: 'Google OAuth is not configured.' }, { status: 503 });

  const state = randomUUID();
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set('redirect_uri', googleRedirectUri());
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'https://www.googleapis.com/auth/webmasters.readonly');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);

  const response = NextResponse.redirect(url);
  setGoogleOAuthState(response, state);
  return response;
}
