import Link from 'next/link';
import type { Metadata } from 'next';
import { DocsShell, EvidenceNote, PageIntro } from '../components/DocsShell';
import { HostedFlowGuide } from '../components/HostedFlowGuide';
import { emptySnapshot, snapshotWithContext, type SharedSnapshotContext } from '../../lib/view-model';
import { documentMetadata } from '../../lib/seo';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const query = await searchParams;
  const repository = one(query.repository);
  const label = repository ?? 'Repository';
  const bundle = one(query.bundle);
  return documentMetadata(`${label} architectural flow snapshot · Unbound Map`, `Review ${label}'s validated graph-backed architectural flow snapshot before opening the source.`, { repository, revision: one(query.revision), bundle });
}

export default async function FlowsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const context: SharedSnapshotContext = { repository: one(query.repository), revision: one(query.revision), bundle: one(query.bundle), flow: one(query.flow), step: one(query.step), branch: one(query.branch) };
  const snapshot = snapshotWithContext(emptySnapshot, context);
  if (!context.bundle) {
    return <DocsShell active="/flows" snapshot={snapshot} context={context}><div className="doc-page flows-page"><PageIntro title="Choose a repository first." snapshot={snapshot}>Architectural flows are generated from a validated graph snapshot. Select or build a repository to read its source-linked paths.</PageIntro><section className="map-state-panel" role="status" aria-live="polite" aria-atomic="true"><span className="map-state-label">No repository selected</span><h2>Open a repository to load its flows.</h2><p>Unbound Map does not show placeholder flows. Pick a cached repository or add a public repository URL to begin.</p><Link className="primary-button" href="/">Choose a repository <span aria-hidden="true">→</span></Link></section></div></DocsShell>;
  }
  return <DocsShell active="/flows" snapshot={snapshot} context={context}><div className="doc-page flows-page"><PageIntro title="Which path explains this repository?" snapshot={snapshot}>Choose a bounded graph-backed path, then read one source-linked handoff at a time.</PageIntro><HostedFlowGuide bundleId={context.bundle} context={context} initialFlow={one(query.flow)} initialStep={one(query.step)} /><EvidenceNote>Graph-backed paths are static call-path projections selected for comprehension. They do not prove that one request executed every step or that an input reached a security-sensitive effect.</EvidenceNote></div></DocsShell>;
}
