'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { loadHostedBundle } from '../../lib/hosted';
import { projectTopLevelRegions, toDesignMapSnapshot, type LachesisBundle } from '../../lib/design-map';
import { illustrativeSnapshot, snapshotFromProjection, toHandoff, type RepositorySnapshotView, type SystemRegion } from '../../lib/view-model';

type Position = { x: number; y: number; tone: 'gold' | 'blue' | 'violet' | 'green' };
const positions: Position[] = [
  { x: 9, y: 52, tone: 'gold' }, { x: 23, y: 52, tone: 'gold' }, { x: 38, y: 52, tone: 'blue' },
  { x: 53, y: 52, tone: 'violet' }, { x: 68, y: 38, tone: 'gold' }, { x: 68, y: 67, tone: 'blue' },
  { x: 88, y: 52, tone: 'green' }, { x: 38, y: 16, tone: 'violet' }, { x: 82, y: 24, tone: 'green' },
];

function handoffHref(snapshot: RepositorySnapshotView, region: SystemRegion, bundleId?: string) {
  const handoff = toHandoff(snapshot, region, region.anchor?.label ?? region.label, bundleId);
  return `/explore?${new URLSearchParams({ repository: handoff.repository, revision: handoff.revision, region: handoff.regionId, label: handoff.regionLabel, anchor: handoff.anchor, ...(handoff.bundleId ? { bundle: handoff.bundleId } : {}) }).toString()}`;
}

export function MapClient({ route = '/architecture', initialBundle }: { route?: string; initialBundle?: string }) {
  const [selected, setSelected] = useState('decode');
  const [level, setLevel] = useState('0');
  const [snapshot, setSnapshot] = useState<RepositorySnapshotView>(illustrativeSnapshot);
  const [bundleState, setBundleState] = useState<'idle' | 'loading' | 'ready' | 'error'>(initialBundle ? 'loading' : 'idle');
  const [bundleMessage, setBundleMessage] = useState('');
  const [requestedBundle, setRequestedBundle] = useState(initialBundle ?? '');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedRegion = params.get('region');
    if (requestedRegion) setSelected(requestedRegion);
    if (params.get('level')) setLevel(params.get('level')!);
    const restoreFocus = () => {
      const next = new URLSearchParams(window.location.search);
      setSelected(next.get('region') ?? 'decode');
      setLevel(next.get('level') ?? '0');
    };
    window.addEventListener('popstate', restoreFocus);
    const bundleId = params.get('bundle') ?? initialBundle;
    if (!bundleId) return () => window.removeEventListener('popstate', restoreFocus);
    setRequestedBundle(bundleId);
    const controller = new AbortController();
    setBundleState('loading');
    loadHostedBundle(bundleId, controller.signal).then((bundle) => {
      const raw = toDesignMapSnapshot(bundle as LachesisBundle);
      const next = snapshotFromProjection(raw, projectTopLevelRegions(raw));
      setSnapshot(next);
      setSelected((current) => next.regions.some((region) => region.id === current) ? current : next.regions[0]?.id ?? '');
      setBundleState('ready');
    }).catch((error) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setBundleState('error');
      setBundleMessage(error instanceof Error ? error.message : 'This bundle could not be loaded.');
    });
    return () => { controller.abort(); window.removeEventListener('popstate', restoreFocus); };
  }, []);

  const regions = useMemo(() => snapshot.regions.slice(0, 9), [snapshot.regions]);
  const current = regions.find((region) => region.id === selected) ?? regions[0];
  if (requestedBundle && bundleState !== 'ready') {
    return <section className="map-state-panel" role={bundleState === 'error' ? 'alert' : 'status'} aria-live="polite"><span className="map-state-label">{bundleState === 'loading' ? 'Loading graph snapshot' : 'Graph snapshot unavailable'}</span><h2>{bundleState === 'loading' ? 'Preparing the architecture map…' : 'This snapshot could not be loaded.'}</h2><p>{bundleState === 'loading' ? 'The hosted bundle is being validated. The illustrative map stays hidden until that result is known.' : bundleMessage}</p>{bundleState === 'error' && <button type="button" className="quiet-link map-retry" onClick={() => window.location.reload()}>Try loading this snapshot again <span aria-hidden="true">↻</span></button>}</section>;
  }
  if (!current) {
    return <section className="map-state-panel" role="status"><span className="map-state-label">No regions in snapshot</span><h2>There is no architecture to draw yet.</h2><p>This snapshot is valid but contains no displayable top-level regions. Return to the repository start page or open the source explorer for coverage details.</p><Link className="quiet-link" href="/">Return to Start here <span aria-hidden="true">→</span></Link></section>;
  }
  const positionFor = (index: number) => positions[index] ?? { x: 12 + (index % 5) * 18, y: 25 + Math.floor(index / 5) * 48, tone: 'blue' as const };
  const activeBundle = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search).get('bundle') ?? undefined;
  const systemShapeParams = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
  systemShapeParams.delete('region');
  systemShapeParams.set('level', '0');
  const systemShapeHref = `${route}?${systemShapeParams.toString()}`;
  const selectRegion = (region: SystemRegion) => {
    setSelected(region.id);
    const params = new URLSearchParams(window.location.search);
    params.set('region', region.id);
    params.set('level', '1');
    window.history.pushState(null, '', `${route}?${params.toString()}`);
  };
  const regionPosition = new Map(regions.map((region, index) => [region.id, positionFor(index)]));
  const edges = regions.flatMap((region) => (region.downstream ?? []).map((target) => ({ from: region.id, to: target }))).filter((edge) => regionPosition.has(edge.from) && regionPosition.has(edge.to));

  return <>
    <div className="map-workbench">
      <div className="map-bezel">
        <div className="map-toolbar"><span className="map-status"><i aria-hidden="true" /> level {level} · {level === '0' ? 'system shape' : 'region focus'}</span><span className="map-scale">{snapshot.provenance === 'illustrative' ? 'illustrative' : 'graph-backed'} · {regions.length} regions shown {level !== '0' && <Link className="map-level-reset" href={systemShapeHref}>Back to system shape</Link>}</span></div>
        {bundleState === 'ready' && <div className="map-banner" role="status">Graph-backed snapshot loaded. Placement is a bounded reading projection.</div>}
        {snapshot.provenance === 'graph-backed' && !edges.length && <div className="map-banner map-banner-caution" role="status">Relationship evidence is not present in this bundle, so connections are intentionally not inferred.</div>}
        <div className="map-canvas" aria-label={`${snapshot.repository} architecture map`}>
          <div className="map-grid" aria-hidden="true" />
          <svg className="map-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="map-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#637669" /></marker></defs>{edges.map((edge) => { const from = regionPosition.get(edge.from)!; const to = regionPosition.get(edge.to)!; return <line key={`${edge.from}-${edge.to}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} markerEnd="url(#map-arrow)" />; })}</svg>
          {regions.map((region, index) => { const position = positionFor(index); return <button key={region.id} className={`map-node node-${position.tone} ${current.id === region.id ? 'is-selected' : ''}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} onClick={() => selectRegion(region)} aria-pressed={current.id === region.id}><span className="node-dot" /><strong>{region.label}</strong><small>{region.metricLabel}</small></button>; })}
          <div className="map-external external-input" aria-hidden="true">wire input</div><div className="map-external external-output" aria-hidden="true">consumers</div><div className="map-axis axis-x" aria-hidden="true">entry <span /> effect</div><div className="map-axis axis-y" aria-hidden="true">runtime spine</div>
        </div>
      </div>
      <aside className="map-inspector" aria-live="polite" aria-label="Selected region details"><div className="inspector-label">Selected region</div><h2>{current.label}</h2><p>{current.summary}</p><dl className="inspector-facts"><div><dt>footprint</dt><dd>{current.metricLabel}</dd></div><div><dt>path</dt><dd><code>{current.path}</code></dd></div><div><dt>anchor</dt><dd><code>{current.anchor?.label ?? 'No anchor in this projection'}</code></dd></div></dl><Link className="inspector-link" href={`/architecture/${current.id}?${new URLSearchParams({ level: '1', repository: snapshot.repository, revision: snapshot.revision, ...(activeBundle ? { bundle: activeBundle } : {}) }).toString()}`}>Read this region <span aria-hidden="true">→</span></Link><Link className="inspector-link" href={handoffHref(snapshot, current, activeBundle)}>Open anchor in Lachesis <span aria-hidden="true">↗</span></Link></aside>
    </div>
    <section className="relationship-summary" aria-labelledby="relationship-title"><div><h2 id="relationship-title">The same map, in words</h2><p>Use this ordered summary if you prefer reading relationships to navigating a diagram.</p></div><ol>{regions.map((region) => <li key={region.id}><button onClick={() => selectRegion(region)} aria-pressed={current.id === region.id}><span>{region.label}</span><small>{region.downstream?.length ? `hands off to ${region.downstream.map((id) => regions.find((item) => item.id === id)?.label ?? id).join(', ')}` : snapshot.provenance === 'graph-backed' && !edges.length ? 'relationship evidence unavailable' : region.role === 'boot' ? 'initializes the runtime' : 'ends the displayed path'}</small></button></li>)}</ol></section>
    <section className="region-directory" aria-label="Region directory"><div><span className="rail-heading">Region directory</span><p>Placed regions stay legible on the map. The full projection remains available here as the repository grows.</p></div><ol>{snapshot.regions.map((region) => <li key={region.id}><Link href={`/architecture/${region.id}?${new URLSearchParams({ level: '1', repository: snapshot.repository, revision: snapshot.revision, ...(activeBundle ? { bundle: activeBundle } : {}) }).toString()}`}><span>{region.label}</span><small>{region.rolledUp ? 'remainder' : `${region.nodeCount} nodes`}</small></Link></li>)}</ol></section>
  </>;
}
