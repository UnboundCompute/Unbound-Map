import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DocsShell, EvidenceNote, PageIntro } from '../../components/DocsShell';
import { HostedFlowGuide } from '../../components/HostedFlowGuide';
import { emptySnapshot, snapshotWithContext, type SharedSnapshotContext } from '../../../lib/view-model';
import { documentMetadata } from '../../../lib/seo';

// The flow path is driven entirely by a request-time bundle query, so there is
// nothing to prerender: render it on demand.
export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

function flowLabel(flow: string) {
  return decodeURIComponent(flow).replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Selected flow';
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ flow: string }>; searchParams: SearchParams }): Promise<Metadata> {
  const { flow } = await params;
  const metadataQuery = await searchParams;
  const repository = one(metadataQuery.repository) ?? 'Repository';
  const bundle = one(metadataQuery.bundle);
  const label = flowLabel(flow);
  const imageContext = { repository, revision: one(metadataQuery.revision), bundle, flow: label };
  return documentMetadata(`${label} · ${repository} · Unbound Map`, `Review the ${label} graph-backed path in ${repository}, tied to its validated repository revision.`, imageContext);
}

export default async function FlowPage({ params, searchParams }: { params: Promise<{ flow: string }>; searchParams: SearchParams }) {
  const { flow } = await params;
  const query = await searchParams;
  const bundle = one(query.bundle);
  if (!bundle) notFound();
  const context: SharedSnapshotContext = { repository: one(query.repository), revision: one(query.revision), bundle, flow, step: one(query.step), branch: one(query.branch) };
  const snapshot = snapshotWithContext(emptySnapshot, context);
  return <DocsShell active="/flows" snapshot={snapshot} context={context}><div className="doc-page flows-page"><PageIntro title="Architectural path" snapshot={snapshot}>Read this graph-backed path one source-linked handoff at a time.</PageIntro><HostedFlowGuide bundleId={bundle} context={context} initialFlow={flow} initialStep={one(query.step)} route={`/flows/${encodeURIComponent(flow)}`} /><EvidenceNote>Graph-backed paths are static call-path projections selected for comprehension. They do not prove one observed runtime execution or a security finding.</EvidenceNote></div></DocsShell>;
}
