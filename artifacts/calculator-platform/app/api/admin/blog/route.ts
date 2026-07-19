import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { verifySession } from '@/lib/session';
import type { Article } from '@/lib/types';

export async function GET() {
  const isAuth = await verifySession();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  return NextResponse.json(db.articles);
}

export async function POST(req: Request) {
  const isAuth = await verifySession();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const db = getDb();

    if (!payload.title || !payload.content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const slug = payload.slug || payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = payload.id || `art_${Math.random().toString(36).substr(2, 9)}`;

    const existingIndex = db.articles.findIndex((a) => a.id === id);

    const articleData: Article = {
      id,
      calculatorId: payload.calculatorId || '',
      slug,
      title: payload.title,
      content: payload.content,
      status: payload.status || 'draft',
      seoData: {
        title: payload.seoData?.title || payload.title,
        description: payload.seoData?.description || payload.content.substr(0, 150),
        keywords: Array.isArray(payload.seoData?.keywords) ? payload.seoData.keywords : [],
        canonicalUrl: payload.seoData?.canonicalUrl || `/blog/${slug}`,
      },
      version: payload.version || 1,
      createdAt: payload.createdAt || new Date().toISOString(),
    };

    if (existingIndex > -1) {
      // Create a version record for history
      const oldArticle = db.articles[existingIndex];
      db.articleVersions.push({
        id: `ver_${Math.random().toString(36).substr(2, 9)}`,
        articleId: oldArticle.id,
        content: oldArticle.content,
        createdAt: new Date().toISOString(),
      });

      articleData.version = oldArticle.version + 1;
      db.articles[existingIndex] = articleData;
    } else {
      db.articles.push(articleData);
    }

    saveDb(db);
    return NextResponse.json({ success: true, article: articleData });
  } catch (err) {
    console.error('Blog route error:', err);
    return NextResponse.json({ error: 'Internal server error saving blog post' }, { status: 500 });
  }
}
export async function DELETE(req: Request) {
  const isAuth = await verifySession();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const db = getDb();
    db.articles = db.articles.filter((a) => a.id !== id);
    saveDb(db);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
