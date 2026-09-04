import Link from 'next/link';
import { DocsShell, DocTabs } from '../components/DocsShell';
import { MapClient } from '../components/MapClient';

export default function FlowPage() {
  return <DocsShell active="/flow"><div className="doc-page"><DocTabs active="/flow" /><p className="doc-kicker">Data flow · one route</p><h1 className="doc-title">Follow one meaningful path.</h1><p className="doc-lede">A packet becomes useful only through a chain of handoffs. This route keeps the nouns visible while you move from capture to alert.</p><div className="flow-steps"><span>01 <b>packet bytes</b></span><span>02 <b>normalized event</b></span><span>03 <b>signature cursor</b></span><span>04 <b>alert record</b></span></div><MapClient mode="flow" /><div className="doc-prose"><h2>What to notice</h2><p>Each handoff changes the vocabulary: bytes become an event, an event becomes a cursor, and a cursor becomes an effect. If a path feels surprising, open its anchor in Lachesis and inspect the symbol-level evidence.</p><Link className="text-link" href="/explore">Continue to the code reading room →</Link></div></div></DocsShell>;
}
