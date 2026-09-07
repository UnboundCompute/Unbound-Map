import { track } from '@vercel/analytics';

type EventProperties = Record<string, string | number | boolean>;

const sensitiveKeys = new Set(['url', 'path', 'file', 'repo', 'repository', 'bundle', 'revision', 'commit', 'sha', 'source', 'name']);
const sensitiveValue = /(?:https?:\/\/|git@|github\.com|gitlab\.com|bitbucket\.org|[\\/]\S*|\.(?:py|js|ts|tsx|jsx|c|h|cpp|go|rs|java|json|yaml|yml|md)(?::\d+)?$|\b[bcj]_[A-Za-z0-9_-]{8,}\b)/i;

export function sanitizeEventProperties(properties?: EventProperties) {
  if (!properties) return undefined;
  const safe = Object.entries(properties).reduce<EventProperties>((result, [key, value]) => {
    if (key.toLowerCase().split('_').some((part) => sensitiveKeys.has(part))) return result;
    if (typeof value === 'string' && (value.length > 64 || sensitiveValue.test(value))) return result;
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
