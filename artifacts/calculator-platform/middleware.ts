import { NextRequest, NextResponse } from 'next/server';

/**
 * Keep one browser origin for the whole production app.
 * Admin sessions intentionally use a __Host- cookie, so allowing the apex
 * and www hosts to serve the app independently can create two separate
 * sessions. Redirect the apex host to the canonical www host before any
 * application request is rendered.
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0]?.toLowerCase();
  if (hostname === 'luckyhoroscope.online') {
    const url = request.nextUrl.clone();
    url.hostname = 'www.luckyhoroscope.online';
    url.protocol = 'https:';
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|llms\\.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|otf|eot)).*)',
  ],
};
