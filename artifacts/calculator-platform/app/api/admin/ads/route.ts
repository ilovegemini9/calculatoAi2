import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';
import { getDb, saveDb } from '@/lib/db';
import { getAdsSettings } from '@/lib/ads';
import type { AdsSettings } from '@/lib/types';

export async function GET() {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  return NextResponse.json({ ads: getAdsSettings(db.settings.ads) });
}

export async function POST(req: Request) {
  if (!(await verifySession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const payload = (await req.json()) as Partial<AdsSettings>;
    const db = getDb();
    const current = getAdsSettings(db.settings.ads);
    const next = getAdsSettings({
      ...current,
      ...payload,
      slots: {
        ...current.slots,
        ...(payload.slots ?? {}),
      },
    });

    for (const slot of Object.values(next.slots)) {
      slot.desktopHeight = Math.max(0, Math.min(1000, Math.round(Number(slot.desktopHeight) || 0)));
      slot.mobileHeight = Math.max(0, Math.min(1000, Math.round(Number(slot.mobileHeight) || 0)));
    }

    db.settings.ads = next;
    saveDb(db);
    return NextResponse.json({ success: true, ads: next });
  } catch (error) {
    console.error('Save ads settings error:', error);
    return NextResponse.json({ error: 'Unable to save ads settings.' }, { status: 500 });
  }
}