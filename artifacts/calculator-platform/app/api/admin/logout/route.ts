import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/session';

export async function GET(req: Request) {
  await deleteSession();
  const url = new URL('/admin', req.url);
  return NextResponse.redirect(url);
}
