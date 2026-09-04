import Link from 'next/link';
import type { Metadata } from 'next';
import { DocsShell, EvidenceNote, PageIntro } from '../../components/DocsShell';
import { illustrativeSnapshot, snapshotWithContext, type SharedSnapshotContext } from '../../../lib/view-model';

export function generateStaticParams() { return illustrativeSnapshot.regions.map((region) => ({ region: region.id })); }

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export async function generateMetadata({ params, searchParams }: { params: Promise<{ region: string }>; searchParams: SearchParams }): Promise<Metadata> {
  const { region: regionId } = await params;
  const repository = one((await searchParams).repository);
  const region = illustrativeSnapshot.regions.find((item) => item.id === regionId);
  const label = repository ?? illustrativeSnapshot.repository;
  return region ? { title: `${region.label} · ${label} architecture`, description: `${region.summary} Read the ${region.label} chapter in Design Map before opening the source.` } : { title: `Architecture region · ${label}` };
}

export default async function RegionPage({ params, searchParams }: { params: Promise<{ region: string }>; searchParams: SearchParams }) {
  const { region: regionId } = await params;
  const query = await searchParams;
  const context: SharedSnapshotContext = { bundle: one(query.bundle), repository: one(query.repository), revision: one(query.revision) };
  const snapshot = snapshotWithContext(illustrativeSnapshot, context);
  const contextQuery = new URLSearchParams({ ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}) }).toString();
  const region = illustrativeSnapshot.regions.find((item) => item.id === regionId);
  if (!region) return <DocsShell active="/architecture" snapshot={snapshot} context={context}><div className="doc-page region-page"><Link className="back-link" href={`/architecture${contextQuery ? `?${contextQuery}` : ''}`}>← Architecture</Link><PageIntro title={regionId} snapshot={snapshot}>This region is not present in the illustrative index. It may belong to a different graph-backed snapshot or an expired link.</PageIntro><section className="map-state-panel"><span className="map-state-label">Region context unavailable</span><h2>Open the snapshot that contains this region.</h2><p>The chapter cannot invent responsibility, neighbors, or anchors without the matching repository revision. Return to the map or continue into Lachesis with the context you already have.</p><Link className="primary-button" href={`/explore?${new URLSearchParams({ region: regionId, ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}) }).toString()}`}>Continue to Lachesis <span aria-hidden="true">↗</span></Link></section><EvidenceNote>Unknown regions are kept as recoverable links rather than treated as verified architecture facts.</EvidenceNote></div></DocsShell>;
  const neighbors = [...(region.upstream ?? []), ...(region.downstream ?? [])].map((id) => illustrativeSnapshot.regions.find((item) => item.id === id)).filter(Boolean);
  return <DocsShell active="/architecture" snapshot={snapshot} context={context}><div className="doc-page region-page"><Link className="back-link" href={`/architecture${contextQuery ? `?${contextQuery}` : ''}`}>← Architecture</Link><PageIntro title={region.label} snapshot={snapshot}>{region.summary} This chapter keeps the design-level responsibility in view before you open the implementation.</PageIntro><div className="region-meta"><div><span>Footprint</span><strong>{region.metricLabel}</strong></div><div><span>Repository path</span><code>{region.path}</code></div><div><span>Role</span><strong>{region.role ?? 'runtime region'}</strong></div></div><section className="region-section"><h2>What this region owns</h2><p>{region.summary}</p>{region.children && <ul className="region-children">{region.children.map((child) => <li key={child.label}><strong>{child.label}</strong><span>{child.summary}</span>{child.anchor && <code>{child.anchor}</code>}</li>)}</ul>}</section><section className="region-section"><h2>How it connects</h2>{neighbors.length ? <ul className="neighbor-list">{neighbors.map((neighbor) => <li key={neighbor!.id}><Link href={`/architecture/${neighbor!.id}${contextQuery ? `?${contextQuery}` : ''}`}><span>{neighbor!.label}</span><small>{region.downstream?.includes(neighbor!.id) ? 'downstream' : 'upstream'} →</small></Link></li>)}</ul> : <p>This projection has no neighboring region metadata at this level.</p>}</section><section className="region-section"><h2>Open the anchor</h2><p>{region.anchor ? <><code>{region.anchor.label}</code> lives at <code>{region.anchor.file}:{region.anchor.line}</code>. Lachesis can show its callers, callees, and exact source context.</> : 'This region has no anchor in the current projection.'}</p><Link className="primary-button" href={`/explore?${new URLSearchParams({ repository: snapshot.repository, revision: snapshot.revision, region: region.id, label: region.label, anchor: region.anchor?.label ?? region.label, ...(context.bundle ? { bundle: context.bundle } : {}) }).toString()}`}>Prepare Lachesis handoff <span aria-hidden="true">↗</span></Link></section><EvidenceNote>This region chapter is illustrative prototype content. Placement and descriptions should be regenerated from the selected graph-backed snapshot.</EvidenceNote></div></DocsShell>;
}
