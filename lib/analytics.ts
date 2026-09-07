import { track } from '@vercel/analytics';

type EventProperties = Record<string, string | number | boolean>;

const sensitiveKeys = new Set(['url', 'path', 'file', 'repo', 'repository', 'bundle', 'revision', 'commit', 'sha', 'source', 'name']);

export function sanitizeEventProperties(properties?: EventProperties) {
  if (!properties) return undefined;
  const safe = Object.entries(properties).reduce<EventProperties>((result, [key, value]) => {
    if (key.toLowerCase().split('_').some((part) => sensitiveKeys.has(part))) return result;
    if (typeof value === 'string' && value.length > 64) return result;
    if (typeof value === 'number' && !Number.isFinite(value)) return result;
    result[key] = value;
    return result;
  }, {});
  return Object.keys(safe).length ? safe : undefined;
}

/** Aggregate-only instrumentation; repository and source identifiers never leave the page. */
export function trackEvent(name: string, properties?: EventProperties) {
  if (typeof window === 'undefined') return;
  void track(name, sanitizeEventProperties(properties));
}
