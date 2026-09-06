const DEFAULT_LACHESIS_URL = 'https://lachesis.unboundcompute.com';
// The hosted bundle API (/api/repos, /api/build, /api/bundles) is served by the
// AWS API Gateway, not the marketing/product origin above. Falling back to
// lachesis.unboundcompute.com returns a Vercel 404 for those routes, which is
// what left cached repositories and shared deep links unable to load.
const DEFAULT_BUNDLE_API_URL = 'https://56h5zgua56.execute-api.us-east-1.amazonaws.com';

export function bundleApiOrigin() {
  const configured = process.env.NEXT_PUBLIC_BUNDLE_API_URL?.trim();
  if (!configured) return DEFAULT_BUNDLE_API_URL;
  try {
    const parsed = new URL(configured);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) return DEFAULT_BUNDLE_API_URL;
    return parsed.toString().replace(/\/$/, '');
  } catch { return DEFAULT_BUNDLE_API_URL; }
}

export function lachesisOrigin() {
  const configured = process.env.NEXT_PUBLIC_LACHESIS_URL?.trim();
  if (!configured) return DEFAULT_LACHESIS_URL;
  try {
    const parsed = new URL(configured);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) return DEFAULT_LACHESIS_URL;
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return DEFAULT_LACHESIS_URL;
  }
}
