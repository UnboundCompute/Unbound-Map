'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { loadHostedBundle } from '../../lib/hosted';
import { isLachesisBundle, projectTopLevelRegions, toDesignMapSnapshot } from '../../lib/design-map';
import { emptySnapshot, snapshotFromProjection, snapshotWithContext, sourceHref, toHandoff, type RepositorySnapshotView, type SystemRegion } from '../../lib/view-model';

type Position = { x: number; y: number; tone: 'gold' | 'blue' | 'violet' | 'green' };
function normalizeLevel(value: string | null | undefined) { return value === '1' || value === '2' ? value : '0'; }
const positions: Position[] = [
  { x: 16, y: 74, tone: 'gold' }, { x: 40, y: 74, tone: 'gold' }, { x: 64, y: 74, tone: 'blue' },
  { x: 88, y: 74, tone: 'violet' }, { x: 64, y: 44, tone: 'gold' }, { x: 64, y: 17, tone: 'blue' },
  { x: 88, y: 44, tone: 'green' }, { x: 40, y: 17, tone: 'violet' }, { x: 88, y: 17, tone: 'green' },
];

type Layout = { positions: Position[]; label: 'pipeline' | 'hub' | 'mesh' };

function mermaidLabel(value: string) {
  return value.replace(/["`\\]/g, '').replace(/[\r\n]+/g, ' ').trim() || 'Unnamed region';
}

function mermaidId(index: number) {
  return `region_${index + 1}`;
}

function layoutFor(regions: SystemRegion[], pairs: Array<{ from: string; to: string }>): Layout {
  const count = regions.length;
  if (count <= 1) return { positions: [{ x: 50, y: 50, tone: 'gold' }], label: 'pipeline' };
  const degree = new Map(regions.map((region) => [region.id, 0]));
  pairs.forEach(({ from, to }) => {
    degree.set(from, (degree.get(from) ?? 0) + 1);
    degree.set(to, (degree.get(to) ?? 0) + 1);
  });
  const maxDegree = Math.max(...degree.values());
  const dense = pairs.length >= count * (count - 1) * 0.35;
  const hub = maxDegree >= Math.max(3, Math.ceil(count * 0.55));
  const toneFor = (index: number): Position['tone'] => ['gold', 'blue', 'violet', 'green'][index % 4] as Position['tone'];
  const ring = (centerIndex?: number): Position[] => regions.map((_, index) => {
    if (centerIndex === index) return { x: 50, y: 50, tone: 'gold' };
    const ringIndex = centerIndex === undefined ? index : index > centerIndex ? index - 1 : index;
    const angle = -Math.PI / 2 + (ringIndex / (centerIndex === undefined ? count : count - 1)) * Math.PI * 2;
    return { x: 50 + Math.cos(angle) * 34, y: 50 + Math.sin(angle) * 34, tone: toneFor(index) };
  });
  if (dense) return { positions: ring(), label: 'mesh' };
  if (hub) {
    const centerIndex = regions.findIndex((region) => degree.get(region.id) === maxDegree);
    return { positions: ring(centerIndex), label: 'hub' };
  }
  return { positions, label: 'pipeline' };
}

function handoffHref(snapshot: RepositorySnapshotView, region: SystemRegion, anchor = region.anchor?.label ?? region.label, bundleId?: string) {
  const handoff = toHandoff(snapshot, region, anchor, bundleId);
  return `/explore?${new URLSearchParams({ repository: handoff.repository, revision: handoff.revision, region: handoff.regionId, label: handoff.regionLabel, anchor: handoff.anchor, ...(handoff.bundleId ? { bundle: handoff.bundleId } : {}) }).toString()}`;
}

export function MapClient({ route = '/architecture', initialBundle, initialLevel = '0', initialRegion = '', initialQuery = '', compact = false, maxRegions = 9, regionIds }: { route?: string; initialBundle?: string; initialLevel?: string; initialRegion?: string; initialQuery?: string; compact?: boolean; maxRegions?: number; regionIds?: string[] }) {
  const searchParams = useSearchParams();
  // Keep the server-provided bundle during the first client render. Next can
  // briefly expose an unhydrated search-param snapshot on a direct shared URL.
  const bundleFromUrl = searchParams.get('bundle') ?? initialBundle;
  const repositoryFromUrl = searchParams.get('repository') ?? undefined;
  const revisionFromUrl = searchParams.get('revision') ?? undefined;
  const [selected, setSelected] = useState(initialRegion);
  const [level, setLevel] = useState(initialLevel);
  const [snapshot, setSnapshot] = useState<RepositorySnapshotView>(snapshotWithContext(emptySnapshot, { repository: repositoryFromUrl, revision: revisionFromUrl, bundle: bundleFromUrl ?? undefined }));
  const [bundleState, setBundleState] = useState<'idle' | 'loading' | 'ready' | 'error'>(initialBundle ? 'loading' : 'idle');
  const [bundleMessage, setBundleMessage] = useState('');
  const [requestedBundle, setRequestedBundle] = useState(initialBundle ?? '');
  const [mermaidState, setMermaidState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    setSelected(searchParams.get('region') ?? '');
    setLevel(normalizeLevel(searchParams.get('level')));
  }, [searchParams]);

  useEffect(() => {
    const publishSnapshot = (next: RepositorySnapshotView) => window.dispatchEvent(new CustomEvent('design-map:snapshot-ready', { detail: { provenance: next.provenance, coverageState: next.coverageState, limitations: next.limitations, regionCount: next.regions.length, repository: next.repository, revision: next.revision, generatedAt: next.generatedAt, coverageScope: next.coverageScope, indexedNodes: next.indexedNodes, includedNodes: next.includedNodes } }));
    const restoreFocus = () => {
      const next = new URLSearchParams(window.location.search);
      setSelected(next.get('region') ?? '');
      setLevel(normalizeLevel(next.get('level')));
    };
    window.addEventListener('popstate', restoreFocus);
    if (!bundleFromUrl) {
      setRequestedBundle('');
      setBundleState('idle');
      setSnapshot(emptySnapshot);
      publishSnapshot(emptySnapshot);
      return () => window.removeEventListener('popstate', restoreFocus);
    }
    setRequestedBundle(bundleFromUrl);
    const pendingSnapshot = snapshotWithContext(emptySnapshot, { repository: repositoryFromUrl, revision: revisionFromUrl, bundle: bundleFromUrl });
    setSnapshot(pendingSnapshot);
    publishSnapshot(pendingSnapshot);
    const controller = new AbortController();
    setBundleState('loading');
    loadHostedBundle(bundleFromUrl, controller.signal).then((bundle) => {
      if (!isLachesisBundle(bundle)) throw new Error('This hosted map is malformed. Ask for a fresh bundle link from the repository owner.');
      const raw = toDesignMapSnapshot(bundle);
      const next = snapshotFromProjection(raw, projectTopLevelRegions(raw));
      setSnapshot(next);
      publishSnapshot(next);
      setSelected((current) => next.regions.some((region) => region.id === current) ? current : next.regions[0]?.id ?? '');
      setBundleState('ready');
    }).catch((error) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setBundleState('error');
      setBundleMessage(error instanceof Error ? error.message : 'This bundle could not be loaded.');
      // The document title is server-rendered from the URL's repository param.
      // When the bundle fails to load we cannot trust that identity, so fall
      // back to a neutral title rather than echoing an unverified repository.
      if (typeof document !== 'undefined') document.title = 'Architecture · Unbound Map';
    });
    return () => { controller.abort(); window.removeEventListener('popstate', restoreFocus); };
  }, [bundleFromUrl, repositoryFromUrl, revisionFromUrl]);

  const allRegions = snapshot.regions;
  const regions = useMemo(() => regionIds?.length ? regionIds.map((id) => allRegions.find((region) => region.id === id)).filter((region): region is SystemRegion => Boolean(region)) : allRegions.slice(0, Math.max(1, Math.floor(maxRegions))), [allRegions, maxRegions, regionIds]);
  const current = allRegions.find((region) => region.id === selected) ?? regions[0];
  const startParams = new URLSearchParams(typeof window === 'undefined' ? initialQuery : window.location.search);
  const startContext = new URLSearchParams();
  ['repository', 'revision', 'bundle'].forEach((key) => { const value = startParams.get(key); if (value) startContext.set(key, value); });
  const startHref = `/${startContext.toString() ? `?${startContext.toString()}` : ''}`;
  const recoveryHref = `/explore?${new URLSearchParams({ repository: startParams.get('repository') ?? snapshot.repository, revision: startParams.get('revision') ?? snapshot.revision, ...(requestedBundle ? { bundle: requestedBundle } : {}) }).toString()}`;
  if (requestedBundle && bundleState !== 'ready') {
    return <section className="map-state-panel" role={bundleState === 'error' ? 'alert' : 'status'} aria-live="polite" aria-atomic="true"><span className="map-state-label">{bundleState === 'loading' ? 'Loading graph snapshot' : 'Graph snapshot unavailable'}</span><h2>{bundleState === 'loading' ? 'Preparing the architecture map…' : 'This snapshot could not be loaded.'}</h2><p>{bundleState === 'loading' ? 'The hosted bundle is being validated. No map is shown until that result is known.' : bundleMessage}</p>{bundleState === 'error' && <div className="map-state-actions"><button type="button" className="quiet-link map-retry" onClick={() => window.location.reload()}>Try loading this snapshot again <span aria-hidden="true">↻</span></button><Link className="quiet-link" href={startHref}>Return to Start here <span aria-hidden="true">→</span></Link><Link className="quiet-link" href={recoveryHref}>Open Lachesis context <span aria-hidden="true">↗</span></Link></div>}</section>;
  }
  if (!current) {
    return <section className="map-state-panel" role="status" aria-live="polite" aria-atomic="true"><span className="map-state-label">No regions in snapshot</span><h2>There is no architecture to draw yet.</h2><p>This snapshot is valid but contains no displayable top-level regions. Return to the repository start page or open the source explorer for coverage details.</p><div className="map-state-actions"><Link className="quiet-link" href={startHref}>Return to Start here <span aria-hidden="true">→</span></Link><Link className="quiet-link" href={recoveryHref}>Open Lachesis context <span aria-hidden="true">↗</span></Link></div></section>;
  }
  const boundedPairs = regions.flatMap((region) => (region.downstream ?? []).map((target) => ({ from: region.id, to: target })));
  const layout = layoutFor(regions, boundedPairs);
  const positionFor = (index: number) => layout.positions[index] ?? { x: 12 + (index % 5) * 18, y: 25 + Math.floor(index / 5) * 48, tone: 'blue' as const };
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
      window.location.assign(`${route}?${params.toString()}`);
      return;
    }
    setSelected(region.id);
    setLevel('1');
    window.history.pushState(null, '', `${route}?${params.toString()}`);
  };
  const regionPosition = new Map(regions.map((region, index) => [region.id, positionFor(index)]));
  const allEdges = boundedPairs.filter((edge) => regionPosition.has(edge.from) && regionPosition.has(edge.to));
  const edges = allEdges.slice(0, 12);
  const requestedAnchor = renderParams.get('anchor');
  const focusAnchors = [
    ...(current.anchor ? [{ label: current.anchor.label, detail: `${current.anchor.file}:${current.anchor.line}`, summary: 'Primary design anchor for this region.', anchor: current.anchor.label }] : []),
    ...(current.children ?? []).filter((child) => child.anchor).map((child) => ({ label: child.label, detail: child.anchor!, summary: child.summary, anchor: child.anchor! })),
  ].sort((a, b) => Number(b.anchor === requestedAnchor) - Number(a.anchor === requestedAnchor)).slice(0, 12);
  const anchorIsUnknown = Boolean(level === '2' && requestedAnchor && !focusAnchors.some((anchor) => anchor.anchor === requestedAnchor));
  const relationshipCount = snapshot.relationshipCount ?? 0;
  const hasGraphRelationships = relationshipCount > 0;
  const relationshipEvidence = [...Object.entries(current.relationshipKinds ?? {}).map(([id, kind]) => `${kind} → ${allRegions.find((region) => region.id === id)?.label ?? id}`), ...Object.entries(current.incomingRelationshipKinds ?? {}).map(([id, kind]) => `${kind} ← ${allRegions.find((region) => region.id === id)?.label ?? id}`)];
  const entryRegion = allRegions.find((region) => region.role === 'entry') ?? allRegions[0];
  const outputRegion = [...allRegions].reverse().find((region) => region.role === 'output') ?? allRegions[allRegions.length - 1];
  const relationshipLede = !edges.length && hasGraphRelationships
    ? `Text view: this bundle includes ${relationshipCount.toLocaleString()} graph relationships, but none cross the projected region boundary, so no path is inferred at this altitude.`
    : !edges.length
    ? 'Text view: this bundle has no relationship evidence, so the path is intentionally not inferred.'
    : `Text view: the graph connects ${entryRegion?.label ?? 'the first projected region'} to ${outputRegion?.label ?? 'the final projected region'} across the bounded projection.`;

  const sourceLink = current.anchor ? sourceHref(linkSnapshot, current.anchor.file, current.anchor.line) : undefined;
  // Honest area accounting (H8): the canvas places a bounded set, but every area
  // stays reachable in the ordered text summary below and its own chapter. Count
  // named areas plus any still grouped inside the roll-up so the total N is shown.
  const rolledRegion = allRegions.find((region) => region.rolledUp);
  const totalAreas = allRegions.filter((region) => !region.rolledUp).length + (rolledRegion?.children?.length ?? 0);
  const placedSummary = regions.length < totalAreas ? `showing top ${regions.length} of ${totalAreas} areas` : `${regions.length} area${regions.length === 1 ? '' : 's'} placed`;
  const thesis = snapshot.purpose ?? snapshot.description;
  const mermaid = [
    'flowchart LR',
    `  %% ${mermaidLabel(linkSnapshot.repository)} @ ${mermaidLabel(linkSnapshot.revision)}`,
    ...regions.map((region, index) => `  ${mermaidId(index)}["${mermaidLabel(region.label)}"]`),
    ...allEdges.flatMap((edge) => {
      const from = regions.findIndex((region) => region.id === edge.from);
      const to = regions.findIndex((region) => region.id === edge.to);
      return from >= 0 && to >= 0 ? [`  ${mermaidId(from)} --> ${mermaidId(to)}`] : [];
    }),
  ].join('\n');
  async function copyMermaid() {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(mermaid);
      else {
        const textarea = document.createElement('textarea');
        textarea.value = mermaid;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        if (!document.execCommand('copy')) throw new Error('Clipboard unavailable');
        textarea.remove();
      }
      setMermaidState('copied');
      window.setTimeout(() => setMermaidState('idle'), 2200);
    } catch {
      setMermaidState('failed');
    }
  }
  return <>
    <section className={`map-workbench${compact ? ' is-compact' : ''}`} aria-labelledby="architecture-map-title">
      <h2 id="architecture-map-title" className="sr-only">Architecture map</h2>
      <div className="map-bezel">
        <div className="map-toolbar"><span className="map-status" role="status" aria-live="polite" aria-atomic="true"><i aria-hidden="true" /> level {level} · {level === '0' ? 'system shape' : level === '1' ? 'region focus' : 'design anchors'}</span><span className="map-scale">graph-backed · {level === '0' ? `${placedSummary} · ${layout.label} layout` : level === '1' ? '1 region focused' : `${focusAnchors.length} anchors shown`} {!compact && <button type="button" className="map-export-button" onClick={() => void copyMermaid()}>{mermaidState === 'copied' ? 'Mermaid copied' : mermaidState === 'failed' ? 'Copy failed' : 'Copy Mermaid'}</button>} {level === '2' ? <Link className="map-level-reset" href={regionFocusHref}>Back to region focus</Link> : level === '1' ? <Link className="map-level-reset" href={systemShapeHref}>Back to system shape</Link> : null}</span></div>
        {bundleState === 'ready' && <div className="map-banner" role="status">{snapshot.limitations.some((item) => /demo fixture/i.test(item)) ? 'Demo graph fixture loaded. Shape is transport-valid; verify claims in Lachesis.' : 'Graph-backed snapshot loaded. Placement is a bounded reading projection — the small, readable subset of areas drawn from the full graph.'}</div>}
        {bundleState === 'ready' && thesis && <p className="map-thesis">{thesis}</p>}
        {regionIsUnknown && <div className="map-banner map-banner-caution" role="status">The requested region is not present in this projection. Showing the system’s first available region; open the matching snapshot or region chapter for its evidence.</div>}
        {anchorIsUnknown && <div className="map-banner map-banner-caution" role="status">The requested anchor is not present in this region projection. Showing the available design anchors instead.</div>}
        {allEdges.length > edges.length && <div className="map-banner map-banner-caution" role="status">This canvas shows the first 12 deterministic connections.{compact ? ' Open the full guide for the complete relationship list.' : ' The ordered text summary below retains the full relationship list.'}</div>}
        {!edges.length && <div className="map-banner map-banner-caution" role="status">{hasGraphRelationships ? `This bundle includes ${relationshipCount.toLocaleString()} graph relationships, but none cross the projected region boundary. Connections are intentionally not inferred at this altitude.` : 'Relationship evidence is not present in this bundle, so connections are intentionally not inferred.'}</div>}
        <div className="map-canvas" aria-label={`${linkSnapshot.repository} architecture map`}>
          <div className="map-grid" aria-hidden="true" />
          <svg className="map-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="map-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#637669" /></marker></defs>{edges.map((edge) => { const from = regionPosition.get(edge.from)!; const to = regionPosition.get(edge.to)!; return <line key={`${edge.from}-${edge.to}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} markerEnd="url(#map-arrow)" />; })}</svg>
          {level === '0' ? regions.map((region, index) => { const position = positionFor(index); const role = region.role ?? 'projected region'; return <button type="button" key={region.id} className={`map-node node-${position.tone} ${current.id === region.id ? 'is-selected' : ''}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} onClick={() => selectRegion(region)} aria-label={`${region.label}, ${role} region, ${region.metricLabel}`} aria-pressed={current.id === region.id} aria-controls={compact ? undefined : 'architecture-map-detail'}><span className="node-dot" /><strong>{region.label}</strong><small><span className="node-role">{role}</span> · {region.metricLabel}</small></button>; }) : <div className="map-focus-content"><span className="map-focus-label">{level === '2' ? `Design anchors · ${current.label}` : `Region focus · ${current.label}`}</span>{level === '2' ? <>{focusAnchors.length ? <ol>{focusAnchors.map((anchor, index) => <li key={`${anchor.label}-${anchor.detail}`} className={requestedAnchor === anchor.anchor ? 'is-focused' : undefined} aria-current={requestedAnchor === anchor.anchor ? 'true' : undefined}><span>{String(index + 1).padStart(2, '0')}</span><strong>{anchor.label}</strong><small>{anchor.summary} <code>{anchor.detail}</code></small><Link className="map-focus-link" href={handoffHref(linkSnapshot, current, anchor.anchor, activeBundle)}>Open in Lachesis <span aria-hidden="true">↗</span></Link></li>)}</ol> : <p>No design anchors are available in this projection. Open the region chapter for the bounded responsibility and coverage note.</p>}</> : <>{current.children?.length ? <ol>{current.children.slice(0, 12).map((child, index) => <li key={child.label}><span>{String(index + 1).padStart(2, '0')}</span><Link className="map-child-link" href={childDesignAnchorHref(child.anchor)} aria-label={`Open design anchors related to ${child.label}`}>{child.label}</Link><small>{child.summary}</small></li>)}</ol> : <><p>Child projection is not available in this bundle. Open the region chapter for the bounded responsibility and coverage note.</p><Link className="map-focus-link" href={`/architecture/${regionPath(current.id)}?${new URLSearchParams({ level: '1', repository: linkSnapshot.repository, revision: linkSnapshot.revision, ...(activeBundle ? { bundle: activeBundle } : {}) }).toString()}`}>Open region chapter <span aria-hidden="true">→</span></Link></>}{<Link className="map-focus-link" href={designAnchorHref}>Open design anchors <span aria-hidden="true">→</span></Link>}</>}</div>}
        </div>
      </div>
      {!compact && <aside className="map-inspector" id="architecture-map-detail" aria-live="polite" aria-label="Selected region details"><div className="inspector-label">Selected region</div><h2>{current.label}</h2><p>{current.summary}</p><dl className="inspector-facts"><div><dt>footprint</dt><dd>{current.metricLabel} · {current.projectedLabel}</dd></div><div><dt>path</dt><dd><code>{current.path}</code></dd></div><div><dt>anchor</dt><dd><code>{current.anchor?.label ?? 'No anchor in this projection'}</code></dd></div><div><dt>receives from</dt><dd>{current.upstream?.length ? current.upstream.map((id) => allRegions.find((region) => region.id === id)?.label ?? id).join(', ') : hasGraphRelationships ? 'No cross-region input in this projection' : 'Relationship evidence unavailable'}</dd></div><div><dt>hands off to</dt><dd>{current.downstream?.length ? current.downstream.map((id) => allRegions.find((region) => region.id === id)?.label ?? id).join(', ') : hasGraphRelationships ? 'No cross-region output in this projection' : 'Relationship evidence unavailable'}</dd></div></dl><p className="inspector-note">An anchor is the representative symbol to open first; footprint counts the real declarations this area owns.</p><Link className="inspector-link" href={`/architecture/${regionPath(current.id)}?${new URLSearchParams({ level: '1', repository: linkSnapshot.repository, revision: linkSnapshot.revision, ...(activeBundle ? { bundle: activeBundle } : {}) }).toString()}`}>Read this region <span aria-hidden="true">→</span></Link>{sourceLink && <a className="inspector-link" href={sourceLink} target="_blank" rel="noreferrer">Read source at {current.anchor!.file}:{current.anchor!.line} <span aria-hidden="true">↗</span></a>}<Link className="inspector-link" href={handoffHref(linkSnapshot, current, current.anchor?.label, activeBundle)}>Open anchor in Lachesis <span aria-hidden="true">↗</span></Link></aside>}
      {!compact && snapshot.entrypoints?.length ? <p className="map-entrypoint-note">{snapshot.entrypoints.length.toLocaleString()} exported entrypoint{snapshot.entrypoints.length === 1 ? '' : 's'} mark real places to begin reading. <Link href={`/flows?${new URLSearchParams({ repository: linkSnapshot.repository, revision: linkSnapshot.revision, ...(activeBundle ? { bundle: activeBundle } : {}) }).toString()}`}>Read the guided paths <span aria-hidden="true">→</span></Link></p> : null}
    </section>
      {!compact && <>{snapshot.entrypoints?.length ? <section className="map-entrypoint-list" aria-labelledby="map-entrypoints-title"><h2 id="map-entrypoints-title">Start points in this snapshot</h2><ul>{snapshot.entrypoints.slice(0, 6).map((entry) => { const href = `/explore?${new URLSearchParams({ repository: linkSnapshot.repository, revision: linkSnapshot.revision, anchor: entry.label, ...(activeBundle ? { bundle: activeBundle } : {}) }).toString()}`; return <li key={entry.id}><Link href={href}>{entry.label} <span aria-hidden="true">↗</span></Link><small>{entry.kind} · {entry.file}{entry.line ? `:${entry.line}` : ''}</small></li>; })}</ul></section> : null}{relationshipEvidence.length > 0 && <p className="relationship-kinds-note">Relationship evidence: {relationshipEvidence.join('; ')}.</p>}<p className="relationship-summary-lede">{relationshipLede}</p><details className="relationship-summary" open><summary>The projection, in words</summary><div className="relationship-summary-content"><p>Use this ordered summary if you prefer reading relationships to navigating a diagram. This list includes bounded regions that may sit outside the placed canvas.</p><ol>{allRegions.map((region) => <li key={region.id}><button type="button" onClick={() => selectRegion(region)} aria-pressed={current.id === region.id} aria-controls="architecture-map-detail"><span>{region.label}</span><small>{region.downstream?.length ? `hands off to ${region.downstream.map((id) => allRegions.find((item) => item.id === id)?.label ?? id).join(', ')}` : !edges.length ? hasGraphRelationships ? 'graph relationships stay within this projected region' : 'relationship evidence unavailable' : region.role === 'boot' ? 'initializes the runtime' : 'ends the displayed path'}</small></button></li>)}</ol></div></details></>}
  </>;
}
