import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BundlePendingState, DocsShell, EvidenceNote, PageIntro } from '../../components/DocsShell';
import { FlowDiagram } from '../../components/FlowDiagram';
import { illustrativeSnapshot, snapshotWithContext, type SharedSnapshotContext } from '../../../lib/view-model';
import { documentMetadata } from '../../../lib/seo';

const flows = { 'packet-decode': { title: 'Packet decode into flow state', intro: 'Follow one architectural journey from bytes on the wire into the stateful unit used by downstream parsers.' } };

export function generateStaticParams() { return Object.keys(flows).map((flow) => ({ flow })); }

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export async function generateMetadata({ params, searchParams }: { params: Promise<{ flow: string }>; searchParams: SearchParams }): Promise<Metadata> {
  const { flow } = await params;
  const metadataQuery = await searchParams;
  const repository = one(metadataQuery.repository) ?? illustrativeSnapshot.repository;
  const entry = flows[flow as keyof typeof flows];
  const label = `${repository} · `;
  const bundle = one(metadataQuery.bundle);
  const imageContext = { repository, revision: one(metadataQuery.revision), bundle: one(metadataQuery.bundle) };
  return bundle
    ? documentMetadata(`${label}Architectural flow snapshot · Design Map`, `Review ${repository}'s validated graph-backed architectural flow snapshot before opening the source.`, imageContext)
    : entry ? documentMetadata(`${label}${entry.title} · Design Map`, `${entry.intro} Read the architectural handoffs before the source.`, imageContext) : documentMetadata(`${label}Architectural flow · Design Map`, 'Read the architectural handoffs before the source.', imageContext);
}

export default async function FlowPage({ params, searchParams }: { params: Promise<{ flow: string }>; searchParams: SearchParams }) {
  const { flow } = await params;
  const query = await searchParams;
  const entry = flows[flow as keyof typeof flows];
  if (!entry) notFound();
  const context: SharedSnapshotContext = { repository: one(query.repository), revision: one(query.revision), bundle: one(query.bundle), flow, step: one(query.step), branch: one(query.branch) };
  const snapshot = snapshotWithContext(illustrativeSnapshot, context);
  return <DocsShell active="/flows" snapshot={snapshot} context={context}><div className="doc-page flows-page"><PageIntro title={context.bundle ? 'Architectural flow snapshot' : entry.title} snapshot={snapshot}>{context.bundle ? 'A graph-backed flow will appear after the requested snapshot is validated.' : `${entry.intro} This is a design-level handoff story, not a runtime taint trace or a replacement for source reading.`}</PageIntro>{context.bundle ? <><BundlePendingState snapshot={snapshot} context={context} subject="architectural flow" /><EvidenceNote>The requested bundle is not yet verified. Flow steps and guards remain hidden until its graph projection succeeds.</EvidenceNote></> : <><section className="flow-intro"><span className="flow-label">Canonical design flow</span><h2>Packet bytes → validated layers → flow state</h2><p>The path names what changes at each boundary, the responsibility that owns the change, and the guard that makes the next stage safe to enter.</p></section><FlowDiagram route={`/flows/${flow}`} context={context} initialStep={one(query.step)} /><EvidenceNote>Illustrative architectural explanation. Presence in this flow does not establish that an input reaches a security sink; use Lachesis for that question.</EvidenceNote></>}</div></DocsShell>;
}
