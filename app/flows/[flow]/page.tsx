import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DocsShell, EvidenceNote, PageIntro } from '../../components/DocsShell';
import { FlowDiagram } from '../../components/FlowDiagram';
import { illustrativeSnapshot, snapshotWithContext, type SharedSnapshotContext } from '../../../lib/view-model';

const flows = { 'packet-decode': { title: 'Packet decode into flow state', intro: 'Follow one architectural journey from bytes on the wire into the stateful unit used by downstream parsers.' } };

export function generateStaticParams() { return Object.keys(flows).map((flow) => ({ flow })); }

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export async function generateMetadata({ params, searchParams }: { params: Promise<{ flow: string }>; searchParams: SearchParams }): Promise<Metadata> {
  const { flow } = await params;
  const repository = one((await searchParams).repository);
  const entry = flows[flow as keyof typeof flows];
  const label = repository ? `${repository} · ` : '';
  return entry ? { title: `${label}${entry.title} · Design Map`, description: `${entry.intro} Read the architectural handoffs before the source.` } : { title: `${label}Architectural flow · Design Map` };
}

export default async function FlowPage({ params, searchParams }: { params: Promise<{ flow: string }>; searchParams: SearchParams }) {
  const { flow } = await params;
  const query = await searchParams;
  const entry = flows[flow as keyof typeof flows];
  if (!entry) notFound();
  const context: SharedSnapshotContext = { repository: one(query.repository), revision: one(query.revision), bundle: one(query.bundle) };
  const snapshot = snapshotWithContext(illustrativeSnapshot, context);
  return <DocsShell active="/flows" snapshot={snapshot}><div className="doc-page flows-page"><PageIntro title={entry.title} snapshot={snapshot}>{entry.intro} This is a design-level handoff story, not a runtime taint trace or a replacement for source reading.</PageIntro><section className="flow-intro"><span className="flow-label">Canonical design flow</span><h2>Packet bytes → validated layers → flow state</h2><p>The path names what changes at each boundary, the responsibility that owns the change, and the guard that makes the next stage safe to enter.</p></section><FlowDiagram route={`/flows/${flow}`} context={context} /><EvidenceNote>Illustrative architectural explanation. Presence in this flow does not establish that an input reaches a security sink; use Lachesis for that question.</EvidenceNote></div></DocsShell>;
}
