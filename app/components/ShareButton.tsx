'use client';

import { useState } from 'react';

export function ShareButton() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  return <button type="button" className="share-button" onClick={copy} aria-live="polite">{copied ? 'Link copied' : 'Copy link'} <span aria-hidden="true">{copied ? '✓' : '↗'}</span></button>;
}
