const DEFAULT_LACHESIS_URL = 'https://lachesis.unboundcompute.com';

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
