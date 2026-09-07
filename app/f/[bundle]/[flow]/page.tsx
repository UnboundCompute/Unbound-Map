import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DocsShell, EvidenceNote, PageIntro } from '../../../components/DocsShell';
import { HostedFlowGuide } from '../../../components/HostedFlowGuide';
import { loadHostedBundle } from '../../../../lib/hosted';
import { isLachesisBundle, projectTopLevelRegions, toDesignMapSnapshot } from '../../../../lib/design-map';
import { emptySnapshot, snapshotFromProjection, snapshotWithContext, type RepositorySnapshotView, type SharedSnapshotContext } from '../../../../lib/view-model';
import { documentMetadata } from '../../../../lib/seo';
import { flowCardHref } from '../../../../lib/artifact-id';

export const dynamic = 'force-dynamic';

type Params = Promise<{ bundle: string; flow: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

function validBundleId(value: string) { return /^b_[A-Za-z0-9_-]{8,128}$/.test(value); }

function flowLabel(value: string) {
  return decodeURIComponent(value).replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Selected flow';
}

async function bundleIdentity(bundle: string) {
  if (!process.env.NEXT_PUBLIC_BUNDLE_API_URL?.trim()) return {};
  try {
    const value = await loadHostedBundle(bundle);
    if (isLachesisBundle(value)) return { repository: value.meta.repository, revision: value.meta.revision };
  } catch {
    // The page remains useful as a client-loaded recovery surface.
  }
  return {};
}

export async function generateMetadata({ params }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
  const { bundle, flow } = await params;
  const label = flowLabel(flow);
  const identity = await bundleIdentity(bundle);
  return documentMetadata(`${label} · Bundle-pinned flow card · Unbound Map`, `Read the ${label} graph-backed flow from its bundle-pinned repository snapshot.`, { ...identity, bundle, flow: label, canonicalPath: flowCardHref(bundle, flow) });
}

export default async function FlowCardPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { bundle, flow } = await params;
  if (!validBundleId(bundle)) notFound();
  const query = await searchParams;
  let initialSnapshot: RepositorySnapshotView | undefined;
  // Match the architecture publication path: server-render validated identity
  // when a bundle API is explicitly configured, while local/offline builds keep
  // the browser loader as the fallback and make no network request.
  if (process.env.NEXT_PUBLIC_BUNDLE_API_URL?.trim()) {
    try {
      const value = await loadHostedBundle(bundle);
      if (isLachesisBundle(value)) {
        const projection = toDesignMapSnapshot(value);
        initialSnapshot = snapshotFromProjection(projection, projectTopLevelRegions(projection));
      }
    } catch {
      // HostedFlowGuide owns the recoverable loading/error state in the browser.
    }
  }
  const context: SharedSnapshotContext = { repository: initialSnapshot?.repository, revision: initialSnapshot?.revision, bundle, flow, step: one(query.step) };
  const snapshot = snapshotWithContext(initialSnapshot ?? emptySnapshot, context);
  const route = flowCardHref(bundle, flow);
  return <DocsShell active="/flows" snapshot={snapshot} context={context}><div className="doc-page flows-page"><PageIntro eyebrow="Bundle-pinned flow card" title="A path worth reading." snapshot={snapshot} context={context}>This shareable view is pinned to the bundle in its URL. The repository and revision shown below come from the validated snapshot, not from editable query parameters.</PageIntro><HostedFlowGuide bundleId={bundle} context={context} initialFlow={flow} initialStep={one(query.step)} route={route} /><EvidenceNote>This is a graph-backed comprehension artifact. It preserves the bundle identity and revision, but it does not claim that one runtime request executed every step or that the path is a vulnerability.</EvidenceNote></div></DocsShell>;
}
