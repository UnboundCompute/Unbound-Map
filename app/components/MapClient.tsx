'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadHostedBundle } from '../../lib/hosted';
import { projectTopLevelRegions, toDesignMapSnapshot, type HLDRegion, type LachesisBundle } from '../../lib/design-map';

type MapNode = { id: string; label: string; meta: string; detail: string; anchor: string; x: number; y: number; tone: string };

const mapNodes: MapNode[] = [
  { id: 'input', label: 'Input & protocol', meta: 'src/decode · 46 files', detail: 'Accepts packets, normalizes framing, and hands validated data to the engine.', anchor: 'DecodePacket()', x: 8, y: 44, tone: 'gold' },
  { id: 'core', label: 'Runtime core', meta: 'src/runmodes · 118 files', detail: 'Owns the event loop and routes normalized traffic through processing stages.', anchor: 'RunModeDispatch()', x: 34, y: 44, tone: 'blue' },
  { id: 'detect', label: 'Detection engine', meta: 'src/detect · 227 files', detail: 'Applies protocol-aware rules through a resolved operations table.', anchor: 'SigMatchSignatures()', x: 61, y: 44, tone: 'violet' },
  { id: 'output', label: 'Outputs & telemetry', meta: 'src/output · 74 files', detail: 'Serializes alerts and metrics for configured output consumers.', anchor: 'OutputRegisterModules()', x: 84, y: 44, tone: 'green' },
];

export function MapClient({ mode = 'system' }: { mode?: 'system' | 'flow' | 'trust' }) {
  const [selected, setSelected] = useState('core');
  const [hostedRegions, setHostedRegions] = useState<HLDRegion[] | null>(null);
  const [bundleState, setBundleState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [bundleMessage, setBundleMessage] = useState('');
  useEffect(() => {
    const bundleId = new URLSearchParams(window.location.search).get('bundle');
    if (!bundleId || mode !== 'system') return;
    const controller = new AbortController();
    setBundleState('loading');
    loadHostedBundle(bundleId, controller.signal).then((bundle) => {
      setHostedRegions(projectTopLevelRegions(toDesignMapSnapshot(bundle as LachesisBundle)));
      setBundleState('ready');
    }).catch((error) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setBundleState('error'); setBundleMessage(error instanceof Error ? error.message : 'This bundle could not be loaded.');
    });
    return () => controller.abort();
  }, [mode]);
  const visibleNodes = hostedRegions?.slice(0, 4).map((region, index) => ({ ...mapNodes[index], label: region.label, meta: `${region.path ?? 'top-level region'} · ${region.nodeCount} nodes`, anchor: region.anchor?.label ?? mapNodes[index].anchor })) ?? mapNodes;
  const current = visibleNodes.find((node) => node.id === selected) ?? visibleNodes[1];
  return (
    <div className="map-workbench">
      <div className="map-bezel">
        <div className="map-toolbar"><span className="map-status"><i /> {mode === 'system' ? 'structural view' : mode === 'flow' ? 'request path' : 'boundary view'}</span><span className="map-scale">HLD · {visibleNodes.length} regions</span></div>
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
        <Link className="inspector-link" href={`/explore?symbol=${encodeURIComponent(current.anchor)}`}>Open this path in Lachesis <span>→</span></Link>
      </aside>
    </div>
  );
}
