'use client';

import { useEffect, useState } from 'react';
import type { SharedSnapshotContext } from '../../lib/view-model';

export function EmbedSnippet({ context = {} }: { context?: SharedSnapshotContext }) {
  const [origin, setOrigin] = useState('https://<your-design-map-host>');
  const [state, setState] = useState<'idle' | 'copied' | 'unavailable'>('idle');
  useEffect(() => setOrigin(window.location.origin), []);
  const contextQuery = new URLSearchParams({ ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}) }).toString();
  const safeRepository = (context.repository ?? 'Repository').replace(/[^\w ./@:-]/g, '').trim().slice(0, 80) || 'Repository';
  const snippet = `<iframe src="${origin}/embed${contextQuery ? `?${contextQuery}` : ''}" title="${safeRepository} architecture map" width="100%" height="620" loading="lazy"></iframe>`;
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
  const label = state === 'copied' ? 'Embed code copied' : state === 'unavailable' ? 'Copy unavailable' : 'Copy embed code';
  return <section className="embed-snippet" aria-labelledby="embed-snippet-title"><div><h2 id="embed-snippet-title">Use this map in a README</h2><p>Copy the iframe when a visual orientation belongs inside an existing document.</p></div><code>{snippet}</code><button type="button" onClick={copy} aria-live="polite" title={state === 'unavailable' ? 'Copy the snippet from the code block above.' : undefined}>{label}</button></section>;
}
