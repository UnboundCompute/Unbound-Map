import Link from 'next/link';
import type { Metadata } from 'next';
import { DocsShell, EvidenceNote, PageIntro } from '../components/DocsShell';
import { MapClient } from '../components/MapClient';
import { EmbedSnippet } from '../components/EmbedSnippet';
import { loadHostedBundle } from '../../lib/hosted';
import { isLachesisBundle, projectTopLevelRegions, toDesignMapSnapshot } from '../../lib/design-map';
import { emptySnapshot, snapshotFromProjection, snapshotWithContext, type RepositorySnapshotView, type SharedSnapshotContext } from '../../lib/view-model';
import { documentMetadata } from '../../lib/seo';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const query = await searchParams;
  const repository = one(query.repository);
  const label = repository ?? 'Repository';
  return documentMetadata(`${label} architecture · Unbound Map`, `Explore ${label}'s bounded responsibilities, relationships, and region chapters before opening the source.`, { repository, revision: one(query.revision), bundle: one(query.bundle) });
}

export default async function ArchitecturePage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const context: SharedSnapshotContext = { repository: one(query.repository), revision: one(query.revision), bundle: one(query.bundle), region: one(query.region), anchor: one(query.anchor) };
  const snapshot = snapshotWithContext(emptySnapshot, context);
  const contextQuery = new URLSearchParams({ ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}) }).toString();
  const initialQuery = new URLSearchParams({ ...(contextQuery ? Object.fromEntries(new URLSearchParams(contextQuery).entries()) : {}), ...(one(query.region) ? { region: one(query.region)! } : {}), ...(one(query.level) ? { level: one(query.level)! } : {}), ...(one(query.anchor) ? { anchor: one(query.anchor)! } : {}) }).toString();
  const initialLevel = one(query.level) === '1' || one(query.level) === '2' ? one(query.level)! : '0';
  if (!context.bundle) {
    return <DocsShell active="/architecture" snapshot={snapshot} context={context}><div className="doc-page architecture-page"><PageIntro title="Choose a repository first." snapshot={snapshot}>The architecture map is generated from a validated graph snapshot. Select or build a repository to load its bounded responsibilities and region chapters.</PageIntro><section className="map-state-panel" role="status" aria-live="polite" aria-atomic="true"><span className="map-state-label">No repository selected</span><h2>Open a repository to load its map.</h2><p>Unbound Map does not show placeholder architecture. Pick a cached repository or add a public repository URL to begin.</p><Link className="primary-button" href="/">Choose a repository <span aria-hidden="true">→</span></Link></section></div></DocsShell>;
  }
  let initialSnapshot: RepositorySnapshotView | undefined;
  // Server-render only when an explicit hosted API is configured. Local builds
  // stay offline and retain the browser loader as the fallback path.
  if (process.env.NEXT_PUBLIC_BUNDLE_API_URL?.trim()) {
    try {
      const bundle = await loadHostedBundle(context.bundle);
      if (isLachesisBundle(bundle)) {
        const projection = toDesignMapSnapshot(bundle);
        initialSnapshot = snapshotFromProjection(projection, projectTopLevelRegions(projection));
      }
    } catch {
      // The client still owns the recoverable loading/error state.
    }
  }
  const architectureLede = `The first map is deliberately bounded. It shows the responsibilities represented in ${snapshot.repository}'s validated graph projection, then lets you focus one region at a time.`;
  return <DocsShell active="/architecture" snapshot={snapshot} context={context}><div className="doc-page architecture-page"><PageIntro title="What are the major responsibilities?" snapshot={snapshot}>{architectureLede}</PageIntro><MapClient initialBundle={context.bundle} initialSnapshot={initialSnapshot} initialLevel={initialLevel} initialRegion={one(query.region) ?? ''} initialQuery={initialQuery ? `?${initialQuery}` : ''} /><EmbedSnippet context={context} /><section className="architecture-next"><h2>Map before source.</h2><p>Placement is a reading aid. Labels, counts, and anchors come from the loaded graph snapshot; exact symbol behavior belongs in Lachesis.</p><Link className="quiet-link" href={`/explore?${contextQuery}`}>Continue to Lachesis with this snapshot <span aria-hidden="true">↗</span></Link></section><EvidenceNote>A graph-backed bundle was requested. The map stays hidden until validation succeeds; regions, counts, relationships, and coverage come from that snapshot.</EvidenceNote></div></DocsShell>;
}
