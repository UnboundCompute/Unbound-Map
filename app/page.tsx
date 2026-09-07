import Link from 'next/link';
import type { Metadata } from 'next';
import { DocsShell, EvidenceNote, PageIntro } from './components/DocsShell';
import { MapClient } from './components/MapClient';
import { RepositoryLauncher } from './components/RepositoryLauncher';
import { emptySnapshot, snapshotWithContext, type SharedSnapshotContext } from '../lib/view-model';
import { documentMetadata } from '../lib/seo';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const query = await searchParams;
  const repository = one(query.repository);
  const title = repository ? `${repository} · Unbound Map` : 'Unbound Map — Read this before the source';
  const description = repository
    ? `See ${repository}'s structure, responsibilities, and first architectural path before reading the source.`
    : 'Generate a graph-backed architecture map from any public repository — see its structure, responsibilities, flows, and trust surfaces before reading the source.';
  return documentMetadata(title, description, { repository, revision: one(query.revision), bundle: one(query.bundle) });
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const context: SharedSnapshotContext = { repository: one(query.repository), revision: one(query.revision), bundle: one(query.bundle) };
  const sourceFile = one(query.source_file);
  const sourceLine = one(query.source_line);
  const snapshot = snapshotWithContext(emptySnapshot, context);
  const bundleRequested = Boolean(context.bundle);
  if (!bundleRequested) return <div className="selection-shell"><a className="skip-link" href="#main-content">Skip to repository selection</a><header className="selection-header"><Link href="/" className="wordmark" aria-label="Unbound Map home"><span className="wordmark-mark" aria-hidden="true"><i /><i /><i /></span><span>Unbound Map</span></Link><span>Repository architecture, before the source</span></header><main id="main-content" className="selection-main" tabIndex={-1}><header className="selection-intro"><h1>{context.repository ? 'Continue mapping this repository.' : 'Choose a repository to begin.'}</h1><p>{context.repository ? `The repository context was carried here from another UnboundCompute tool. Confirm the ref, then build a graph-backed map.` : 'Generate a graph-backed map from a public repository, or open one Lachesis has already indexed.'}</p></header><RepositoryLauncher initialRepository={context.repository} initialRef={context.revision} initialSourceFile={sourceFile} initialSourceLine={sourceLine} /></main><footer className="selection-footer">Unbound Map · powered by Lachesis</footer></div>;
  const contextQuery = new URLSearchParams({ ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}) }).toString();
  const architectureHref = (region?: string) => {
    const params = new URLSearchParams({ ...(region ? { region, level: '1' } : {}), ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}) });
    return `/architecture${params.size ? `?${params.toString()}` : ''}`;
  };

  return <DocsShell active="/" snapshot={snapshot} context={context}>
    <div className="doc-page start-page">
      <>
        <PageIntro title={`${snapshot.repository} architecture snapshot`} snapshot={snapshot}>
          Start with the bounded system shape from this repository snapshot. The map appears only after its graph projection passes validation.
        </PageIntro>
        <section className="start-map-preview" aria-labelledby="preview-title">
          <div className="section-heading-row">
            <div>
              <h2 id="preview-title">Repository shape</h2>
              <p>Select a region to carry that context into the complete architecture guide.</p>
            </div>
          </div>
          <MapClient
            compact
            initialBundle={context.bundle}
            initialRegion={context.region}
            initialQuery={contextQuery ? `?${contextQuery}` : ''}
            route="/architecture"
          />
        </section>
        <section className="start-actions" aria-labelledby="start-actions-title">
          <div>
            <h2 id="start-actions-title">Continue with this snapshot.</h2>
          </div>
          <div className="start-action-links">
            <Link className="primary-button" href={architectureHref()}>Explore architecture <span aria-hidden="true">→</span></Link>
            <Link className="start-action-secondary" href={`/explore?${new URLSearchParams({ repository: snapshot.repository, revision: snapshot.revision, bundle: context.bundle! }).toString()}`}>Open in Lachesis <span aria-hidden="true">↗</span></Link>
          </div>
        </section>
        <EvidenceNote>The requested bundle is validated in the browser before any repository regions appear. Placement is an editorial reading projection; labels, counts, relationships, revision, and coverage come from the bundle.</EvidenceNote>
      </>
    </div>
  </DocsShell>;
}
