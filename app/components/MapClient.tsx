'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { loadHostedBundle } from '../../lib/hosted';
import { isLachesisBundle, projectTopLevelRegions, toDesignMapSnapshot } from '../../lib/design-map';
import { illustrativeSnapshot, snapshotFromProjection, snapshotWithContext, toHandoff, type RepositorySnapshotView, type SystemRegion } from '../../lib/view-model';

type Position = { x: number; y: number; tone: 'gold' | 'blue' | 'violet' | 'green' };
function normalizeLevel(value: string | null | undefined) { return value === '1' || value === '2' ? value : '0'; }
const positions: Position[] = [
  { x: 16, y: 74, tone: 'gold' }, { x: 40, y: 74, tone: 'gold' }, { x: 64, y: 74, tone: 'blue' },
  { x: 88, y: 74, tone: 'violet' }, { x: 64, y: 44, tone: 'gold' }, { x: 64, y: 17, tone: 'blue' },
  { x: 88, y: 44, tone: 'green' }, { x: 40, y: 17, tone: 'violet' }, { x: 88, y: 17, tone: 'green' },
];

function handoffHref(snapshot: RepositorySnapshotView, region: SystemRegion, anchor = region.anchor?.label ?? region.label, bundleId?: string) {
  const handoff = toHandoff(snapshot, region, anchor, bundleId);
  return `/explore?${new URLSearchParams({ repository: handoff.repository, revision: handoff.revision, region: handoff.regionId, label: handoff.regionLabel, anchor: handoff.anchor, ...(handoff.bundleId ? { bundle: handoff.bundleId } : {}) }).toString()}`;
}

export function MapClient({ route = '/architecture', initialBundle, initialLevel = '0', initialRegion = 'decode', initialQuery = '', compact = false }: { route?: string; initialBundle?: string; initialLevel?: string; initialRegion?: string; initialQuery?: string; compact?: boolean }) {
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState(initialRegion);
  const [level, setLevel] = useState(initialLevel);
  const [snapshot, setSnapshot] = useState<RepositorySnapshotView>(illustrativeSnapshot);
  const [bundleState, setBundleState] = useState<'idle' | 'loading' | 'ready' | 'error'>(initialBundle ? 'loading' : 'idle');
  const [bundleMessage, setBundleMessage] = useState('');
  const [requestedBundle, setRequestedBundle] = useState(initialBundle ?? '');
  const bundleFromUrl = searchParams.has('bundle') ? (searchParams.get('bundle') ?? undefined) : (typeof window === 'undefined' ? initialBundle : undefined);

  useEffect(() => {
    setSelected(searchParams.get('region') ?? 'decode');
    setLevel(normalizeLevel(searchParams.get('level')));
  }, [searchParams]);

  useEffect(() => {
    const publishSnapshot = (next: RepositorySnapshotView) => window.dispatchEvent(new CustomEvent('design-map:snapshot-ready', { detail: { provenance: next.provenance, coverageState: next.coverageState, limitations: next.limitations, regionCount: next.regions.length, repository: next.repository, revision: next.revision, generatedAt: next.generatedAt, coverageScope: next.coverageScope, indexedNodes: next.indexedNodes } }));
    const restoreFocus = () => {
      const next = new URLSearchParams(window.location.search);
      setSelected(next.get('region') ?? 'decode');
      setLevel(normalizeLevel(next.get('level')));
    };
    window.addEventListener('popstate', restoreFocus);
    if (!bundleFromUrl) {
      setRequestedBundle('');
      setBundleState('idle');
      setSnapshot(illustrativeSnapshot);
      publishSnapshot(illustrativeSnapshot);
      return () => window.removeEventListener('popstate', restoreFocus);
    }
    setRequestedBundle(bundleFromUrl);
    const pendingSnapshot = snapshotWithContext(illustrativeSnapshot, { repository: searchParams.get('repository') ?? undefined, revision: searchParams.get('revision') ?? undefined, bundle: bundleFromUrl });
    setSnapshot(pendingSnapshot);
    publishSnapshot(pendingSnapshot);
    const controller = new AbortController();
    setBundleState('loading');
    loadHostedBundle(bundleFromUrl, controller.signal).then((bundle) => {
      if (!isLachesisBundle(bundle)) throw new Error('This hosted map is malformed. Ask for a fresh bundle link from the repository owner.');
      const raw = toDesignMapSnapshot(bundle);
      const next = snapshotFromProjection(raw, projectTopLevelRegions(raw, 9));
      setSnapshot(next);
      publishSnapshot(next);
      setSelected((current) => next.regions.some((region) => region.id === current) ? current : next.regions[0]?.id ?? '');
      setBundleState('ready');
    }).catch((error) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setBundleState('error');
      setBundleMessage(error instanceof Error ? error.message : 'This bundle could not be loaded.');
    });
    return () => { controller.abort(); window.removeEventListener('popstate', restoreFocus); };
  }, [bundleFromUrl]);

  const allRegions = snapshot.regions;
  const regions = useMemo(() => allRegions.slice(0, 9), [allRegions]);
  const current = allRegions.find((region) => region.id === selected) ?? regions[0];
  const startParams = new URLSearchParams(typeof window === 'undefined' ? initialQuery : window.location.search);
  const startContext = new URLSearchParams();
  ['repository', 'revision', 'bundle'].forEach((key) => { const value = startParams.get(key); if (value) startContext.set(key, value); });
  const startHref = `/${startContext.toString() ? `?${startContext.toString()}` : ''}`;
  const recoveryHref = `/explore?${new URLSearchParams({ repository: startParams.get('repository') ?? snapshot.repository, revision: startParams.get('revision') ?? snapshot.revision, ...(requestedBundle ? { bundle: requestedBundle } : {}) }).toString()}`;
  if (requestedBundle && bundleState !== 'ready') {
    return <section className="map-state-panel" role={bundleState === 'error' ? 'alert' : 'status'} aria-live="polite" aria-atomic="true"><span className="map-state-label">{bundleState === 'loading' ? 'Loading graph snapshot' : 'Graph snapshot unavailable'}</span><h2>{bundleState === 'loading' ? 'Preparing the architecture map…' : 'This snapshot could not be loaded.'}</h2><p>{bundleState === 'loading' ? 'The hosted bundle is being validated. The illustrative map stays hidden until that result is known.' : bundleMessage}</p>{bundleState === 'error' && <div className="map-state-actions"><button type="button" className="quiet-link map-retry" onClick={() => window.location.reload()}>Try loading this snapshot again <span aria-hidden="true">↻</span></button><Link className="quiet-link" href={startHref}>Return to Start here <span aria-hidden="true">→</span></Link><Link className="quiet-link" href={recoveryHref}>Open Lachesis context <span aria-hidden="true">↗</span></Link></div>}</section>;
  }
  if (!current) {
    return <section className="map-state-panel" role="status" aria-live="polite" aria-atomic="true"><span className="map-state-label">No regions in snapshot</span><h2>There is no architecture to draw yet.</h2><p>This snapshot is valid but contains no displayable top-level regions. Return to the repository start page or open the source explorer for coverage details.</p><div className="map-state-actions"><Link className="quiet-link" href={startHref}>Return to Start here <span aria-hidden="true">→</span></Link><Link className="quiet-link" href={recoveryHref}>Open Lachesis context <span aria-hidden="true">↗</span></Link></div></section>;
  }
  const positionFor = (index: number) => positions[index] ?? { x: 12 + (index % 5) * 18, y: 25 + Math.floor(index / 5) * 48, tone: 'blue' as const };
  const renderParams = new URLSearchParams(typeof window === 'undefined' ? initialQuery : window.location.search);
  const requestedRegion = renderParams.get('region');
  const regionIsUnknown = Boolean(requestedRegion && !allRegions.some((region) => region.id === requestedRegion));
  const activeBundle = renderParams.has('bundle') ? (renderParams.get('bundle') ?? undefined) : (typeof window === 'undefined' ? initialBundle : undefined);
  const linkSnapshot: RepositorySnapshotView = { ...snapshot, repository: renderParams.get('repository') ?? snapshot.repository, revision: renderParams.get('revision') ?? snapshot.revision };
  const systemShapeParams = new URLSearchParams(renderParams);
  systemShapeParams.delete('region');
  systemShapeParams.delete('anchor');
  systemShapeParams.set('level', '0');
  const systemShapeHref = `${route}?${systemShapeParams.toString()}`;
  const regionFocusParams = new URLSearchParams(renderParams);
  regionFocusParams.delete('anchor');
  regionFocusParams.set('region', current.id);
  regionFocusParams.set('level', '1');
  const regionFocusHref = `${route}?${regionFocusParams.toString()}`;
  const designAnchorParams = new URLSearchParams(renderParams);
  designAnchorParams.set('region', current.id);
  designAnchorParams.set('level', '2');
  const designAnchorHref = `${route}?${designAnchorParams.toString()}`;
  const childDesignAnchorHref = (anchor?: string) => {
    const params = new URLSearchParams(designAnchorParams);
    if (anchor) params.set('anchor', anchor);
    else params.delete('anchor');
    return `${route}?${params.toString()}`;
  };
  const regionPath = (regionId: string) => encodeURIComponent(regionId);
  const selectRegion = (region: SystemRegion) => {
    const params = new URLSearchParams(window.location.search);
    params.set('region', region.id);
    params.set('level', '1');
    params.delete('anchor');
    if (window.matchMedia('(max-width: 820px)').matches) {
      const mobileDestination = route === '/architecture' ? `/architecture/${regionPath(region.id)}?${params.toString()}` : `${route}?${params.toString()}`;
      window.location.assign(mobileDestination);
      return;
    }
    setSelected(region.id);
    setLevel('1');
    window.history.pushState(null, '', `${route}?${params.toString()}`);
  };
  const regionPosition = new Map(regions.map((region, index) => [region.id, positionFor(index)]));
  const allEdges = regions.flatMap((region) => (region.downstream ?? []).map((target) => ({ from: region.id, to: target }))).filter((edge) => regionPosition.has(edge.from) && regionPosition.has(edge.to));
  const edges = allEdges.slice(0, 12);
  const requestedAnchor = renderParams.get('anchor');
  const focusAnchors = [
    ...(current.anchor ? [{ label: current.anchor.label, detail: `${current.anchor.file}:${current.anchor.line}`, summary: 'Primary design anchor for this region.', anchor: current.anchor.label }] : []),
    ...(current.children ?? []).filter((child) => child.anchor).map((child) => ({ label: child.label, detail: child.anchor!, summary: child.summary, anchor: child.anchor! })),
  ].sort((a, b) => Number(b.anchor === requestedAnchor) - Number(a.anchor === requestedAnchor)).slice(0, 12);
  const anchorIsUnknown = Boolean(level === '2' && requestedAnchor && !focusAnchors.some((anchor) => anchor.anchor === requestedAnchor));
  const relationshipEvidence = [...Object.entries(current.relationshipKinds ?? {}).map(([id, kind]) => `${kind} → ${allRegions.find((region) => region.id === id)?.label ?? id}`), ...Object.entries(current.incomingRelationshipKinds ?? {}).map(([id, kind]) => `${kind} ← ${allRegions.find((region) => region.id === id)?.label ?? id}`)];

  return <>
    <section className={`map-workbench${compact ? ' is-compact' : ''}`} aria-labelledby="architecture-map-title">
      <h2 id="architecture-map-title" className="sr-only">Architecture map</h2>
      <div className="map-bezel">
        <div className="map-toolbar"><span className="map-status" role="status" aria-live="polite" aria-atomic="true"><i aria-hidden="true" /> level {level} · {level === '0' ? 'system shape' : level === '1' ? 'region focus' : 'design anchors'}</span><span className="map-scale">{snapshot.provenance === 'illustrative' ? 'illustrative' : 'graph-backed'} · {level === '0' ? `${regions.length} regions placed` : level === '1' ? '1 region focused' : `${focusAnchors.length} anchors shown`} {level === '2' ? <Link className="map-level-reset" href={regionFocusHref}>Back to region focus</Link> : level === '1' ? <Link className="map-level-reset" href={systemShapeHref}>Back to system shape</Link> : null}</span></div>
        {bundleState === 'ready' && <div className="map-banner" role="status">Graph-backed snapshot loaded. Placement is a bounded reading projection.</div>}
        {regionIsUnknown && <div className="map-banner map-banner-caution" role="status">The requested region is not present in this projection. Showing the system’s first available region; open the matching snapshot or region chapter for its evidence.</div>}
        {anchorIsUnknown && <div className="map-banner map-banner-caution" role="status">The requested anchor is not present in this region projection. Showing the available design anchors instead.</div>}
        {allEdges.length > edges.length && <div className="map-banner map-banner-caution" role="status">This canvas shows the first 12 deterministic connections.{compact ? ' Open the full guide for the complete relationship list.' : ' The ordered text summary below retains the full relationship list.'}</div>}
        {snapshot.provenance === 'graph-backed' && !edges.length && <div className="map-banner map-banner-caution" role="status">Relationship evidence is not present in this bundle, so connections are intentionally not inferred.</div>}
        <div className="map-canvas" aria-label={`${linkSnapshot.repository} architecture map`}>
          <div className="map-grid" aria-hidden="true" />
          <svg className="map-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="map-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#637669" /></marker></defs>{edges.map((edge) => { const from = regionPosition.get(edge.from)!; const to = regionPosition.get(edge.to)!; return <line key={`${edge.from}-${edge.to}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} markerEnd="url(#map-arrow)" />; })}</svg>
          {level === '0' ? regions.map((region, index) => { const position = positionFor(index); return <button type="button" key={region.id} className={`map-node node-${position.tone} ${current.id === region.id ? 'is-selected' : ''}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} onClick={() => selectRegion(region)} aria-pressed={current.id === region.id} aria-controls={compact ? undefined : 'architecture-map-detail'}><span className="node-dot" /><strong>{region.label}</strong><small>{region.metricLabel}</small></button>; }) : <div className="map-focus-content"><span className="map-focus-label">{level === '2' ? `Design anchors · ${current.label}` : `Region focus · ${current.label}`}</span>{level === '2' ? <>{focusAnchors.length ? <ol>{focusAnchors.map((anchor, index) => <li key={`${anchor.label}-${anchor.detail}`} className={requestedAnchor === anchor.anchor ? 'is-focused' : undefined} aria-current={requestedAnchor === anchor.anchor ? 'true' : undefined}><span>{String(index + 1).padStart(2, '0')}</span><strong>{anchor.label}</strong><small>{anchor.summary} <code>{anchor.detail}</code></small><Link className="map-focus-link" href={handoffHref(linkSnapshot, current, anchor.anchor, activeBundle)}>Open in Lachesis <span aria-hidden="true">↗</span></Link></li>)}</ol> : <p>No design anchors are available in this projection. Open the region chapter for the bounded responsibility and coverage note.</p>}</> : <>{current.children?.length ? <ol>{current.children.slice(0, 12).map((child, index) => <li key={child.label}><span>{String(index + 1).padStart(2, '0')}</span><Link className="map-child-link" href={childDesignAnchorHref(child.anchor)} aria-label={`Open design anchors related to ${child.label}`}>{child.label}</Link><small>{child.summary}</small></li>)}</ol> : <><p>Child projection is not available in this bundle. Open the region chapter for the bounded responsibility and coverage note.</p><Link className="map-focus-link" href={`/architecture/${regionPath(current.id)}?${new URLSearchParams({ level: '1', repository: linkSnapshot.repository, revision: linkSnapshot.revision, ...(activeBundle ? { bundle: activeBundle } : {}) }).toString()}`}>Open region chapter <span aria-hidden="true">→</span></Link></>}{<Link className="map-focus-link" href={designAnchorHref}>Open design anchors <span aria-hidden="true">→</span></Link>}</>}</div>}
          <div className="map-external external-input" aria-hidden="true">wire input</div><div className="map-external external-output" aria-hidden="true">consumers</div><div className="map-axis axis-x" aria-hidden="true">entry <span /> effect</div><div className="map-axis axis-y" aria-hidden="true">runtime spine</div>
        </div>
      </div>
      {!compact && <aside className="map-inspector" id="architecture-map-detail" aria-live="polite" aria-label="Selected region details"><div className="inspector-label">Selected region</div><h2>{current.label}</h2><p>{current.summary}</p><dl className="inspector-facts"><div><dt>footprint</dt><dd>{current.metricLabel}</dd></div><div><dt>path</dt><dd><code>{current.path}</code></dd></div><div><dt>anchor</dt><dd><code>{current.anchor?.label ?? 'No anchor in this projection'}</code></dd></div><div><dt>receives from</dt><dd>{current.upstream?.length ? current.upstream.map((id) => allRegions.find((region) => region.id === id)?.label ?? id).join(', ') : snapshot.provenance === 'graph-backed' ? 'Relationship evidence unavailable' : 'No upstream region listed'}</dd></div><div><dt>hands off to</dt><dd>{current.downstream?.length ? current.downstream.map((id) => allRegions.find((region) => region.id === id)?.label ?? id).join(', ') : snapshot.provenance === 'graph-backed' ? 'Relationship evidence unavailable' : 'No downstream region listed'}</dd></div></dl><Link className="inspector-link" href={`/architecture/${regionPath(current.id)}?${new URLSearchParams({ level: '1', repository: linkSnapshot.repository, revision: linkSnapshot.revision, ...(activeBundle ? { bundle: activeBundle } : {}) }).toString()}`}>Read this region <span aria-hidden="true">→</span></Link><Link className="inspector-link" href={handoffHref(linkSnapshot, current, current.anchor?.label, activeBundle)}>Open anchor in Lachesis <span aria-hidden="true">↗</span></Link></aside>}
    </section>
    {!compact && <>{relationshipEvidence.length > 0 && <p className="relationship-kinds-note">Relationship evidence: {relationshipEvidence.join('; ')}.</p>}<details className="relationship-summary"><summary>The projection, in words</summary><div className="relationship-summary-content"><p>Use this ordered summary if you prefer reading relationships to navigating a diagram. It includes bounded regions that may sit outside the placed canvas.</p><ol>{allRegions.map((region) => <li key={region.id}><button type="button" onClick={() => selectRegion(region)} aria-pressed={current.id === region.id} aria-controls="architecture-map-detail"><span>{region.label}</span><small>{region.downstream?.length ? `hands off to ${region.downstream.map((id) => allRegions.find((item) => item.id === id)?.label ?? id).join(', ')}` : snapshot.provenance === 'graph-backed' && !edges.length ? 'relationship evidence unavailable' : region.role === 'boot' ? 'initializes the runtime' : 'ends the displayed path'}</small></button></li>)}</ol></div></details></>}
  </>;
}
