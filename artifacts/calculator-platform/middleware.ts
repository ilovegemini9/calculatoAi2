import { type NextRequest, NextResponse } from 'next/server';

/**
 * Minimal pass-through middleware.
 *
 * Purpose: guarantee that static assets, API routes, and all nested /admin/*
 * deep-links reach their handlers with the session cookie intact.
 *
 * We intentionally do NOT perform auth checks here — auth is enforced
 * per-route via verifySession() so that each handler can return a structured
 * JSON 401 rather than a redirect that confuses the fetch() callers in the
 * admin UI. Doing auth in middleware AND in the route handlers would create
 * a double-verification path that is harder to debug.
 *
 * What this file achieves:
 *  - Applies the matcher so Next.js never runs middleware on _next/* static
 *    files or image-optimisation URLs (performance, avoids noise).
 *  - Explicitly forwards all request headers — including Cookie — unchanged,
 *    so the session cookie is never stripped on nested paths like
 *    /admin/settings/ai or /api/admin/logs.
 */
export function middleware(request: NextRequest) {
  // Pass the request through unchanged — preserve all headers/cookies.
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *   - _next/static  (compiled JS/CSS bundles)
     *   - _next/image   (image optimisation endpoint)
     *   - favicon.ico, robots.txt, sitemap.xml, llms.txt (public static files)
     *   - /public/*     (any other public static assets)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|llms\\.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|otf|eot)).*)',
  ],
};
