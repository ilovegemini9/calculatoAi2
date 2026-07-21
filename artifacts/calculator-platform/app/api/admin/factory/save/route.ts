import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { validateGeneratedCode } from '@/lib/security';
import type { Calculator } from '@/lib/types';

export async function POST(req: Request) {
  const isAuth = await verifySession();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await req.json();
    if (!payload.name || !payload.slug || !payload.calculateBody) {
      return NextResponse.json({ error: 'Name, slug, and calculateBody are required' }, { status: 400 });
    }

    // Safety check again
    const violations = validateGeneratedCode({
      meta: { calculateBody: payload.calculateBody }
    });

    if (violations.length > 0) {
      return NextResponse.json({ 
        error: `Security Alert: The formula contains unsafe references: ${violations.join(', ')}` 
      }, { status: 400 });
    }

    const db = getDb();
    const slug = payload.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check if dynamic calculator already exists, or overwrite/update
    const existingIndex = db.calculators.findIndex((c) => c.slug === slug);

    const calcData: Calculator = {
      id: payload.id || `calc_${Math.random().toString(36).substr(2, 9)}`,
      slug,
      name: payload.name,
      category: payload.category || 'lifestyle',
      status: 'active',
      metadata: {
        title: payload.title || payload.name,
        description: payload.description || '',
        keywords: Array.isArray(payload.keywords) ? payload.keywords : [],
        inputs: payload.inputs || [],
        outputs: payload.outputs || [],
        calculateBody: payload.calculateBody,
        howToUse: payload.howToUse || [],
        faqItems: payload.faqItems || [],
        shortDescription: payload.shortDescription || '',
      },
      settings: {
        customFormula: payload.calculateBody,
      },
      createdAt: payload.createdAt || new Date().toISOString(),
    };

    if (existingIndex > -1) {
      db.calculators[existingIndex] = calcData;
    } else {
      db.calculators.push(calcData);
    }

    saveDb(db);
    return NextResponse.json({ success: true, calculator: calcData });
  } catch (err: unknown) {
    console.error('Save dynamic calculator error:', err);
    return NextResponse.json({ error: 'Internal server error saving dynamic calculator' }, { status: 500 });
  }
}

export async function GET() {
  const isAuth = await verifySession();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  return NextResponse.json(db.calculators);
}

export async function DELETE(req: Request) {
  const isAuth = await verifySession();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const db = getDb();
    db.calculators = db.calculators.filter((c) => c.slug !== slug);
    saveDb(db);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
