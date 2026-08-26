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
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  // A stale/expired session should never leave an admin page stuck on a
  // generic "Unable to load" state. Return the user to the login screen and
  // preserve the page they were trying to open.
  if (response.status === 401 && typeof window !== 'undefined' && window.location.pathname !== '/admin') {
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const loginUrl = `/admin?returnTo=${encodeURIComponent(currentPath)}`;
    window.location.replace(loginUrl);
  }

  return response;
}
