'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { flowSteps, illustrativeSnapshot, type SharedSnapshotContext } from '../../lib/view-model';

function exploreHref(stepId: string, context: SharedSnapshotContext) {
  const step = flowSteps.find((item) => item.id === stepId) ?? flowSteps[0];
  return `/explore?${new URLSearchParams({ repository: context.repository ?? illustrativeSnapshot.repository, revision: context.revision ?? illustrativeSnapshot.revision, region: step.regionId, label: step.noun, flow: context.flow ?? 'packet-decode', step: step.id, anchor: step.anchor, ...(context.bundle ? { bundle: context.bundle } : {}) }).toString()}`;
}

const branches = [
  { id: 'protocol', title: 'Static protocol dispatch', summary: 'EtherType selects the layer-three decoder.', detail: 'IPv4, IPv6, VLAN, ARP, or another supported branch is selected from the enumerated EtherType before deeper parsing.' },
  { id: 'runtime', title: 'Runtime flow dispatch', summary: 'Observed state selects the parser path.', detail: 'Once a flow exists, state allocation and protocol detection choose the parser state carried by that flow.' },
] as const;
type BranchId = (typeof branches)[number]['id'];
function normalizeBranch(value: string | null | undefined): BranchId { return value === 'runtime' ? 'runtime' : 'protocol'; }

export function FlowDiagram({ route = '/flows', context = {}, initialStep, initialBranch }: { route?: string; context?: SharedSnapshotContext; initialStep?: string; initialBranch?: string }) {
  const initialIndex = flowSteps.findIndex((item) => item.id === initialStep);
  const invalidInitialStep = Boolean(initialStep && initialIndex < 0);
  const [active, setActive] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [invalidStep, setInvalidStep] = useState(invalidInitialStep);
  const [branch, setBranch] = useState<BranchId>(normalizeBranch(initialBranch ?? context.branch));
  const [linearOpen, setLinearOpen] = useState(false);
  const step = flowSteps[active];
  useEffect(() => {
    const restoreStep = () => {
      const value = new URLSearchParams(window.location.search).get('step');
      const index = flowSteps.findIndex((item) => item.id === value);
      setInvalidStep(Boolean(value && index < 0));
      setActive(index >= 0 ? index : (flowSteps.findIndex((item) => item.id === initialStep) >= 0 ? flowSteps.findIndex((item) => item.id === initialStep) : 0));
      setBranch(normalizeBranch(new URLSearchParams(window.location.search).get('branch')));
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
    setInvalidStep(false);
    const params = new URLSearchParams(window.location.search);
    params.set('step', flowSteps[index].id);
    window.history.pushState(null, '', `${route}?${params.toString()}`);
  };
  const chooseBranch = (nextBranch: BranchId) => {
    setBranch(nextBranch);
    const params = new URLSearchParams(window.location.search);
    params.set('branch', nextBranch);
    window.history.pushState(null, '', `${route}?${params.toString()}`);
  };
  const activeBranch = branches.find((item) => item.id === branch)!;
  return <section className="guided-flow" aria-labelledby="flow-steps-title">
    <div className="flow-progress"><div><span className="flow-label">One flow · {flowSteps.length} handoffs</span><h2 id="flow-steps-title">Read the path one boundary at a time.</h2></div><span className="flow-count">{String(active + 1).padStart(2, '0')} / {String(flowSteps.length).padStart(2, '0')}</span></div>
    {invalidStep && <p className="flow-banner" role="status" aria-live="polite">The requested step is not in this flow. Showing the first handoff; choose another step below.</p>}
    <section className="flow-branches" aria-labelledby="flow-branches-title"><div><span className="flow-label">Branching, kept readable</span><h3 id="flow-branches-title">The handoff has two different kinds of dispatch.</h3></div><div><div className="flow-branch-grid" role="group" aria-label="Dispatch branches">{branches.map((item) => <button type="button" key={item.id} className={branch === item.id ? 'is-selected' : ''} onClick={() => chooseBranch(item.id)} aria-pressed={branch === item.id} aria-controls="flow-branch-detail"><strong>{item.title}</strong><p>{item.summary}</p></button>)}</div><p className="flow-branch-detail" id="flow-branch-detail" role="region" aria-live="polite" aria-label={`${activeBranch.title} explanation`}>{activeBranch.detail}</p></div></section>
    <ol className="flow-step-nav" aria-label="Flow steps">{flowSteps.map((item, index) => <li key={item.id}><button type="button" className={index === active ? 'is-active' : ''} onClick={() => choose(index)} aria-current={index === active ? 'step' : undefined} aria-controls="flow-step-detail"><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.noun}</strong></button></li>)}</ol>
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">Step {active + 1} of {flowSteps.length}: {step.noun}. {step.description}</p><div className="flow-stage" id="flow-step-detail" role="region" aria-labelledby="flow-step-title"><div className="flow-stage-track" aria-hidden="true"><span className="flow-stage-fill" style={{ transform: `scaleX(${active / Math.max(1, flowSteps.length - 1)})` }} /></div><p className="flow-handoff-label">{step.handoff}</p><h3 id="flow-step-title">{step.noun}</h3><p className="flow-description">{step.description}</p><dl className="flow-fields"><div><dt>input</dt><dd><code>{step.input}</code></dd></div><div><dt>output</dt><dd><code>{step.output}</code></dd></div>{step.decision && <div><dt>decision</dt><dd>{step.decision}</dd></div>}</dl>{step.guard && <p className="flow-guard"><strong>Guard</strong><span>{step.guard}</span></p>}<Link className="quiet-link" href={exploreHref(step.id, context)}>Open {step.anchor} in Lachesis <span aria-hidden="true">↗</span></Link></div>
    <div className="flow-controls"><button type="button" onClick={() => choose(Math.max(0, active - 1))} disabled={active === 0}>← Previous</button><button type="button" onClick={() => choose(Math.min(flowSteps.length - 1, active + 1))} disabled={active === flowSteps.length - 1}>Next →</button></div>
    <details className="flow-linear" open={linearOpen} onToggle={(event) => setLinearOpen(event.currentTarget.open)}><summary>Read all five handoffs as text</summary><ol>{flowSteps.map((item, index) => <li key={item.id}><strong>{index + 1}. {item.noun}</strong><span>{item.description}</span><small>{item.input} → {item.output}</small></li>)}</ol></details>
  </section>;
}
