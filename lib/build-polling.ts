export function retryAfterMilliseconds(value: string | null, now = Date.now()): number | undefined {
  if (!value?.trim()) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(30_000, seconds * 1000);
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.min(30_000, Math.max(0, timestamp - now)) : undefined;
}

export function pollDelayMilliseconds(attempt: number, retryAfter?: number, jitter = 0) {
  if (retryAfter != null) return Math.max(0, Math.min(30_000, retryAfter));
  const base = Math.min(8_000, 1_000 + Math.max(0, attempt) * 500);
  return base + Math.max(0, Math.min(250, jitter));
}
