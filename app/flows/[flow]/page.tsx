import { notFound } from 'next/navigation';
import { DocsShell, EvidenceNote, PageIntro } from '../../components/DocsShell';
import { FlowDiagram } from '../../components/FlowDiagram';
import { illustrativeSnapshot } from '../../../lib/view-model';

const flows = { 'packet-decode': { title: 'Packet decode into flow state', intro: 'Follow one architectural journey from bytes on the wire into the stateful unit used by downstream parsers.' } };

export function generateStaticParams() { return Object.keys(flows).map((flow) => ({ flow })); }

export default async function FlowPage({ params }: { params: Promise<{ flow: string }> }) {
  const { flow } = await params;
  const entry = flows[flow as keyof typeof flows];
  if (!entry) notFound();
  return <DocsShell active="/flows"><div className="doc-page flows-page"><PageIntro title={entry.title} snapshot={illustrativeSnapshot}>{entry.intro} This is a design-level handoff story, not a runtime taint trace or a replacement for source reading.</PageIntro><section className="flow-intro"><span className="flow-label">Canonical design flow</span><h2>Packet bytes → validated layers → flow state</h2><p>The path names what changes at each boundary, the responsibility that owns the change, and the guard that makes the next stage safe to enter.</p></section><FlowDiagram route={`/flows/${flow}`} /><EvidenceNote>Illustrative architectural explanation. Presence in this flow does not establish that an input reaches a security sink; use Lachesis for that question.</EvidenceNote></div></DocsShell>;
}
