import Link from 'next/link';
import { trustSurfaces, illustrativeSnapshot } from '../../lib/view-model';

export function TrustGlossary() {
  return (
    <section className="trust-glossary" aria-label="Trust surface glossary">
      <div className="trust-key" aria-label="Trust surface kinds"><span><i className="kind-source" /> source · enters</span><span><i className="kind-guard" /> guard · protects</span><span><i className="kind-sink" /> sink · leaves</span></div>
      {trustSurfaces.map((surface) => <article className="trust-entry" key={surface.id}><div className="trust-kind"><i className={`kind-${surface.kind}`} />{surface.kind}</div><div><h2>{surface.label}</h2><p>{surface.obligation}</p><div className="trust-meta"><code>{surface.location}</code><Link className="text-link" href={`/explore?repository=${encodeURIComponent(illustrativeSnapshot.repository)}&revision=${illustrativeSnapshot.revision}&region=${surface.id}&anchor=${encodeURIComponent(surface.anchor)}`}>Inspect {surface.anchor} →</Link></div></div></article>)}
    </section>
  );
}
