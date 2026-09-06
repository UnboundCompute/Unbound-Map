import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DocsShell, EvidenceNote, PageIntro } from '../../../components/DocsShell';
import { HostedTrustGlossary } from '../../../components/HostedTrustGlossary';
import { loadHostedBundle } from '../../../../lib/hosted';
import { isLachesisBundle, projectTopLevelRegions, toDesignMapSnapshot } from '../../../../lib/design-map';
import { documentMetadata } from '../../../../lib/seo';
import { emptySnapshot, snapshotFromProjection, snapshotWithContext, type RepositorySnapshotView, type SharedSnapshotContext } from '../../../../lib/view-model';

export const dynamic = 'force-dynamic';

type Params = Promise<{ bundle: string; finding: string }>;

function validBundleId(value: string) { return /^b_[A-Za-z0-9_-]{8,128}$/.test(value); }
function findingLabel(value: string) { return decodeURIComponent(value).replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Security witness'; }

async function bundleIdentity(bundle: string) {
  if (!process.env.NEXT_PUBLIC_BUNDLE_API_URL?.trim()) return {};
  try {
    const value = await loadHostedBundle(bundle);
    if (isLachesisBundle(value)) return { repository: value.meta.repository, revision: value.meta.revision };
  } catch {
    // HostedTrustGlossary owns the recoverable client loading state.
  }
  return {};
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { bundle, finding } = await params;
  const label = findingLabel(finding);
  const identity = await bundleIdentity(bundle);
  return documentMetadata(`${label} · Security Witness · Unbound Map`, `Read a revision-pinned graph evidence witness for ${identity.repository ?? 'this repository snapshot'}.`, { ...identity, bundle });
}

export default async function WitnessPage({ params }: { params: Params }) {
  const { bundle, finding } = await params;
  if (!validBundleId(bundle) || !finding.trim()) notFound();
  let initialSnapshot: RepositorySnapshotView | undefined;
  if (process.env.NEXT_PUBLIC_BUNDLE_API_URL?.trim()) {
    try {
      const value = await loadHostedBundle(bundle);
      if (isLachesisBundle(value)) {
        const projection = toDesignMapSnapshot(value);
        initialSnapshot = snapshotFromProjection(projection, projectTopLevelRegions(projection));
      }
    } catch {
      // The browser loader preserves a useful recovery state when the bundle is unavailable.
    }
  }
  const context: SharedSnapshotContext = { repository: initialSnapshot?.repository, revision: initialSnapshot?.revision, bundle, domain: decodeURIComponent(finding) };
  const snapshot = snapshotWithContext(initialSnapshot ?? emptySnapshot, context);
  const route = `/w/${encodeURIComponent(bundle)}/${encodeURIComponent(finding)}`;
  return <DocsShell active="/trust" snapshot={snapshot} context={context}><div className="doc-page trust-page"><PageIntro eyebrow="Immutable security witness" title="A graph witness worth reading." snapshot={snapshot}>This artifact is pinned to the bundle and finding ID in its URL. It preserves the exported evidence boundary without turning a lead into a vulnerability verdict.</PageIntro><HostedTrustGlossary bundleId={bundle} context={context} initialQuery={decodeURIComponent(finding)} route={route} /><EvidenceNote>This is a graph-backed security witness. It preserves the repository, revision, and exported status; exact guard interpretation and exploitability still require source-level investigation in Lachesis.</EvidenceNote></div></DocsShell>;
}
