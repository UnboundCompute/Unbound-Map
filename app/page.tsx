'use client';

import { useState } from 'react';

type NodeId = 'input' | 'core' | 'detect' | 'output';
type Tab = 'system' | 'flow' | 'trust';

const nodes: Record<NodeId, { label: string; eyebrow: string; description: string; files: string; anchor: string }> = {
  input: { label: 'Input & protocol', eyebrow: '01 · entry', description: 'Accepts packets, normalizes framing, and hands validated data to the engine.', files: 'src/decode · 46 files', anchor: 'DecodePacket()' },
  core: { label: 'Runtime core', eyebrow: '02 · spine', description: 'Owns the event loop and routes normalized traffic through the processing stages.', files: 'src/runmodes · 118 files', anchor: 'RunModeDispatch()' },
  detect: { label: 'Detection engine', eyebrow: '03 · fan-out', description: 'Applies protocol-aware rules through a resolved operations table.', files: 'src/detect · 227 files', anchor: 'SigMatchSignatures()' },
  output: { label: 'Outputs & telemetry', eyebrow: '04 · effects', description: 'Serializes alerts and metrics for the configured output consumers.', files: 'src/output · 74 files', anchor: 'OutputRegisterModules()' },
};

const tabCopy: Record<Tab, { label: string; title: string; caption: string }> = {
  system: { label: 'System map', title: 'The shape of the system', caption: 'HLD · rolled-up communities' },
  flow: { label: 'Data flow', title: 'Follow one meaningful path', caption: 'LLD · request / value route' },
  trust: { label: 'Trust surface', title: 'Where obligations begin', caption: 'Glossary · static taxonomy' },
};

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>('system');
  const [selected, setSelected] = useState<NodeId>('core');
  const node = nodes[selected];

  return (
    <main className="shell">
      <nav className="nav" aria-label="Design Map navigation">
        <div className="brand"><span className="brand-mark" aria-hidden="true" /><div><div className="brand-name">Design Map</div><div className="brand-kicker">read before the source</div></div></div>
        <div className="nav-meta"><span className="live-dot" /> generated from HEAD <span>·</span> suricata</div>
      </nav>

      <section className="hero" aria-labelledby="page-title">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">Architecture / Suricata</div>
            <h1 id="page-title">See the system before you read it.</h1>
            <p className="hero-copy">A living design map generated from the code graph. Start at the altitude of subsystems, then follow one clear path into the exact source.</p>
          </div>
          <aside className="snapshot" aria-label="Repository snapshot">
            <div className="snapshot-meta"><span>commit 4e8b2d</span><span>just now</span></div>
            <strong>879,085 nodes → 12 regions</strong>
            <p>The top-level map keeps the shape legible. Every region is anchored to real functions and files in Lachesis.</p>
          </aside>
        </div>
      </section>

      <section className="workspace" aria-labelledby="map-title">
        <div className="workspace-top">
          <div><div className="eyebrow">01 / orientation</div><h2 id="map-title" className="workspace-title">{tabCopy[activeTab].title}</h2></div>
          <div className="tabs" role="tablist" aria-label="Map lenses">
            {(Object.keys(tabCopy) as Tab[]).map((tab) => <button key={tab} className="tab" role="tab" aria-selected={activeTab === tab} data-active={activeTab === tab} onClick={() => setActiveTab(tab)}>{tabCopy[tab].label}</button>)}
          </div>
        </div>

        <div className="bezel"><div className="core map-layout">
          <div className="map-stage" aria-label="Interactive system map">
            <div className="map-caption"><span>●</span> {tabCopy[activeTab].caption}</div>
            <div className="route" aria-hidden="true" />
            {(Object.keys(nodes) as NodeId[]).map((id) => <button key={id} className={`node node-${id}`} data-selected={selected === id} onClick={() => setSelected(id)} aria-pressed={selected === id}><small>{nodes[id].eyebrow}</small><b>{nodes[id].label}</b><p>{activeTab === 'trust' && id === 'input' ? 'untrusted boundary' : nodes[id].description}</p></button>)}
            <div className="stage-footer"><span><i /> entry / handoff</span><span><i className="teal" /> verified edge</span></div>
          </div>
          <aside className="inspector" aria-live="polite"><div className="eyebrow">Selected region</div><h2>{node.label}</h2><p>{node.description}</p><dl><dt>Anchored by</dt><dd>{node.anchor}</dd><dt>Source footprint</dt><dd>{node.files}</dd><dt>Next question</dt><dd>{activeTab === 'trust' ? 'What crosses this boundary?' : 'What happens next?'}</dd></dl><button className="inspector-link" onClick={() => window.open('https://lachesis.unboundcompute.com/', '_blank', 'noopener,noreferrer')}>Explore in Lachesis <span aria-hidden="true">↗</span></button></aside>
        </div></div>
        <div className="footer-note"><span>Map generated from commit 4e8b2d · 96% graph coverage</span><a href="https://lachesis.unboundcompute.com/" target="_blank" rel="noreferrer">How the evidence works ↗</a></div>
      </section>
    </main>
  );
}
