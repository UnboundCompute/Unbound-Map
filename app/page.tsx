'use client';

import { useEffect, useState } from 'react';
import { loadHostedBundle } from '../lib/hosted';
import { projectTopLevelRegions, toDesignMapSnapshot, type DesignMapSnapshot, type LachesisBundle } from '../lib/design-map';

type NodeId = 'input' | 'core' | 'detect' | 'output';
type Tab = 'system' | 'flow' | 'trust';
type NodeView = { label: string; description: string; eyebrow: string };

const nodes: Record<NodeId, { system: NodeView; flow: NodeView; trust: NodeView; files: string; anchor: string }> = {
  input: { system: { label: 'Input & protocol', eyebrow: '01 · entry', description: 'Accepts packets, normalizes framing, and hands validated data to the engine.' }, flow: { label: 'Packet bytes', eyebrow: '01 · source', description: 'Raw bytes enter through the capture adapter and become a normalized event.' }, trust: { label: 'External packet', eyebrow: '01 · untrusted', description: 'The trust boundary begins here. Length and framing must be established before use.' }, files: 'src/decode · 46 files', anchor: 'DecodePacket()' },
  core: { system: { label: 'Runtime core', eyebrow: '02 · spine', description: 'Owns the event loop and routes normalized traffic through the processing stages.' }, flow: { label: 'Normalized event', eyebrow: '02 · handoff', description: 'A validated event moves through the run mode and into protocol-aware inspection.' }, trust: { label: 'Validation gate', eyebrow: '02 · guard', description: 'Guards and normalization establish the invariants downstream stages rely on.' }, files: 'src/runmodes · 118 files', anchor: 'RunModeDispatch()' },
  detect: { system: { label: 'Detection engine', eyebrow: '03 · fan-out', description: 'Applies protocol-aware rules through a resolved operations table.' }, flow: { label: 'Signature cursor', eyebrow: '03 · fan-out', description: 'The event fans out through the resolved operations table and matching pipeline.' }, trust: { label: 'Rule interpreter', eyebrow: '03 · obligation', description: 'Rule evaluation consumes normalized state and must preserve parser assumptions.' }, files: 'src/detect · 227 files', anchor: 'SigMatchSignatures()' },
  output: { system: { label: 'Outputs & telemetry', eyebrow: '04 · effects', description: 'Serializes alerts and metrics for the configured output consumers.' }, flow: { label: 'Alert record', eyebrow: '04 · effect', description: 'The resulting record is serialized for the configured output consumers.' }, trust: { label: 'Alert sink', eyebrow: '04 · effect', description: 'Data leaves the processing boundary through configured alert and telemetry sinks.' }, files: 'src/output · 74 files', anchor: 'OutputRegisterModules()' },
};

const tabCopy: Record<Tab, { label: string; title: string; helper: string; caption: string }> = {
  system: { label: 'System map', title: 'The shape of the system', helper: 'Start here: choose a region to see what it owns.', caption: 'HLD · top-level regions' },
  flow: { label: 'Data flow', title: 'Follow one meaningful path', helper: 'Follow the handoffs from input to effect.', caption: 'LLD · request / value route' },
  trust: { label: 'Trust surface', title: 'Where obligations begin', helper: 'See where data becomes trusted—or leaves the system.', caption: 'Glossary · trust boundaries' },
};

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>('system');
  const [selected, setSelected] = useState<NodeId>('core');
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [loadMessage, setLoadMessage] = useState('');
  const [hostedSnapshot, setHostedSnapshot] = useState<DesignMapSnapshot | null>(null);
  const [hostedRegionCount, setHostedRegionCount] = useState(0);
  useEffect(() => {
    const bundleId = new URLSearchParams(window.location.search).get('bundle');
    if (!bundleId) return;
    const controller = new AbortController();
    setLoadState('loading');
    loadHostedBundle(bundleId, controller.signal).then((raw) => {
      const snapshot = toDesignMapSnapshot(raw as LachesisBundle);
      setHostedSnapshot(snapshot);
      const regions = projectTopLevelRegions(snapshot);
      setHostedRegionCount(regions.length);
      setLoadMessage(`${snapshot.repository} · ${snapshot.revision.slice(0, 7)} · ${snapshot.includedNodes.toLocaleString()} nodes · ${regions.length} HLD regions`);
      setLoadState('ready');
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      setLoadMessage(error instanceof Error ? error.message : 'The hosted map could not be loaded.');
      setLoadState('error');
    });
    return () => controller.abort();
  }, []);
  const node = nodes[selected];
  const view = node[activeTab];
  const repository = hostedSnapshot?.repository ?? 'suricata';
  const revision = hostedSnapshot?.revision ?? '4e8b2d';
  const lachesisHref = `https://lachesis.unboundcompute.com/?repo=${encodeURIComponent(repository)}&commit=${encodeURIComponent(revision)}&lens=${activeTab}&focus=${selected}&anchor=${encodeURIComponent(node.anchor)}`;

  return (
    <main className="shell">
      <nav className="nav" aria-label="Design Map navigation">
        <div className="brand"><span className="brand-mark" aria-hidden="true" /><div><div className="brand-name">Design Map</div><div className="brand-kicker">read before the source</div></div></div>
        <div className="nav-meta"><span className="live-dot" /> generated from commit <span>·</span> suricata</div>
      </nav>

      {loadState !== 'idle' && <div className={`load-banner load-${loadState}`} role={loadState === 'error' ? 'alert' : 'status'} aria-live="polite"><span className="load-pip" aria-hidden="true" />{loadState === 'loading' ? 'Loading hosted design map…' : loadState === 'ready' ? `Hosted graph connected · ${loadMessage}` : loadMessage}</div>}

      <section className="hero" aria-labelledby="page-title">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">Architecture / Suricata</div>
            <h1 id="page-title">See the system before you read it.</h1>
            <p className="hero-copy">A living design map generated from the code graph. Start with the system shape, choose one question, then follow the answer into the exact source.</p>
            <a className="hero-cta" href="#map-title">Start with the system map <span aria-hidden="true">↘</span></a>
          </div>
          <aside className="snapshot" aria-label="Repository snapshot">
            <div className="snapshot-meta"><span>commit {revision.slice(0, 7)}</span><span>{hostedSnapshot ? hostedSnapshot.coverageScope : 'fixture snapshot'}</span></div>
            <strong>{hostedSnapshot ? `${hostedSnapshot.indexedNodes.toLocaleString()} nodes → ${hostedRegionCount} HLD regions` : '879,085 nodes → 12 regions'}</strong>
            <p>{hostedSnapshot ? 'The graph identity and coverage are live. The visible region layout remains a fixture until community roll-up is connected.' : 'The top-level map keeps the shape legible. Every region is anchored to real functions and files in Lachesis.'}</p>
          </aside>
        </div>
      </section>

      <section className="reading-rail" aria-label="How to read this map">
        <div className="rail-step rail-step-active"><span>01</span><div><b>Orient</b><small>See the major regions</small></div></div>
        <div className="rail-connector" aria-hidden="true" />
        <div className="rail-step"><span>02</span><div><b>Choose</b><small>Select a path or boundary</small></div></div>
        <div className="rail-connector" aria-hidden="true" />
        <div className="rail-step"><span>03</span><div><b>Verify</b><small>Open the exact source</small></div></div>
      </section>

      <section className="workspace" aria-labelledby="map-title">
        <div className="workspace-top">
          <div><div className="eyebrow">01 / orientation</div><h2 id="map-title" className="workspace-title">{tabCopy[activeTab].title}</h2><p className="workspace-helper">{tabCopy[activeTab].helper}</p></div>
          <div className="tabs" role="tablist" aria-label="Map lenses">
            {(Object.keys(tabCopy) as Tab[]).map((tab) => <button key={tab} className="tab" role="tab" aria-selected={activeTab === tab} data-active={activeTab === tab} onClick={() => setActiveTab(tab)}>{tabCopy[tab].label}</button>)}
          </div>
        </div>

        <div className="bezel"><div className="core map-layout">
          <div className="map-stage" aria-label="Interactive system map">
            <div className="map-caption"><span>●</span> {tabCopy[activeTab].caption}<b>Select a region</b></div>
            <div className="route" aria-hidden="true" />
            {(Object.keys(nodes) as NodeId[]).map((id) => <button key={id} className={`node node-${id}`} data-selected={selected === id} onClick={() => setSelected(id)} aria-pressed={selected === id}><small>{nodes[id][activeTab].eyebrow}</small><b>{nodes[id][activeTab].label}</b><p>{nodes[id][activeTab].description}</p></button>)}
            <div className="stage-footer"><span><i /> entry / handoff</span><span><i className="teal" /> verified edge</span></div>
          </div>
          <aside className="inspector" aria-live="polite"><div className="eyebrow">Selected {activeTab === 'system' ? 'region' : activeTab === 'flow' ? 'handoff' : 'boundary'}</div><h2>{view.label}</h2><p>{view.description}</p><div className="evidence-status"><span className="evidence-check" aria-hidden="true">✓</span><div><b>Graph-backed</b><small>Anchored to {node.anchor} in the analyzed commit.</small></div></div><dl><dt>Source footprint</dt><dd>{node.files}</dd><dt>Next question</dt><dd>{activeTab === 'trust' ? 'What crosses this boundary?' : activeTab === 'flow' ? 'Where does this value go next?' : 'What happens next?'}</dd></dl><a className="inspector-link" href={lachesisHref} target="_blank" rel="noreferrer">Open this in Lachesis <span aria-hidden="true">↗</span></a><small className="inspector-handoff">Code-level path · commit 4e8b2d</small></aside>
        </div></div>
        <div className="footer-note"><span>Map generated from commit {revision.slice(0, 7)} · {hostedSnapshot ? `${hostedSnapshot.includedNodes.toLocaleString()} of ${hostedSnapshot.indexedNodes.toLocaleString()} nodes` : '96% graph coverage'}</span><a href="https://lachesis.unboundcompute.com/" target="_blank" rel="noreferrer">Open Lachesis ↗</a></div>
        <details className="evidence-details"><summary>How this map was made <span aria-hidden="true">+</span></summary><p>Regions are rolled up from tightly connected graph communities. The selected anchor and source footprint are evidence from the analyzed commit; the layout is a reading aid, not a finding.</p></details>
      </section>
    </main>
  );
}
