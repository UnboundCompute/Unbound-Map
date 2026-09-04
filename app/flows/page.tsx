import Link from 'next/link';
import { DocsShell, EvidenceNote, PageIntro } from '../components/DocsShell';
import { FlowDiagram } from '../components/FlowDiagram';
import { illustrativeSnapshot } from '../../lib/view-model';

export default function FlowsPage() {
  return <DocsShell active="/flows"><div className="doc-page flows-page"><PageIntro title="How does a packet enter the engine?" snapshot={illustrativeSnapshot}>Follow one architectural journey from bytes on the wire into flow state. This is a design-level handoff story, not a runtime taint trace or a replacement for source reading.</PageIntro><section className="flow-intro"><span className="flow-label">Recommended first flow</span><h2>Packet bytes → validated layers → flow state</h2><p>The path names what changes at each boundary, the responsibility that owns the change, and the guard that makes the next stage safe to enter.</p><Link className="quiet-link" href="/flows/packet-decode">Open the dedicated flow page <span aria-hidden="true">→</span></Link></section><FlowDiagram /><section className="flow-next"><h2>Need the exact branch?</h2><p>Open a step in Lachesis when you need the function body, callers, dispatch targets, or source evidence.</p><Link className="quiet-link" href="/explore">See the handoff contract <span aria-hidden="true">→</span></Link></section><EvidenceNote>The flow is a generated or illustrative architectural explanation. It does not establish that an input reaches a security sink; use Lachesis for that question.</EvidenceNote></div></DocsShell>;
}
