import Link from 'next/link';
import type { Metadata } from 'next';
import { DocsShell, EvidenceNote, PageIntro } from '../../components/DocsShell';
import { emptySnapshot, snapshotFromProjection, snapshotWithContext, sourceHref, type SharedSnapshotContext } from '../../../lib/view-model';
import { isLachesisBundle, projectTopLevelRegions, toDesignMapSnapshot } from '../../../lib/design-map';
import { loadHostedBundle } from '../../../lib/hosted';
import { documentMetadata } from '../../../lib/seo';

// The region chapter is driven entirely by a request-time bundle query and a
// live graph fetch, so there is nothing to prerender: render it on demand.
export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function regionPath(value: string) { return encodeURIComponent(value); }

export async function generateMetadata({ params, searchParams }: { params: Promise<{ region: string }>; searchParams: SearchParams }): Promise<Metadata> {
  const { region: regionId } = await params;
  const metadataQuery = await searchParams;
  const repository = one(metadataQuery.repository);
  const bundle = one(metadataQuery.bundle);
  const imageContext = { repository, revision: one(metadataQuery.revision), bundle };
  const label = repository ?? 'Repository';
  return documentMetadata(`Architecture region · ${label}`, bundle ? `A graph-backed architecture region for ${label}. Verify the selected snapshot before relying on its claims.` : `Select a repository to open its architecture regions.`, imageContext);
}

export default async function RegionPage({ params, searchParams }: { params: Promise<{ region: string }>; searchParams: SearchParams }) {
  const { region: regionId } = await params;
  const query = await searchParams;
  const context: SharedSnapshotContext = { bundle: one(query.bundle), repository: one(query.repository), revision: one(query.revision), region: regionId, anchor: one(query.anchor) };
  let snapshot = snapshotWithContext(emptySnapshot, context);
  const contextQuery = new URLSearchParams({ ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}) }).toString();
  if (!context.bundle) return <DocsShell active="/architecture" snapshot={snapshot} context={context}><div className="doc-page region-page"><Link className="back-link" href="/architecture">← Architecture</Link><PageIntro title="Choose a repository first." snapshot={snapshot}>Region chapters are generated from a validated graph snapshot.</PageIntro><section className="map-state-panel" role="status" aria-live="polite" aria-atomic="true"><span className="map-state-label">No repository selected</span><h2>Open a repository to load this chapter.</h2><p>Unbound Map does not show placeholder region chapters. Pick an indexed repository or add a public repository URL to begin.</p><Link className="primary-button" href="/">Choose a repository <span aria-hidden="true">→</span></Link></section></div></DocsShell>;
  let bundleError = '';
  try {
    const payload = await loadHostedBundle(context.bundle);
    if (!isLachesisBundle(payload)) throw new Error('This hosted map is malformed. Ask for a fresh bundle link from the repository owner.');
    const designSnapshot = toDesignMapSnapshot(payload);
    snapshot = snapshotFromProjection(designSnapshot, projectTopLevelRegions(designSnapshot));
  } catch (error) {
    bundleError = error instanceof Error ? error.message : 'This hosted map could not be loaded.';
  }
  const region = snapshot.regions.find((item) => item.id === regionId);
  if (bundleError) return <DocsShell active="/architecture" snapshot={snapshot} context={context}><div className="doc-page region-page"><Link className="back-link" href={`/architecture${contextQuery ? `?${contextQuery}` : ''}`}>← Architecture</Link><PageIntro title={regionId} snapshot={snapshot}>The requested graph-backed region could not be opened.</PageIntro><section className="map-state-panel" role="alert" aria-live="polite" aria-atomic="true"><span className="map-state-label">Graph-backed chapter unavailable</span><h2>Keep the verified map context intact.</h2><p>{bundleError} Unbound Map will not substitute a placeholder chapter for this bundle.</p><Link className="primary-button" href={`/architecture${contextQuery ? `?${contextQuery}` : ''}`}>Return to this map <span aria-hidden="true">→</span></Link></section><EvidenceNote>The chapter was not rendered because its graph-backed snapshot could not be verified.</EvidenceNote></div></DocsShell>;
  if (!region) return <DocsShell active="/architecture" snapshot={snapshot} context={context}><div className="doc-page region-page"><Link className="back-link" href={`/architecture${contextQuery ? `?${contextQuery}` : ''}`}>← Architecture</Link><PageIntro title={regionId} snapshot={snapshot}>This region is not present in the current projection. It may belong to a different graph-backed snapshot or an expired link.</PageIntro><section className="map-state-panel" role="status" aria-live="polite" aria-atomic="true"><span className="map-state-label">Region context unavailable</span><h2>Open the snapshot that contains this region.</h2><p>The chapter cannot invent responsibility, neighbors, or anchors without the matching repository revision. Return to the map or continue into Lachesis with the context you already have.</p><Link className="primary-button" href={`/explore?${new URLSearchParams({ region: regionId, ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}) }).toString()}`}>Continue to Lachesis <span aria-hidden="true">↗</span></Link></section><EvidenceNote>Unknown regions are kept as recoverable links rather than treated as verified architecture facts.</EvidenceNote></div></DocsShell>;
  const neighborDirections = new Map<string, string[]>();
  (region.upstream ?? []).forEach((id) => neighborDirections.set(id, [...(neighborDirections.get(id) ?? []), 'upstream']));
  (region.downstream ?? []).forEach((id) => neighborDirections.set(id, [...(neighborDirections.get(id) ?? []), 'downstream']));
  const neighbors = [...neighborDirections.entries()].map(([id, directions]) => ({ region: snapshot.regions.find((item) => item.id === id), direction: directions.join(' + ') })).filter((item) => item.region);
  const pageContext: SharedSnapshotContext = { ...context, label: region.label, anchor: context.anchor ?? region.anchor?.label };
  const chapterBackQuery = new URLSearchParams({ ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}), region: region.id, level: '1' }).toString();
  const detailList = (items: string[] | undefined, empty: string) => items?.length ? <ul className="region-detail-list">{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="region-detail-empty">{empty}</p>;
  const upstreamLabels = (region.upstream ?? []).map((id) => snapshot.regions.find((item) => item.id === id)?.label ?? id);
  const downstreamLabels = (region.downstream ?? []).map((id) => snapshot.regions.find((item) => item.id === id)?.label ?? id);
  const whyExists = upstreamLabels.length || downstreamLabels.length
    ? `It owns one bounded responsibility between ${upstreamLabels.length ? upstreamLabels.join(', ') : 'the repository boundary'} and ${downstreamLabels.length ? downstreamLabels.join(', ') : 'the repository boundary'}. Keeping this handoff distinct makes the next data or state transition legible.`
    : 'It is a bounded responsibility in the repository model. The current projection does not include enough neighboring evidence to claim a more specific system role.';
  const sourceLink = region.anchor ? sourceHref(snapshot, region.anchor.file, region.anchor.line) : undefined;
  return <DocsShell active="/architecture" snapshot={snapshot} context={pageContext}><div className="doc-page region-page"><Link className="back-link" href={`/architecture?${chapterBackQuery}`}>← Architecture</Link><PageIntro title={region.label} snapshot={snapshot}>{region.summary} This chapter keeps the design-level responsibility in view before you open the implementation.</PageIntro><div className="region-meta"><div><span>Footprint</span><strong>{region.metricLabel}</strong></div><div><span>Repository path</span><code>{region.path}</code></div><div><span>Role</span><strong>{region.role ?? 'projected region'}</strong></div></div><section className="region-section"><h2>What this region owns</h2><p>{region.summary}</p>{region.children && <ul className="region-children">{region.children.map((child) => <li key={child.label}><strong>{child.label}</strong><span>{child.summary}</span>{child.anchor && <code>{child.anchor}</code>}</li>)}</ul>}</section><section className="region-section"><h2>Why it exists</h2><p>{whyExists}</p></section><section className="region-section"><h2>How it connects</h2>{neighbors.length ? <ul className="neighbor-list">{neighbors.map((neighbor) => <li key={neighbor.region!.id}><Link href={`/architecture/${regionPath(neighbor.region!.id)}${contextQuery ? `?${contextQuery}` : ''}`}><span>{neighbor.region!.label}</span><small>{neighbor.direction} →</small></Link></li>)}</ul> : <p>This projection has no neighboring region metadata at this level.</p>}</section><section className="region-section"><h2>Inputs and outputs</h2><div className="region-detail-grid"><div><h3>Inputs</h3>{detailList(region.inputs, 'Input metadata is not included in this projection.')}</div><div><h3>Outputs</h3>{detailList(region.outputs, 'Output metadata is not included in this projection.')}</div></div></section><section className="region-section"><h2>Key structures and state</h2>{detailList(region.structures, 'Structure metadata is not included in this projection; continue to Lachesis for exact symbols.')}</section><section className="region-section"><h2>Representative path</h2><p><code>{region.path}</code> is the representative repository path supplied by this snapshot. Exact file-level reading and references belong in Lachesis.</p></section><section className="region-section"><h2>Open the anchor</h2><p>{region.anchor ? <><code>{region.anchor.label}</code> lives at <code>{region.anchor.file}:{region.anchor.line}</code>. Lachesis can show its callers, callees, and exact source context.</> : 'This region has no anchor in the current projection.'}</p>{sourceLink && <a className="quiet-link" href={sourceLink} target="_blank" rel="noreferrer">Read source at {region.anchor!.file}:{region.anchor!.line} <span aria-hidden="true">↗</span></a>}<Link className="primary-button" href={`/explore?${new URLSearchParams({ repository: snapshot.repository, revision: snapshot.revision, region: region.id, label: region.label, anchor: region.anchor?.label ?? region.label, ...(context.bundle ? { bundle: context.bundle } : {}) }).toString()}`}>Prepare Lachesis handoff <span aria-hidden="true">↗</span></Link></section><EvidenceNote>This chapter is generated from the validated Lachesis projection. Descriptions are bounded to the fields present in that snapshot.</EvidenceNote></div></DocsShell>;
}
