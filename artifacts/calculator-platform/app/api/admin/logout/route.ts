export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { deleteSessionOnResponse, revokeCurrentSession } from '@/lib/session';

export async function GET(req: Request) {
  await revokeCurrentSession();
  const url = new URL('/admin', req.url);
  const response = NextResponse.redirect(url);
  deleteSessionOnResponse(response);
  return response;
}
