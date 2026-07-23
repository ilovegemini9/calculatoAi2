import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { verifySession } from '@/lib/session';

export async function GET() {
  const isAuth = await verifySession();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  return NextResponse.json(db.settings);
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
      openrouterApiKey: typeof payload.openrouterApiKey === 'string' ? payload.openrouterApiKey : db.settings.openrouterApiKey,
      adsenseEnabled: typeof payload.adsenseEnabled === 'boolean' ? payload.adsenseEnabled : db.settings.adsenseEnabled,
      adsenseCode: typeof payload.adsenseCode === 'string' ? payload.adsenseCode : db.settings.adsenseCode,
      analyticsCode: typeof payload.analyticsCode === 'string' ? payload.analyticsCode : db.settings.analyticsCode,
      seo: db.settings.seo,
      featureFlags: {
        ...db.settings.featureFlags,
        aiEnabled: typeof payload.featureFlags?.aiEnabled === 'boolean' ? payload.featureFlags.aiEnabled : db.settings.featureFlags.aiEnabled,
        maintenanceMode: typeof payload.featureFlags?.maintenanceMode === 'boolean' ? payload.featureFlags.maintenanceMode : db.settings.featureFlags.maintenanceMode,
      }
    };

    saveDb(db);
    return NextResponse.json({ success: true, settings: db.settings });
  } catch (err) {
    console.error('Save settings error:', err);
    return NextResponse.json({ error: 'Internal server error saving configurations' }, { status: 500 });
  }
}
