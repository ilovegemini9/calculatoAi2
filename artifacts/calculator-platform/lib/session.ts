import { cookies } from 'next/headers';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import type { NextResponse } from 'next/server';

// Host-only cookie: cannot be shadowed by an apex/subdomain cookie and is sent
// to every path on the exact admin host. This is intentionally HttpOnly.
export const SESSION_COOKIE_NAME = '__Host-admin_session';
export const LEGACY_SESSION_COOKIE_NAME = 'admin_session_v2';
export const OLDER_SESSION_COOKIE_NAME = 'admin_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
const SESSION_PREFIX = 'v4.';

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET is required in production.');
  }
  return 'dev-session-secret-default-key-change-in-prod';
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
    return Boolean(payload.username && payload.nonce && typeof payload.expiresAt === 'number' && payload.expiresAt > Math.floor(Date.now() / 1000));
  } catch {
    return false;
  }
}

function verifyLegacyToken(token: string): boolean {
  try {
    const { username, signature } = JSON.parse(token) as { username?: string; signature?: string };
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
    secure: true,
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
  };
}

export function setSessionTokenOnResponse(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  response.cookies.set(LEGACY_SESSION_COOKIE_NAME, '', { ...sessionCookieOptions(0), maxAge: 0 });
  response.cookies.set(OLDER_SESSION_COOKIE_NAME, '', { ...sessionCookieOptions(0), maxAge: 0 });
}

export function setSessionOnResponse(response: NextResponse, username: string) {
  setSessionTokenOnResponse(response, buildStatelessToken(username));
}

export function deleteSessionOnResponse(response: NextResponse) {
  for (const name of [SESSION_COOKIE_NAME, LEGACY_SESSION_COOKIE_NAME, OLDER_SESSION_COOKIE_NAME]) {
    response.cookies.set(name, '', { ...sessionCookieOptions(0), maxAge: 0 });
  }
}

export async function issueSessionToken(username: string): Promise<string> {
  return buildStatelessToken(username);
}

export async function revokeCurrentSession(): Promise<void> {
  return;
}

export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) return verifyStatelessToken(token);

  // Only accept old cookies during migration; new responses always clear them.
  const legacy = cookieStore.get(LEGACY_SESSION_COOKIE_NAME)?.value || cookieStore.get(OLDER_SESSION_COOKIE_NAME)?.value;
  return legacy ? verifyLegacyToken(legacy) : false;
}

export async function createSession(username: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, await issueSessionToken(username), sessionCookieOptions());
}

export async function deleteSession() {
  const cookieStore = await cookies();
  for (const name of [SESSION_COOKIE_NAME, LEGACY_SESSION_COOKIE_NAME, OLDER_SESSION_COOKIE_NAME]) {
    cookieStore.set(name, '', { ...sessionCookieOptions(0), maxAge: 0 });
  }
}
