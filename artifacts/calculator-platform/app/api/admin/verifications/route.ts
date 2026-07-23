import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { getDb, saveDb } from '@/lib/db';
import { getVerificationSettings } from '@/lib/verification';
import type { VerificationSettings } from '@/lib/types';

export async function GET() {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  return NextResponse.json({ verification: getVerificationSettings(db.settings.verification) });
}

export async function POST(req: Request) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const payload = (await req.json()) as Partial<VerificationSettings>;
    const db = getDb();
    const current = getVerificationSettings(db.settings.verification);
    const next = getVerificationSettings({
      ...current,
      ...payload,
      googleSearchConsole: { ...current.googleSearchConsole, ...(payload.googleSearchConsole ?? {}) },
      googleAdsense: { ...current.googleAdsense, ...(payload.googleAdsense ?? {}) },
      bing: { ...current.bing, ...(payload.bing ?? {}) },
      yandex: { ...current.yandex, ...(payload.yandex ?? {}) },
    });
    db.settings.verification = next;
    saveDb(db);
    return NextResponse.json({ success: true, verification: next });
  } catch (error) {
    console.error('Save verification settings error:', error);
    return NextResponse.json({ error: 'Unable to save verification settings.' }, { status: 500 });
  }
}