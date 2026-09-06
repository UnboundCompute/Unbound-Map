'use client';

import { useState } from 'react';

export function ShareButton({ href }: { href?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'unavailable'>('idle');
  const copy = async () => {
    try {
      const shareUrl = href ?? window.location.href;
      if (navigator.share) {
        await navigator.share({ title: document.title, url: shareUrl });
        setState('copied');
        window.setTimeout(() => setState('idle'), 1800);
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const field = document.createElement('textarea');
        field.value = shareUrl;
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
  const announcement = state === 'copied' ? 'Share link ready.' : state === 'unavailable' ? 'Copy unavailable. Use the browser address bar to copy this page URL.' : '';
  return <><button type="button" className="share-button" onClick={copy} title={state === 'unavailable' ? 'Copy the page URL from your browser address bar.' : undefined}>{label} <span aria-hidden="true">{state === 'copied' ? '✓' : state === 'unavailable' ? '!' : '↗'}</span></button><span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span></>;
}
