'use client';

import { useState } from 'react';

export function ShareButton() {
  const [state, setState] = useState<'idle' | 'copied' | 'unavailable'>('idle');
  const copy = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url: window.location.href });
        setState('copied');
        window.setTimeout(() => setState('idle'), 1800);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setState('copied');
      window.setTimeout(() => setState('idle'), 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setState('idle');
        return;
      }
      setState('unavailable');
      window.setTimeout(() => setState('idle'), 2600);
    }
  };
  const label = state === 'copied' ? 'Link ready' : state === 'unavailable' ? 'Copy unavailable' : 'Copy link';
  return <button type="button" className="share-button" onClick={copy} aria-live="polite" title={state === 'unavailable' ? 'Copy the page URL from your browser address bar.' : undefined}>{label} <span aria-hidden="true">{state === 'copied' ? '✓' : state === 'unavailable' ? '!' : '↗'}</span></button>;
}
