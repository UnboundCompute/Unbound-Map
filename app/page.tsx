import Link from 'next/link';
import type { Metadata } from 'next';
import { DocsShell, EvidenceNote, PageIntro } from './components/DocsShell';
import { MapClient } from './components/MapClient';
import { illustrativeSnapshot, snapshotWithContext, type SharedSnapshotContext } from '../lib/view-model';
import { documentMetadata } from '../lib/seo';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const query = await searchParams;
  const repository = one(query.repository);
  const label = repository ?? illustrativeSnapshot.repository;
  return documentMetadata(`${label} · Design Map`, `See ${label}'s structure, responsibilities, and first architectural path before reading the source.`, { repository, revision: one(query.revision), bundle: one(query.bundle) });
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const context: SharedSnapshotContext = { repository: one(query.repository), revision: one(query.revision), bundle: one(query.bundle) };
  const snapshot = snapshotWithContext(illustrativeSnapshot, context);
  const bundleRequested = Boolean(context.bundle);
  const contextQuery = new URLSearchParams({ ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}) }).toString();
  const contextual = (href: string) => `${href}${contextQuery ? `?${contextQuery}` : ''}`;
  const architectureHref = (region?: string) => {
    const params = new URLSearchParams({ ...(region ? { region, level: '1' } : {}), ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}) });
    return `/architecture${params.size ? `?${params.toString()}` : ''}`;
  };

  return <DocsShell active="/" snapshot={snapshot} context={context}>
    <div className="doc-page start-page">
      {bundleRequested ? <>
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
      </> : <>
        <PageIntro title={`${snapshot.repository}, before the source.`} snapshot={snapshot}>
          {snapshot.repository} turns network traffic into protocol state, detection, and alerts. This guide gives you the design-level orientation first.
        </PageIntro>

        <section className="start-actions" aria-labelledby="start-actions-title">
          <div>
            <h2 id="start-actions-title">Follow one packet first.</h2>
          </div>
          <div className="start-action-links">
            <Link className="primary-button" href={contextual('/flows/packet-decode')}>Follow a packet <span aria-hidden="true">→</span></Link>
            <Link className="start-action-secondary" href={architectureHref()}>Open Architecture <span aria-hidden="true">→</span></Link>
          </div>
        </section>

        <section className="start-map-preview" aria-labelledby="preview-title">
          <div className="section-heading-row">
            <div>
              <h2 id="preview-title">Repository shape</h2>
              <p>Select a region for its architecture chapter.</p>
            </div>
          </div>
          <MapClient compact regionIds={['input', 'decode', 'core', 'protocols', 'detect', 'matcher', 'output', 'boot']} route="/architecture" initialRegion="decode" initialQuery={contextQuery ? `?${contextQuery}` : ''} />
          <div className="start-path-reading">
            <h3>Ordered reading path</h3>
            <p>For a linear introduction, follow these same handoffs from the wire to output.</p>
            <nav className="macro-path" aria-label="Network input to output architecture path">
              {[
                ['wire', 'input'],
                ['decode', 'decode'],
                ['flow + stream', 'core'],
                ['protocols', 'protocols'],
                ['detect', 'detect'],
                ['output', 'output'],
              ].map(([label, region], index) => <Link key={label} href={architectureHref(region)} className={index === 4 ? 'path-emphasis' : ''}>{label}</Link>)}
            </nav>
          </div>
          <p className="map-caption">Detection is intentionally wider: protocol-aware rules, prefilters, and matchers meet the normalized stream here.</p>
        </section>

        <EvidenceNote>Illustrative prototype: repository facts and {snapshot.repository} wording here are a content fixture until a graph-backed snapshot is connected. Structural claims should carry the loaded revision and coverage when published.</EvidenceNote>
      </>}
    </div>
  </DocsShell>;
}
