import { cookies } from 'next/headers';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import type { NextResponse } from 'next/server';

export const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
const SESSION_PREFIX = 'v3.';

/** Shared signing secret. Set SESSION_SECRET in production. */
function getSessionSecret(): string {
  return process.env.SESSION_SECRET || 'dev-session-secret-default-key-change-in-prod';
}

function signPayload(payload: string): string {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  try {
    const left = Buffer.from(a, 'utf8');
    const right = Buffer.from(b, 'utf8');
    return left.length === right.length && timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

/** Stateless signed session token: no DB read/write is needed on navigation. */
function buildStatelessToken(username: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const nonce = randomUUID();
  const payload = JSON.stringify({ username, expiresAt, nonce });
  const encoded = Buffer.from(payload, 'utf8').toString('base64url');
  return `${SESSION_PREFIX}${encoded}.${signPayload(encoded)}`;
}

function verifyStatelessToken(token: string): boolean {
  if (!token.startsWith(SESSION_PREFIX)) return false;
  const value = token.slice(SESSION_PREFIX.length);
  const separator = value.lastIndexOf('.');
  if (separator <= 0) return false;

  const encoded = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  if (!safeEqual(signPayload(encoded), signature)) return false;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      username?: string;
      expiresAt?: number;
      nonce?: string;
    };
    return Boolean(
      payload.username &&
      payload.nonce &&
      typeof payload.expiresAt === 'number' &&
      payload.expiresAt > Math.floor(Date.now() / 1000),
    );
  } catch {
    return false;
  }
}

/** Legacy signed token support for local/dev sessions created before v3. */
function verifyLegacyToken(token: string): boolean {
  try {
    const { username, signature } = JSON.parse(token) as {
      username?: string;
      signature?: string;
    };
    if (!username || !signature) return false;
    const expected = createHmac('sha256', getSessionSecret()).update(username).digest('hex');
    return safeEqual(expected, signature);
  } catch {
    return false;
  }
}

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
  };
}

export function setSessionTokenOnResponse(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}

/** Legacy helper retained for callers that still use it. */
export function setSessionOnResponse(response: NextResponse, username: string) {
  setSessionTokenOnResponse(response, buildStatelessToken(username));
}

export function deleteSessionOnResponse(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, '', { ...sessionCookieOptions(0), maxAge: 0 });
}

/** Issue a portable session that every Vercel/serverless instance can verify. */
export async function issueSessionToken(username: string): Promise<string> {
  return buildStatelessToken(username);
}

/** Stateless sessions have nothing to revoke server-side. */
export async function revokeCurrentSession(): Promise<void> {
  return;
}

export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  if (token.startsWith(SESSION_PREFIX)) return verifyStatelessToken(token);
  return verifyLegacyToken(token);
}

/** @deprecated Prefer issueSessionToken() + setSessionTokenOnResponse(). */
export async function createSession(username: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, await issueSessionToken(username), sessionCookieOptions());
}

/** @deprecated Prefer deleteSessionOnResponse(). */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
