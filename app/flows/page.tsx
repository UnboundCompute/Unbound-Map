import Link from 'next/link';
import type { Metadata } from 'next';
import { DocsShell, EvidenceNote, PageIntro } from '../components/DocsShell';
import { FlowDiagram } from '../components/FlowDiagram';
import { illustrativeSnapshot, snapshotWithContext, type SharedSnapshotContext } from '../../lib/view-model';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const repository = one((await searchParams).repository);
  const label = repository ?? illustrativeSnapshot.repository;
  return { title: `${label} architectural flows · Design Map`, description: `Follow a canonical packet journey through ${label}, one design boundary at a time.` };
}

export default async function FlowsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const context: SharedSnapshotContext = { repository: one(query.repository), revision: one(query.revision), bundle: one(query.bundle) };
  const snapshot = snapshotWithContext(illustrativeSnapshot, context);
  const contextQuery = new URLSearchParams({ ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}) }).toString();
  return <DocsShell active="/flows" snapshot={snapshot} context={context}><div className="doc-page flows-page"><PageIntro title="How does a packet enter the engine?" snapshot={snapshot}>Follow one architectural journey from bytes on the wire into flow state. This is a design-level handoff story, not a runtime taint trace or a replacement for source reading.</PageIntro><section className="flow-intro"><span className="flow-label">Recommended first flow</span><h2>Packet bytes → validated layers → flow state</h2><p>The path names what changes at each boundary, the responsibility that owns the change, and the guard that makes the next stage safe to enter.</p><Link className="quiet-link" href={`/flows/packet-decode${contextQuery ? `?${contextQuery}` : ''}`}>Open the dedicated flow page <span aria-hidden="true">→</span></Link></section><FlowDiagram context={context} /><section className="flow-next"><h2>Need the exact branch?</h2><p>Open a step in Lachesis when you need the function body, callers, dispatch targets, or source evidence.</p><Link className="quiet-link" href={`/explore${contextQuery ? `?${contextQuery}` : ''}`}>See the handoff contract <span aria-hidden="true">→</span></Link></section><EvidenceNote>The flow is a generated or illustrative architectural explanation. It does not establish that an input reaches a security sink; use Lachesis for that question.</EvidenceNote></div></DocsShell>;
}
