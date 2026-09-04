'use client';

import { useEffect, useState } from 'react';

export function EmbedSnippet() {
  const [origin, setOrigin] = useState('https://<your-design-map-host>');
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const snippet = `<iframe src="${origin}/embed" title="Repository architecture map" width="100%" height="620" loading="lazy"></iframe>`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { setCopied(false); }
  };
  return <section className="embed-snippet" aria-labelledby="embed-snippet-title"><div><h2 id="embed-snippet-title">Use this map in a README</h2><p>Copy the iframe when a visual orientation belongs inside an existing document.</p></div><code>{snippet}</code><button type="button" onClick={copy}>{copied ? 'Embed code copied' : 'Copy embed code'}</button></section>;
}
