import { type NextRequest, NextResponse } from 'next/server';

/**
 * Pass-through middleware only.
 *
 * Admin authentication is intentionally handled by the admin layout and API
 * route handlers. Middleware must not rewrite request headers or perform a
 * second auth check: doing either can cause cookies to be lost/duplicated on
 * Vercel when navigating between nested admin routes and /api/admin/*.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|llms\\.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|otf|eot)).*)',
  ],
};
