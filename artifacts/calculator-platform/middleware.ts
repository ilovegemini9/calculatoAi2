import { NextResponse } from 'next/server';

/**
 * Admin authentication is handled by the admin layout and API route handlers.
 * Keep middleware as a completely transparent pass-through so nested admin
 * navigations preserve the browser's Cookie header exactly as received.
 */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|llms\\.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|otf|eot)).*)',
  ],
};
