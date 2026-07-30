import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import type { NextResponse } from 'next/server';

export const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/** Lazily resolved — throws on first call at runtime if the variable is absent. */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || 'dev-session-secret-default-key-change-in-prod';
  return secret;
}

/** Sign a username with HMAC-SHA256. Deterministic — no random salt. */
function signUsername(username: string): string {
  return createHmac('sha256', getSessionSecret()).update(username).digest('hex');
}

/** Timing-safe comparison of the stored signature against the expected value. */
function verifySignature(username: string, signature: string): boolean {
  try {
    const expected = signUsername(username);
    // Both buffers must be the same length for timingSafeEqual
    if (expected.length !== signature.length) return false;
    return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'));
  } catch {
    return false;
  }
}

/** Build the signed session token string for a given username. */
export function buildSessionToken(username: string): string {
  const signature = signUsername(username);
  return JSON.stringify({ username, signature });
}

/** Cookie options shared between login and logout. */
export function sessionCookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    // Allow HTTP in dev/container preview environment; enable secure only when COOKIE_SECURE is true
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
  };
}

/**
 * Set the session cookie directly on a NextResponse object.
 * This is the reliable approach for Vercel/serverless — avoids issues with
 * `cookies()` from `next/headers` not propagating to the response on some
 * Next.js 15 + Vercel configurations.
 */
export function setSessionOnResponse(response: NextResponse, username: string) {
  response.cookies.set(SESSION_COOKIE_NAME, buildSessionToken(username), sessionCookieOptions());
}

/**
 * Delete the session cookie directly on a NextResponse object.
 */
export function deleteSessionOnResponse(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, '', { ...sessionCookieOptions(0), maxAge: 0 });
}

/** @deprecated Prefer setSessionOnResponse() for Route Handlers. */
export async function createSession(username: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, buildSessionToken(username), sessionCookieOptions());
}

export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) return false;

  try {
    const { username, signature } = JSON.parse(sessionCookie.value) as {
      username?: string;
      signature?: string;
    };
    if (!username || !signature) return false;
    return verifySignature(username, signature);
  } catch {
    return false;
  }
}

/** @deprecated Prefer deleteSessionOnResponse() for Route Handlers. */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
