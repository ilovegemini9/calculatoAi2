import { cookies } from 'next/headers';
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'crypto';
import type { NextResponse } from 'next/server';

const TOKEN_COOKIE = '__Host-gsc_session';
const STATE_COOKIE = '__Host-gsc_oauth_state';
const TOKEN_MAX_AGE = 30 * 24 * 60 * 60;

type StoredToken = { access_token: string; refresh_token?: string; expires_at: number };

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is required for Google Search Console OAuth.');
  return createHash('sha256').update(secret).digest();
}

function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}

function decrypt(value: string) {
  const raw = Buffer.from(value, 'base64url');
  const decipher = createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
}

function options(maxAge: number) {
  return { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/', maxAge };
}

export function googleClientConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri() {
  return process.env.GOOGLE_OAUTH_REDIRECT_URI || 'https://www.luckyhoroscope.online/api/admin/google-search-console/callback';
}

export function googleSearchConsoleSiteUrl() {
  return process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || 'https://www.luckyhoroscope.online/';
}

export function setGoogleOAuthState(response: NextResponse, state: string) {
  response.cookies.set(STATE_COOKIE, state, options(600));
}

export async function verifyGoogleOAuthState(state: string) {
  const saved = (await cookies()).get(STATE_COOKIE)?.value;
  if (!saved) return false;
  const left = Buffer.from(saved);
  const right = Buffer.from(state);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function clearGoogleOAuthState(response: NextResponse) {
  response.cookies.set(STATE_COOKIE, '', options(0));
}

export function setGoogleToken(response: NextResponse, token: StoredToken) {
  response.cookies.set(TOKEN_COOKIE, encrypt(JSON.stringify(token)), options(TOKEN_MAX_AGE));
}

export async function getGoogleToken(): Promise<StoredToken | null> {
  const value = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!value) return null;
  try { return JSON.parse(decrypt(value)) as StoredToken; } catch { return null; }
}

export async function exchangeGoogleCode(code: string): Promise<StoredToken> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirect_uri: googleRedirectUri(),
    grant_type: 'authorization_code',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body, cache: 'no-store',
  });
  if (!res.ok) {
    let errorCode = 'token_exchange_failed';
    let errorDescription = '';
    try {
      const errorData = await res.json() as { error?: string; error_description?: string };
      errorCode = errorData.error || errorCode;
      errorDescription = errorData.error_description || '';
    } catch {}
    console.error('[GSC OAuth] Token exchange rejected by Google:', {
      status: res.status,
      error: errorCode,
      description: errorDescription,
      redirectUri: googleRedirectUri(),
      clientIdPresent: Boolean(process.env.GOOGLE_CLIENT_ID),
      clientSecretPresent: Boolean(process.env.GOOGLE_CLIENT_SECRET),
      clientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
    });
    throw new Error(errorCode);
  }
  const data = await res.json() as { access_token: string; refresh_token?: string; expires_in?: number };
  return { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: Date.now() + Math.max(60, data.expires_in || 3600) * 1000 };
}

export async function refreshGoogleToken(token: StoredToken): Promise<StoredToken> {
  if (token.expires_at > Date.now() + 60_000) return token;
  if (!token.refresh_token) throw new Error('Google connection expired. Reconnect Search Console.');
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    refresh_token: token.refresh_token,
    grant_type: 'refresh_token',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body, cache: 'no-store',
  });
  if (!res.ok) throw new Error('Google connection expired. Reconnect Search Console.');
  const data = await res.json() as { access_token: string; expires_in?: number };
  return { access_token: data.access_token, refresh_token: token.refresh_token, expires_at: Date.now() + Math.max(60, data.expires_in || 3600) * 1000 };
}
