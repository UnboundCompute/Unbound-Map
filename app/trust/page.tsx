import Link from 'next/link';
import { DocsShell, DocTabs } from '../components/DocsShell';
import { TrustGlossary } from '../components/TrustGlossary';

export default function TrustPage() {
  return <DocsShell active="/trust"><div className="doc-page"><DocTabs active="/trust" /><p className="doc-kicker">Trust surface · glossary</p><h1 className="doc-title">Where obligations begin.</h1><p className="doc-lede">This is an index of places where data enters, is constrained, or leaves the processing boundary. It names an obligation; it does not call a shape a vulnerability.</p><TrustGlossary /><div className="doc-prose"><h2>How to use the glossary</h2><p>Start with the kind of surface you are investigating. Then open its anchor in Lachesis to inspect the guards, callers, and source evidence that support the description.</p><Link className="text-link" href="/explore">Open the code reading room →</Link></div></div></DocsShell>;
}
