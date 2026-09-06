import { bundleApiOrigin } from './links';

const MAX_BUNDLE_BYTES = 25 * 1024 * 1024;
const BUNDLE_ID = /^b_[A-Za-z0-9_-]{8,128}$/;
const REPOSITORY_PART = /^[A-Za-z0-9._-]{1,100}$/;
const REPOSITORY_HOSTS = new Set(['github.com', 'gitlab.com', 'bitbucket.org']);

function serviceUrl(path: string) {
  // In the browser, use a same-origin relative path so the request goes through
  // this app's /api rewrite (see next.config.mjs). The bundle API origin sends
  // no CORS headers, so a direct cross-origin fetch from the browser is blocked;
  // the rewrite forwards to the bundle API server-side, where CORS does not
  // apply. On the server there is no origin to resolve a relative path against,
  // so call the absolute bundle API origin directly (no same-origin policy).
  if (typeof window !== 'undefined') return path;
  return `${bundleApiOrigin()}${path}`;
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
  let body: string;
  try {
    body = await response.text();
  } catch {
    throw new Error('The hosted map response could not be read. Try loading the snapshot again.');
  }
  if (new TextEncoder().encode(body).byteLength > MAX_BUNDLE_BYTES) throw new Error('This hosted map is too large to open.');
  try {
    return JSON.parse(body);
  } catch {
    throw new Error('The hosted map response was not valid JSON.');
  }
}

export type HostedRepositoryIndex = {
  repository?: string;
  revision?: string;
  bundle_id: string;
  curated_tour?: unknown;
};

/** Resolve only a publication candidate; callers decide whether curation is enough to index. */
export async function loadHostedRepository(host: string, owner: string, repo: string, revision?: string): Promise<HostedRepositoryIndex> {
  if (!process.env.NEXT_PUBLIC_BUNDLE_API_URL?.trim()) throw new Error('Hosted repository index is not configured.');
  if (!REPOSITORY_HOSTS.has(host) || !REPOSITORY_PART.test(owner) || !REPOSITORY_PART.test(repo)) throw new Error('This repository link is invalid.');
  if (revision && !/^[0-9a-f]{7,64}$/i.test(revision)) throw new Error('This repository revision is invalid.');
  const route = host === 'github.com'
    ? `/api/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
    : `/api/repos/${encodeURIComponent(host)}/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const suffix = revision ? `?revision=${encodeURIComponent(revision)}` : '';
  const response = await fetch(`${bundleApiOrigin()}${route}${suffix}`, { redirect: 'error', signal: requestSignal(), headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`The repository index could not be loaded (HTTP ${response.status}).`);
  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.bundle_id !== 'string' || !BUNDLE_ID.test(body.bundle_id)) throw new Error('The repository index returned an invalid bundle link.');
  return body as HostedRepositoryIndex;
}

export async function loadHostedRepositories(): Promise<HostedRepositoryIndex[]> {
  if (!process.env.NEXT_PUBLIC_BUNDLE_API_URL?.trim()) return [];
  const response = await fetch(`${bundleApiOrigin()}/api/repos`, { redirect: 'error', signal: requestSignal(), headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`The repository index could not be loaded (HTTP ${response.status}).`);
  const body = await response.json().catch(() => null) as { repositories?: unknown } | null;
  if (!body || !Array.isArray(body.repositories)) throw new Error('The repository index returned an invalid catalog.');
  return body.repositories.filter((item): item is HostedRepositoryIndex => Boolean(item && typeof item === 'object' && typeof (item as Record<string, unknown>).bundle_id === 'string' && BUNDLE_ID.test((item as Record<string, unknown>).bundle_id as string)));
}
