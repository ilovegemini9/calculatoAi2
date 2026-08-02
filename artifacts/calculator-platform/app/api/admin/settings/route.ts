export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { getPublicAiSettings, getAiSettings } from '@/lib/ai';

export async function GET() {
  const isAuth = await verifySession();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    return NextResponse.json({
      ...db.settings,
      openrouterApiKey: undefined,
      ai: getPublicAiSettings(getAiSettings(db.settings.ai, db.settings.openrouterApiKey)),
    });
  } catch (err) {
    console.error('[API ERROR - GET /api/admin/settings]:', err);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const isAuth = await verifySession();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const db = getDb();

    db.settings = {
      ...db.settings,
      openrouterApiKey: db.settings.openrouterApiKey,
      adsenseEnabled: typeof payload.adsenseEnabled === 'boolean' ? payload.adsenseEnabled : db.settings.adsenseEnabled,
      adsenseCode: typeof payload.adsenseCode === 'string' ? payload.adsenseCode : db.settings.adsenseCode,
      analyticsCode: typeof payload.analyticsCode === 'string' ? payload.analyticsCode : db.settings.analyticsCode,
      seo: db.settings.seo,
      ads: db.settings.ads,
      verification: db.settings.verification,
      ai: db.settings.ai,
      featureFlags: {
        ...db.settings.featureFlags,
        aiEnabled: typeof payload.featureFlags?.aiEnabled === 'boolean' ? payload.featureFlags.aiEnabled : db.settings.featureFlags.aiEnabled,
        maintenanceMode: typeof payload.featureFlags?.maintenanceMode === 'boolean' ? payload.featureFlags.maintenanceMode : db.settings.featureFlags.maintenanceMode,
      }
    };

    saveDb(db);
    return NextResponse.json({
      success: true,
      settings: {
        ...db.settings,
        openrouterApiKey: undefined,
        ai: getPublicAiSettings(getAiSettings(db.settings.ai, db.settings.openrouterApiKey)),
      },
    });
  } catch (err) {
    console.error('Save settings error:', err);
    return NextResponse.json({ error: 'Internal server error saving configurations' }, { status: 500 });
  }
}
