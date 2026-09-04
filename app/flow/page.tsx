import Link from 'next/link';
import { DocsShell, DocTabs } from '../components/DocsShell';
import { FlowDiagram } from '../components/FlowDiagram';

export default function FlowPage() {
  return <DocsShell active="/flow"><div className="doc-page"><DocTabs active="/flow" /><p className="doc-kicker">Data flow · one route</p><h1 className="doc-title">Follow one meaningful path.</h1><p className="doc-lede">A packet becomes useful through a chain of handoffs. This page names the value at each stage, the responsibility that owns it, and the guard that makes the next stage safe to enter.</p><FlowDiagram /><div className="doc-prose"><h2>How to read this</h2><p>Read the bold noun as the thing being handed over. Read the smaller line as the boundary it crosses. The guard is an obligation, not a finding. If a handoff feels surprising, inspect its anchor in Lachesis.</p><Link className="text-link" href="/explore">Open the code reading room →</Link></div></div></DocsShell>;
}
