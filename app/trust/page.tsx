import Link from 'next/link';
import { DocsShell, DocTabs } from '../components/DocsShell';
import { MapClient } from '../components/MapClient';

export default function TrustPage() {
  return <DocsShell active="/trust"><div className="doc-page"><DocTabs active="/trust" /><p className="doc-kicker">Trust surface · glossary</p><h1 className="doc-title">Name the obligations.</h1><p className="doc-lede">Trust is not a color on a graph. It is the set of assumptions that must hold before data crosses a boundary or becomes an effect.</p><MapClient mode="trust" /><div className="trust-list"><article><span>01</span><div><h2>External packet</h2><p>Untrusted bytes arrive here. Length and framing must be established before use.</p></div></article><article><span>02</span><div><h2>Validation gate</h2><p>Normalization establishes the invariants downstream stages rely on.</p></div></article><article><span>03</span><div><h2>Alert sink</h2><p>Data leaves the processing boundary through configured alert and telemetry consumers.</p></div></article></div><Link className="text-link" href="/explore">Inspect the boundary in Lachesis →</Link></div></DocsShell>;
}
