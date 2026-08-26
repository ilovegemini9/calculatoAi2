import { cookies } from 'next/headers';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'crypto';
import type { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
const DB_SESSION_PREFIX = 'v2.';

/** Lazily resolved for the legacy local fallback only. */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || 'dev-session-secret-default-key-change-in-prod';
  return secret;
}

function hasDurableDatabase(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING,
  );
}

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Sign a username with HMAC-SHA256 for local/dev fallback sessions. */
function signUsername(username: string): string {
  return createHmac('sha256', getSessionSecret()).update(username).digest('hex');
}

function verifySignature(username: string, signature: string): boolean {
  try {
    const expected = signUsername(username);
    if (expected.length !== signature.length) return false;
    return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'));
  } catch {
    return false;
  }
}

/** Build the legacy signed session token used only when no durable DB is configured. */
export function buildSessionToken(username: string): string {
  const signature = signUsername(username);
  return JSON.stringify({ username, signature });
}

/** Cookie options shared between login and logout. */
export function sessionCookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
  };
}

/** Set an opaque DB-backed session token on a response. */
export function setSessionTokenOnResponse(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}

/** Set the legacy signed session token on a response. */
export function setSessionOnResponse(response: NextResponse, username: string) {
  setSessionTokenOnResponse(response, buildSessionToken(username));
}

/** Delete the session cookie directly on a NextResponse object. */
export function deleteSessionOnResponse(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, '', { ...sessionCookieOptions(0), maxAge: 0 });
}

/**
 * Issue a session that is verifiable by every serverless instance through the
 * shared database. Local environments without a DB retain the old HMAC flow.
 */
export async function issueSessionToken(username: string): Promise<string> {
  if (!hasDurableDatabase()) return buildSessionToken(username);

  const token = `${DB_SESSION_PREFIX}${randomUUID()}-${randomUUID()}`;
  const now = Date.now();
  const db = await getDb();
  const activeSessions = (db.sessions || []).filter((session) => session.expiresAt > now);
  db.sessions = [
    ...activeSessions,
    {
      id: randomUUID(),
      username,
      tokenHash: hashSessionToken(token),
      createdAt: new Date(now).toISOString(),
      expiresAt: now + SESSION_MAX_AGE * 1000,
    },
  ].slice(-100);
  await saveDb(db);
  return token;
}

/** Revoke the current DB-backed session during logout when possible. */
export async function revokeCurrentSession(): Promise<void> {
  if (!hasDurableDatabase()) return;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token?.startsWith(DB_SESSION_PREFIX)) return;

  const db = await getDb();
  const tokenHash = hashSessionToken(token);
  const nextSessions = (db.sessions || []).filter((session) => session.tokenHash !== tokenHash);
  if (nextSessions.length !== (db.sessions || []).length) {
    db.sessions = nextSessions;
    await saveDb(db);
  }
}

/** Verify either a shared DB-backed token or a legacy HMAC token. */
export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;

  if (token.startsWith(DB_SESSION_PREFIX)) {
    if (!hasDurableDatabase()) return false;
    try {
      const db = await getDb();
      const now = Date.now();
      const tokenHash = hashSessionToken(token);
      return (db.sessions || []).some(
        (session) => session.tokenHash === tokenHash && session.expiresAt > now,
      );
    } catch {
      return false;
    }
  }

  try {
    const { username, signature } = JSON.parse(token) as {
      username?: string;
      signature?: string;
    };
    if (!username || !signature) return false;
    return verifySignature(username, signature);
  } catch {
    return false;
  }
}

/** @deprecated Prefer issueSessionToken() + setSessionTokenOnResponse(). */
export async function createSession(username: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, await issueSessionToken(username), sessionCookieOptions());
}

/** @deprecated Prefer deleteSessionOnResponse(). */
export async function deleteSession() {
  await revokeCurrentSession();
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
