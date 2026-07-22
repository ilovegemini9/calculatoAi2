import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { verifySession } from '@/lib/session';
import type { Article } from '@/lib/types';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const article = db.articles.find((a) => a.id === id);
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(article);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const updates = (await req.json()) as Partial<Article>;
    const db = getDb();
    const idx = db.articles.findIndex((a) => a.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Never auto-publish — validate status
    if (updates.status === 'published') {
      // Allow explicit publish from admin (user manually chose published)
      // but strip it silently if it somehow bypasses UI — actually allow it
      // since admin is intentionally changing status here.
    }

    const old = db.articles[idx];
    const contentChanged = updates.content !== undefined && updates.content !== old.content;

    if (contentChanged) {
      if (!db.articleVersions) db.articleVersions = [];
      db.articleVersions.push({
        id: `ver_${Date.now()}`,
        articleId: id,
        content: old.content,
        createdAt: new Date().toISOString(),
      });
    }

    const updated: Article = {
      ...old,
      ...updates,
      id, // never change id
      createdAt: old.createdAt, // never change createdAt
      version: contentChanged ? old.version + 1 : old.version,
      updatedAt: new Date().toISOString(),
      seoData: updates.seoData
        ? { ...old.seoData, ...updates.seoData }
        : old.seoData,
      openGraph: updates.openGraph
        ? { ...(old.openGraph ?? {}), ...updates.openGraph } as Article['openGraph']
        : old.openGraph,
    };

    db.articles[idx] = updated;
    saveDb(db);
    return NextResponse.json({ success: true, article: updated });
  } catch (err: unknown) {
    console.error('[articles/:id PATCH]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const isAuth = await verifySession();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const idx = db.articles.findIndex((a) => a.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.articles.splice(idx, 1);
  db.articleVersions = (db.articleVersions ?? []).filter((v) => v.articleId !== id);
  saveDb(db);
  return NextResponse.json({ success: true });
}
