/**
 * Unified fetch wrapper for all admin API calls.
 *
 * Always passes `credentials: 'include'` so the session cookie is forwarded
 * on every request — even from Client Components where the browser's default
 * same-origin cookie behaviour is unreliable across Vercel edge / Cloudflare
 * proxy hops that set additional CORS headers.
 */
export async function fetchAdmin(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'include',
  });
}
