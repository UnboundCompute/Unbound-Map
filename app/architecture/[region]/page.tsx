import Link from 'next/link';
import type { Metadata } from 'next';
import { DocsShell, EvidenceNote, PageIntro } from '../../components/DocsShell';
import { illustrativeSnapshot, snapshotFromProjection, snapshotWithContext, type SharedSnapshotContext } from '../../../lib/view-model';
import { isLachesisBundle, projectTopLevelRegions, toDesignMapSnapshot } from '../../../lib/design-map';
import { loadHostedBundle } from '../../../lib/hosted';
import { documentMetadata } from '../../../lib/seo';

export function generateStaticParams() { return illustrativeSnapshot.regions.map((region) => ({ region: region.id })); }

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function regionPath(value: string) { return encodeURIComponent(value); }

export async function generateMetadata({ params, searchParams }: { params: Promise<{ region: string }>; searchParams: SearchParams }): Promise<Metadata> {
  const { region: regionId } = await params;
  const metadataQuery = await searchParams;
  const repository = one(metadataQuery.repository);
  const bundle = one(metadataQuery.bundle);
  const imageContext = { repository, revision: one(metadataQuery.revision), bundle };
  const region = bundle ? undefined : illustrativeSnapshot.regions.find((item) => item.id === regionId);
  const label = repository ?? illustrativeSnapshot.repository;
  return region ? documentMetadata(`${region.label} · ${label} architecture`, `${region.summary} Read the ${region.label} chapter in Design Map before opening the source.`, imageContext) : documentMetadata(`Architecture region · ${label}`, bundle ? `A graph-backed architecture region for ${label}. Verify the selected snapshot before relying on its claims.` : `This architecture region is not present in the current projection. Open the matching snapshot or continue to Lachesis.`, imageContext);
}

export default async function RegionPage({ params, searchParams }: { params: Promise<{ region: string }>; searchParams: SearchParams }) {
  const { region: regionId } = await params;
  const query = await searchParams;
  const context: SharedSnapshotContext = { bundle: one(query.bundle), repository: one(query.repository), revision: one(query.revision), region: regionId, anchor: one(query.anchor) };
  let snapshot = snapshotWithContext(illustrativeSnapshot, context);
  let bundleError = '';
  if (context.bundle) {
    try {
      const payload = await loadHostedBundle(context.bundle);
      if (!isLachesisBundle(payload)) throw new Error('This hosted map is malformed. Ask for a fresh bundle link from the repository owner.');
      const designSnapshot = toDesignMapSnapshot(payload);
      snapshot = snapshotFromProjection(designSnapshot, projectTopLevelRegions(designSnapshot));
    } catch (error) {
      bundleError = error instanceof Error ? error.message : 'This hosted map could not be loaded.';
    }
  }
  const contextQuery = new URLSearchParams({ ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}) }).toString();
  const region = snapshot.regions.find((item) => item.id === regionId);
  if (context.bundle && bundleError) return <DocsShell active="/architecture" snapshot={snapshotWithContext(illustrativeSnapshot, context)} context={context}><div className="doc-page region-page"><Link className="back-link" href={`/architecture${contextQuery ? `?${contextQuery}` : ''}`}>← Architecture</Link><PageIntro title={regionId} snapshot={snapshot}>The requested graph-backed region could not be opened.</PageIntro><section className="map-state-panel" role="alert" aria-live="polite" aria-atomic="true"><span className="map-state-label">Graph-backed chapter unavailable</span><h2>Keep the verified map context intact.</h2><p>{bundleError} Design Map will not substitute an illustrative chapter for this bundle.</p><Link className="primary-button" href={`/architecture${contextQuery ? `?${contextQuery}` : ''}`}>Return to this map <span aria-hidden="true">→</span></Link></section><EvidenceNote>The chapter was not rendered because its graph-backed snapshot could not be verified.</EvidenceNote></div></DocsShell>;
  if (!region) return <DocsShell active="/architecture" snapshot={snapshot} context={context}><div className="doc-page region-page"><Link className="back-link" href={`/architecture${contextQuery ? `?${contextQuery}` : ''}`}>← Architecture</Link><PageIntro title={regionId} snapshot={snapshot}>This region is not present in the current projection. It may belong to a different graph-backed snapshot or an expired link.</PageIntro><section className="map-state-panel" role="status" aria-live="polite" aria-atomic="true"><span className="map-state-label">Region context unavailable</span><h2>Open the snapshot that contains this region.</h2><p>The chapter cannot invent responsibility, neighbors, or anchors without the matching repository revision. Return to the map or continue into Lachesis with the context you already have.</p><Link className="primary-button" href={`/explore?${new URLSearchParams({ region: regionId, ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}) }).toString()}`}>Continue to Lachesis <span aria-hidden="true">↗</span></Link></section><EvidenceNote>Unknown regions are kept as recoverable links rather than treated as verified architecture facts.</EvidenceNote></div></DocsShell>;
  const neighbors = [...(region.upstream ?? []), ...(region.downstream ?? [])].map((id) => snapshot.regions.find((item) => item.id === id)).filter(Boolean);
  const pageContext: SharedSnapshotContext = { ...context, label: region.label, anchor: context.anchor ?? region.anchor?.label };
  const chapterBackQuery = new URLSearchParams({ ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}), region: region.id, level: '1' }).toString();
  const detailList = (items: string[] | undefined, empty: string) => items?.length ? <ul className="region-detail-list">{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="region-detail-empty">{empty}</p>;
  return <DocsShell active="/architecture" snapshot={snapshot} context={pageContext}><div className="doc-page region-page"><Link className="back-link" href={`/architecture?${chapterBackQuery}`}>← Architecture</Link><PageIntro title={region.label} snapshot={snapshot}>{region.summary} This chapter keeps the design-level responsibility in view before you open the implementation.</PageIntro><div className="region-meta"><div><span>Footprint</span><strong>{region.metricLabel}</strong></div><div><span>Repository path</span><code>{region.path}</code></div><div><span>Role</span><strong>{region.role ?? 'runtime region'}</strong></div></div><section className="region-section"><h2>What this region owns</h2><p>{region.summary}</p>{region.children && <ul className="region-children">{region.children.map((child) => <li key={child.label}><strong>{child.label}</strong><span>{child.summary}</span>{child.anchor && <code>{child.anchor}</code>}</li>)}</ul>}</section><section className="region-section"><h2>How it connects</h2>{neighbors.length ? <ul className="neighbor-list">{neighbors.map((neighbor) => <li key={neighbor!.id}><Link href={`/architecture/${regionPath(neighbor!.id)}${contextQuery ? `?${contextQuery}` : ''}`}><span>{neighbor!.label}</span><small>{region.downstream?.includes(neighbor!.id) ? 'downstream' : 'upstream'} →</small></Link></li>)}</ul> : <p>This projection has no neighboring region metadata at this level.</p>}</section><section className="region-section"><h2>Inputs and outputs</h2><div className="region-detail-grid"><div><h3>Inputs</h3>{detailList(region.inputs, 'Input metadata is not included in this projection.')}</div><div><h3>Outputs</h3>{detailList(region.outputs, 'Output metadata is not included in this projection.')}</div></div></section><section className="region-section"><h2>Key structures and state</h2>{detailList(region.structures, 'Structure metadata is not included in this projection; continue to Lachesis for exact symbols.')}</section><section className="region-section"><h2>Open the anchor</h2><p>{region.anchor ? <><code>{region.anchor.label}</code> lives at <code>{region.anchor.file}:{region.anchor.line}</code>. Lachesis can show its callers, callees, and exact source context.</> : 'This region has no anchor in the current projection.'}</p><Link className="primary-button" href={`/explore?${new URLSearchParams({ repository: snapshot.repository, revision: snapshot.revision, region: region.id, label: region.label, anchor: region.anchor?.label ?? region.label, ...(context.bundle ? { bundle: context.bundle } : {}) }).toString()}`}>Prepare Lachesis handoff <span aria-hidden="true">↗</span></Link></section><EvidenceNote>{snapshot.provenance === 'graph-backed' ? 'This chapter is generated from the validated Lachesis projection. Descriptions are bounded to the fields present in that snapshot.' : 'This region chapter is illustrative prototype content. Placement and descriptions should be regenerated from the selected graph-backed snapshot.'}</EvidenceNote></div></DocsShell>;
}
