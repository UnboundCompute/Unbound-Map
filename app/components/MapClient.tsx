'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadHostedBundle } from '../../lib/hosted';
import { projectTopLevelRegions, toDesignMapSnapshot, type LachesisBundle } from '../../lib/design-map';
import { illustrativeSnapshot, snapshotFromProjection, toHandoff, type RepositorySnapshotView } from '../../lib/view-model';

type MapNode = { id: string; label: string; meta: string; detail: string; anchor: string; x: number; y: number; tone: string; regionId: string };

const positions = [{ x: 8, tone: 'gold' }, { x: 34, tone: 'blue' }, { x: 61, tone: 'violet' }, { x: 84, tone: 'green' }];
const mapNodes: MapNode[] = illustrativeSnapshot.regions.map((region, index) => ({ id: region.id, regionId: region.id, label: region.label, meta: region.metricLabel, detail: region.summary, anchor: region.anchor?.label ?? region.label, y: 44, ...positions[index] }));

export function MapClient({ mode = 'system' }: { mode?: 'system' | 'flow' | 'trust' }) {
  const [selected, setSelected] = useState('core');
  const [snapshot, setSnapshot] = useState<RepositorySnapshotView>(illustrativeSnapshot);
  const [bundleState, setBundleState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [bundleMessage, setBundleMessage] = useState('');
  useEffect(() => {
    const bundleId = new URLSearchParams(window.location.search).get('bundle');
    if (!bundleId || mode !== 'system') return;
    const controller = new AbortController();
    setBundleState('loading');
    loadHostedBundle(bundleId, controller.signal).then((bundle) => {
      const rawSnapshot = toDesignMapSnapshot(bundle as LachesisBundle);
      setSnapshot(snapshotFromProjection(rawSnapshot, projectTopLevelRegions(rawSnapshot)));
      setBundleState('ready');
    }).catch((error) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setBundleState('error'); setBundleMessage(error instanceof Error ? error.message : 'This bundle could not be loaded.');
    });
    return () => controller.abort();
  }, [mode]);
  const projectedNodes = snapshot.regions.slice(0, 4).map((region, index) => ({ ...mapNodes[index], id: region.id, regionId: region.id, label: region.label, meta: region.metricLabel, detail: region.summary, anchor: region.anchor?.label ?? mapNodes[index].anchor }));
  const visibleNodes = projectedNodes.length >= 2 ? projectedNodes : mapNodes;
  const renderedNodes = visibleNodes;
  const current = renderedNodes.find((node) => node.id === selected) ?? renderedNodes[1];
  const directory = snapshot.regions;
  const handoff = toHandoff(snapshot, snapshot.regions.find((region) => region.id === current.regionId) ?? illustrativeSnapshot.regions[1], current.anchor, new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search).get('bundle') ?? undefined);
  const handoffHref = `/explore?${new URLSearchParams({ repository: handoff.repository, revision: handoff.revision, region: handoff.regionId, label: handoff.regionLabel, anchor: handoff.anchor, ...(handoff.bundleId ? { bundle: handoff.bundleId } : {}) }).toString()}`;
  return (
    <>
    <div className="map-workbench">
      <div className="map-bezel">
        <div className="map-toolbar"><span className="map-status"><i /> {mode === 'system' ? 'structural view' : mode === 'flow' ? 'request path' : 'boundary view'}</span><span className="map-scale">{snapshot.provenance === 'illustrative' ? 'illustrative' : 'graph-backed'} · {visibleNodes.length} regions</span></div>
        {bundleState === 'loading' && <div className="map-banner" role="status">Loading the hosted graph bundle…</div>}
        {bundleState === 'error' && <div className="map-banner map-banner-error" role="alert">{bundleMessage}</div>}
        {bundleState === 'ready' && <div className="map-banner" role="status">Graph-backed snapshot loaded. Layout remains a bounded reading projection.</div>}
        <div className="map-canvas" aria-label={`${mode} architecture map`}>
          <div className="map-grid" />
          <div className="map-route route-a" /><div className="map-route route-b" /><div className="map-route route-c" />
          {visibleNodes.map((node) => <button key={node.id} className={`map-node node-${node.tone} ${selected === node.id ? 'is-selected' : ''}`} style={{ left: `${node.x}%`, top: `${node.y}%` }} onClick={() => setSelected(node.id)} aria-pressed={selected === node.id}><span className="node-dot" /><strong>{node.label}</strong><small>{node.meta}</small></button>)}
          <div className="map-axis axis-x">entry <span /> effect</div><div className="map-axis axis-y">runtime spine</div>
        </div>
      </div>
      <aside className="map-inspector" aria-live="polite">
        <div className="inspector-label">Selected region</div><h2>{current.label}</h2><p>{current.detail}</p>
        <dl className="inspector-facts"><div><dt>footprint</dt><dd>{current.meta}</dd></div><div><dt>anchor</dt><dd><code>{current.anchor}</code></dd></div></dl>
        <Link className="inspector-link" href={handoffHref}>Open this path in Lachesis <span>→</span></Link>
      </aside>
    </div>
    {mode === 'system' && <section className="region-directory" aria-label="Region directory"><div><span className="sidebar-label">Region directory</span><p>Placed regions stay legible on the map. The full projection remains available here as the repository grows.</p></div><ol>{directory.map((region) => <li key={region.id}><span>{region.label}</span><small>{region.rolledUp ? 'remainder' : `${region.nodeCount} nodes`}</small></li>)}</ol></section>}
    </>
  );
}
