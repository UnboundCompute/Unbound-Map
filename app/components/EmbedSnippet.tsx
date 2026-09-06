'use client';

import { useEffect, useState } from 'react';
import type { SharedSnapshotContext } from '../../lib/view-model';

export function EmbedSnippet({ context = {} }: { context?: SharedSnapshotContext }) {
  const [origin, setOrigin] = useState('https://<your-design-map-host>');
  const [state, setState] = useState<'idle' | 'copied' | 'unavailable'>('idle');
  const [badgeState, setBadgeState] = useState<'idle' | 'copied' | 'unavailable'>('idle');
  useEffect(() => setOrigin(window.location.origin), []);
  const contextQuery = new URLSearchParams({ ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}), ...(context.region ? { region: context.region } : {}), ...(context.region ? { level: context.anchor ? '2' : '1' } : {}), ...(context.anchor ? { anchor: context.anchor } : {}) }).toString();
  const safeRepository = (context.repository ?? 'Repository').replace(/[^\w ./@:-]/g, '').trim().slice(0, 80) || 'Repository';
  const snippet = `<iframe src="${origin}/embed${contextQuery ? `?${contextQuery}` : ''}" title="${safeRepository} architecture map" width="100%" height="620" loading="lazy"></iframe>`;
  const previewQuery = new URLSearchParams({ ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}) }).toString();
  const badge = `[![${safeRepository} architecture field guide](${origin}/opengraph-image${previewQuery ? `?${previewQuery}` : ''})](${origin}/architecture${contextQuery ? `?${contextQuery}` : ''})`;
  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(snippet);
      } else {
        const field = document.createElement('textarea');
        field.value = snippet;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand('copy');
        field.remove();
        if (!copied) throw new Error('Clipboard unavailable');
      }
      setState('copied');
      window.setTimeout(() => setState('idle'), 1800);
    } catch {
      setState('unavailable');
      window.setTimeout(() => setState('idle'), 2600);
    }
  };
  const copyBadge = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(badge);
      } else {
        const field = document.createElement('textarea');
        field.value = badge;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand('copy');
        field.remove();
        if (!copied) throw new Error('Clipboard unavailable');
      }
      setBadgeState('copied');
      window.setTimeout(() => setBadgeState('idle'), 1800);
    } catch {
      setBadgeState('unavailable');
      window.setTimeout(() => setBadgeState('idle'), 2600);
    }
  };
  const label = state === 'copied' ? 'Embed code copied' : state === 'unavailable' ? 'Copy unavailable' : 'Copy embed code';
  const announcement = state === 'copied' ? 'Embed code copied.' : state === 'unavailable' ? 'Copy unavailable. Select the iframe code manually.' : '';
  const badgeLabel = badgeState === 'copied' ? 'Badge copied' : badgeState === 'unavailable' ? 'Copy unavailable' : 'Copy README badge';
  const badgeAnnouncement = badgeState === 'copied' ? 'README badge copied.' : badgeState === 'unavailable' ? 'Copy unavailable. Select the badge Markdown manually.' : '';
  return <section className="embed-snippet" aria-labelledby="embed-snippet-title"><div><h2 id="embed-snippet-title">Use this map in a README</h2><p>Copy the iframe when a visual orientation belongs inside an existing document.</p></div><code tabIndex={0} role="group" aria-label="Embed iframe code">{snippet}</code><button type="button" onClick={copy} title={state === 'unavailable' ? 'Copy the snippet from the code block above.' : undefined}>{label}</button><div className="embed-badge"><p>Prefer a small linked preview? Use a pinned Markdown badge.</p><code tabIndex={0} role="group" aria-label="README badge Markdown">{badge}</code><button type="button" onClick={copyBadge} title={badgeState === 'unavailable' ? 'Copy the badge Markdown from the code block above.' : undefined}>{badgeLabel}</button></div><span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span><span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{badgeAnnouncement}</span></section>;
}
