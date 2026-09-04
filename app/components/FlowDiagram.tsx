'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { flowSteps, illustrativeSnapshot, type SharedSnapshotContext } from '../../lib/view-model';

function exploreHref(stepId: string, context: SharedSnapshotContext) {
  const step = flowSteps.find((item) => item.id === stepId) ?? flowSteps[0];
  return `/explore?${new URLSearchParams({ repository: context.repository ?? illustrativeSnapshot.repository, revision: context.revision ?? illustrativeSnapshot.revision, region: step.regionId, label: step.noun, flow: step.id, step: step.id, anchor: step.anchor, ...(context.bundle ? { bundle: context.bundle } : {}) }).toString()}`;
}

export function FlowDiagram({ route = '/flows', context = {} }: { route?: string; context?: SharedSnapshotContext }) {
  const [active, setActive] = useState(0);
  const [linearOpen, setLinearOpen] = useState(false);
  const step = flowSteps[active];
  useEffect(() => {
    const restoreStep = () => {
      const value = new URLSearchParams(window.location.search).get('step');
      const index = flowSteps.findIndex((item) => item.id === value);
      setActive(index >= 0 ? index : 0);
    };
    restoreStep();
    window.addEventListener('popstate', restoreStep);
    const media = window.matchMedia('(max-width: 820px)');
    setLinearOpen(media.matches);
    const updateLinear = () => setLinearOpen(media.matches);
    media.addEventListener('change', updateLinear);
    return () => { window.removeEventListener('popstate', restoreStep); media.removeEventListener('change', updateLinear); };
  }, []);
  const choose = (index: number) => {
    setActive(index);
    const params = new URLSearchParams(window.location.search);
    params.set('step', flowSteps[index].id);
    window.history.pushState(null, '', `${route}?${params.toString()}`);
  };
  return <section className="guided-flow" aria-labelledby="flow-steps-title">
    <div className="flow-progress"><div><span className="flow-label">One flow · {flowSteps.length} handoffs</span><h2 id="flow-steps-title">Read the path one boundary at a time.</h2></div><span className="flow-count">{String(active + 1).padStart(2, '0')} / {String(flowSteps.length).padStart(2, '0')}</span></div>
    <ol className="flow-step-nav" aria-label="Flow steps">{flowSteps.map((item, index) => <li key={item.id}><button className={index === active ? 'is-active' : ''} onClick={() => choose(index)} aria-current={index === active ? 'step' : undefined}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.noun}</strong></button></li>)}</ol>
    <div className="flow-stage"><div className="flow-stage-track" aria-hidden="true"><span className="flow-stage-fill" style={{ transform: `scaleX(${active / Math.max(1, flowSteps.length - 1)})` }} /></div><p className="flow-handoff-label">{step.handoff}</p><h3>{step.noun}</h3><p className="flow-description">{step.description}</p><dl className="flow-fields"><div><dt>input</dt><dd><code>{step.input}</code></dd></div><div><dt>output</dt><dd><code>{step.output}</code></dd></div>{step.decision && <div><dt>decision</dt><dd>{step.decision}</dd></div>}</dl>{step.guard && <p className="flow-guard"><strong>Guard</strong><span>{step.guard}</span></p>}<Link className="quiet-link" href={exploreHref(step.id, context)}>Open {step.anchor} in Lachesis <span aria-hidden="true">↗</span></Link></div>
    <div className="flow-controls"><button type="button" onClick={() => choose(Math.max(0, active - 1))} disabled={active === 0}>← Previous</button><button type="button" onClick={() => choose(Math.min(flowSteps.length - 1, active + 1))} disabled={active === flowSteps.length - 1}>Next →</button></div>
    <details className="flow-linear" open={linearOpen} onToggle={(event) => setLinearOpen(event.currentTarget.open)}><summary>Read all five handoffs as text</summary><ol>{flowSteps.map((item, index) => <li key={item.id}><strong>{index + 1}. {item.noun}</strong><span>{item.description}</span><small>{item.input} → {item.output}</small></li>)}</ol></details>
  </section>;
}
