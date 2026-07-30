import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { verifySession } from '@/lib/session';

export async function PATCH(req: Request) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { slug, enabled } = await req.json();
    if (!slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 });

    const db = getDb();
    const idx = db.calculators.findIndex((c) => c.slug === slug);
    if (idx === -1) return NextResponse.json({ error: 'Calculator not found' }, { status: 404 });

    // Only allow enabling if tests have passed
    if (enabled && db.calculators[idx].metadata.testStatus !== 'passed') {
      return NextResponse.json(
        { error: 'Calculator cannot be enabled until all tests pass' },
        { status: 400 },
      );
    }

    db.calculators[idx].status = enabled ? 'active' : 'inactive';
    saveDb(db);

    return NextResponse.json({ success: true, status: db.calculators[idx].status });
  } catch (err: unknown) {
    console.error('[factory/enable] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
