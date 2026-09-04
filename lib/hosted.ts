const MAX_BUNDLE_BYTES = 25 * 1024 * 1024;
const BUNDLE_ID = /^b_[A-Za-z0-9_-]{8,128}$/;

function serviceUrl(path: string) {
  const configured = process.env.NEXT_PUBLIC_BUNDLE_API_URL?.trim().replace(/\/$/, '');
  if (!configured) return path;
  const base = new URL(configured);
  if (base.username || base.password || base.search || base.hash) throw new Error('Bundle API must be an origin and path only.');
  if (base.protocol !== 'https:' && process.env.NODE_ENV === 'production') throw new Error('Bundle API must use HTTPS in production.');
  return `${base}${path}`;
}

function requestSignal(signal?: AbortSignal) {
  const timeout = AbortSignal.timeout(30_000);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

/** Load one opaque Lachesis bundle without putting repository identity in the URL. */
export async function loadHostedBundle(bundleId: string, signal?: AbortSignal): Promise<unknown> {
  if (!BUNDLE_ID.test(bundleId)) throw new Error('This hosted map link is invalid.');

  let response: Response;
  try {
    response = await fetch(serviceUrl(`/api/bundles/${encodeURIComponent(bundleId)}`), {
      redirect: 'error',
      signal: requestSignal(signal),
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    if (error instanceof DOMException && error.name === 'TimeoutError') throw new Error('The hosted map took too long to respond.');
    throw new Error('The hosted map could not be reached. Check your connection and try again.');
  }

  if (!response.ok) {
    if (response.status === 404 || response.status === 410) throw new Error('This hosted map has expired or no longer exists.');
    throw new Error(`The hosted map could not be loaded (HTTP ${response.status}).`);
  }

  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BUNDLE_BYTES) throw new Error('This hosted map is too large to open.');
  const body = await response.text();
  if (new TextEncoder().encode(body).byteLength > MAX_BUNDLE_BYTES) throw new Error('This hosted map is too large to open.');
  try {
    return JSON.parse(body);
  } catch {
    throw new Error('The hosted map response was not valid JSON.');
  }
}
