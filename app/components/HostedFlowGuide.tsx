'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { isLachesisBundle, projectTopLevelRegions, toDesignMapSnapshot, type BundleRequestPath, type LachesisBundle } from '../../lib/design-map';
import { loadHostedBundle } from '../../lib/hosted';
import { snapshotFromProjection, sourceHref, type SharedSnapshotContext } from '../../lib/view-model';

function publishSnapshot(bundle: LachesisBundle) {
  const projection = toDesignMapSnapshot(bundle);
  const snapshot = snapshotFromProjection(projection, projectTopLevelRegions(projection, 9));
  window.dispatchEvent(new CustomEvent('design-map:snapshot-ready', { detail: {
    provenance: snapshot.provenance,
    coverageState: snapshot.coverageState,
    limitations: snapshot.limitations,
    regionCount: snapshot.regions.length,
    repository: snapshot.repository,
    revision: snapshot.revision,
    generatedAt: snapshot.generatedAt,
    coverageScope: snapshot.coverageScope,
    indexedNodes: snapshot.indexedNodes,
  } }));
}

function flowTitle(path: BundleRequestPath) {
  const description = path.description.trim();
  if (description && !/^request lifecycle from\b/i.test(description)) return description.replace(/[.]$/, '');
  const first = path.hops[0]?.caption || path.id.replace(/^request[.:_-]*/, '').replace(/[._-]+/g, ' ');
  return `${first} lifecycle`;
}

export function HostedFlowGuide({ bundleId, context, initialFlow, initialStep, route = '/flows' }: { bundleId: string; context: SharedSnapshotContext; initialFlow?: string; initialStep?: string; route?: string }) {
  const [bundle, setBundle] = useState<LachesisBundle>();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [flowId, setFlowId] = useState(initialFlow ?? '');
  const [stepId, setStepId] = useState(initialStep ?? '');

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    loadHostedBundle(bundleId, controller.signal).then((value) => {
      if (!isLachesisBundle(value)) throw new Error('This hosted flow bundle does not match the supported code-understanding contract.');
      setBundle(value);
      publishSnapshot(value);
      setState('ready');
    }).catch((error) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setMessage(error instanceof Error ? error.message : 'This flow bundle could not be loaded.');
      setState('error');
    });
    return () => controller.abort();
  }, [bundleId]);

  useEffect(() => {
    const restore = () => {
      const params = new URLSearchParams(window.location.search);
      setFlowId(params.get('flow') ?? '');
      setStepId(params.get('step') ?? '');
    };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);

  const flows = bundle?.paths?.requests ?? [];
  const flow = flows.find((item) => item.id === flowId) ?? flows[0];
  const nodeById = useMemo(() => new Map((bundle?.graph.nodes ?? []).map((node) => [node.id, node])), [bundle]);
  const activeIndex = Math.max(0, flow?.hops.findIndex((hop) => (hop.id ?? hop.node_id) === stepId) ?? 0);
  const activeHop = flow?.hops[activeIndex];
  const activeNode = activeHop ? nodeById.get(activeHop.node_id) : undefined;
  const sourceLink = activeNode && bundle ? sourceHref({ sourceUrlTemplate: bundle.meta.source_url_template, revision: bundle.meta.revision }, activeNode.file, activeNode.line) : undefined;

  const updateUrl = (nextFlow: string, nextStep?: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('flow', nextFlow);
    nextStep ? params.set('step', nextStep) : params.delete('step');
    const nextRoute = route.startsWith('/flows/') ? `/flows/${encodeURIComponent(nextFlow)}` : route;
    window.history.pushState(null, '', `${nextRoute}?${params.toString()}`);
  };
  const chooseFlow = (next: BundleRequestPath) => {
    setFlowId(next.id);
    setStepId('');
    updateUrl(next.id);
  };
  const chooseStep = (index: number) => {
    if (!flow) return;
    const next = flow.hops[index];
    const id = next.id ?? next.node_id;
    setStepId(id);
    updateUrl(flow.id, id);
  };

  if (state !== 'ready') return <section className="map-state-panel" role={state === 'error' ? 'alert' : 'status'} aria-live="polite" aria-atomic="true">
    <span className="map-state-label">{state === 'loading' ? 'Loading guided paths' : 'Guided paths unavailable'}</span>
    <h2>{state === 'loading' ? 'Preparing the repository flows…' : 'This flow snapshot could not be opened.'}</h2>
    <p>{state === 'loading' ? 'The bundle is being validated before any repository path is shown.' : message}</p>
    {state === 'error' && <div className="map-state-actions"><button type="button" className="quiet-link map-retry" onClick={() => window.location.reload()}>Try again <span aria-hidden="true">↻</span></button><Link className="quiet-link" href={`/explore?${new URLSearchParams({ repository: context.repository ?? '', revision: context.revision ?? '', bundle: bundleId }).toString()}`}>Open Lachesis context <span aria-hidden="true">↗</span></Link></div>}
  </section>;

  if (!flow) return <section className="map-state-panel" role="status"><span className="map-state-label">No guided path in snapshot</span><h2>This repository does not have a flow to read yet.</h2><p>The graph is valid, but its code-understanding projection did not include a request path. Architecture remains available.</p><div className="map-state-actions"><Link className="primary-button" href={`/architecture?${new URLSearchParams({ repository: bundle!.meta.repository, revision: bundle!.meta.revision, bundle: bundleId }).toString()}`}>Open Architecture <span aria-hidden="true">→</span></Link></div></section>;

  const stepKey = activeHop.id ?? activeHop.node_id;
  const explore = `/explore?${new URLSearchParams({ repository: bundle!.meta.repository, revision: bundle!.meta.revision, bundle: bundleId, flow: flow.id, step: stepKey, anchor: activeNode?.label ?? activeHop.caption, ...(activeNode?.module ? { region: activeNode.module } : {}) }).toString()}`;
  return <>
    {flows.length > 1 && <nav className="hosted-flow-index" aria-label="Available guided paths"><span>Choose a path</span><div>{flows.slice(0, 8).map((item) => <button key={item.id} type="button" aria-pressed={item.id === flow.id} onClick={() => chooseFlow(item)}>{flowTitle(item)}</button>)}</div></nav>}
    <section className="guided-flow" aria-labelledby="flow-steps-title">
      <div className="flow-progress"><div><span className="flow-label">Graph-backed path · {flow.hops.length} steps</span><h2 id="flow-steps-title">{flowTitle(flow)}</h2></div><span className="flow-count">{String(activeIndex + 1).padStart(2, '0')} / {String(flow.hops.length).padStart(2, '0')}</span></div>
      <p className="flow-provenance">{flow.description} This is a selected static call path from the exported graph, not proof of one observed runtime execution.</p>
      <ol className="flow-path-map" aria-label="Flow path overview">{flow.hops.map((hop, index) => <li key={hop.id ?? `${hop.node_id}-${index}`} className={index === activeIndex ? 'is-current' : Math.abs(index - activeIndex) === 1 ? 'is-adjacent' : undefined}><button type="button" onClick={() => chooseStep(index)} aria-current={index === activeIndex ? 'step' : undefined}><span>step {index + 1}</span><strong>{hop.caption}</strong></button>{index < flow.hops.length - 1 && <span className="flow-path-connector" aria-hidden="true">→</span>}</li>)}</ol>
      <p className="sr-only" role="status" aria-live="polite">Step {activeIndex + 1} of {flow.hops.length}: {activeHop.caption}.</p>
      <div className="flow-stage" id="flow-step-detail" role="region" aria-labelledby="flow-step-title">
        <div className="flow-stage-track" aria-hidden="true"><span className="flow-stage-fill" style={{ transform: `scaleX(${activeIndex / Math.max(1, flow.hops.length - 1)})` }} /></div>
        <p className="flow-handoff-label">{activeIndex === 0 ? 'path entry' : activeHop.edge_label ? `${activeHop.edge_label} from the previous step` : 'next graph-backed handoff'}</p>
        <h3 id="flow-step-title">{activeHop.caption}</h3>
        <p className="flow-description">{activeNode?.documentation?.trim() || `${activeNode?.kind ?? 'Code element'} in the selected repository path.`}</p>
        <dl className="flow-fields"><div><dt>source</dt><dd><code>{activeNode?.file || 'Source location unavailable'}{activeNode?.line ? `:${activeNode.line}` : ''}</code></dd></div><div><dt>graph role</dt><dd>{activeNode?.kind ?? 'Included path node'}</dd></div>{activeHop.edge_label && <div><dt>incoming relation</dt><dd>{activeHop.edge_label}</dd></div>}</dl>
        <div className="flow-stage-links"><Link className="quiet-link" href={explore}>Open {activeNode?.label ?? activeHop.caption} in Lachesis <span aria-hidden="true">↗</span></Link>{sourceLink && <a className="quiet-link" href={sourceLink} target="_blank" rel="noreferrer">Read source at {activeNode!.file}:{activeNode!.line} <span aria-hidden="true">↗</span></a>}</div>
      </div>
      <div className="flow-controls"><button type="button" onClick={() => chooseStep(Math.max(0, activeIndex - 1))} disabled={activeIndex === 0}>← Previous</button><button type="button" onClick={() => chooseStep(Math.min(flow.hops.length - 1, activeIndex + 1))} disabled={activeIndex === flow.hops.length - 1}>Next →</button></div>
      <details className="flow-linear"><summary>Read all {flow.hops.length} steps as text</summary><ol>{flow.hops.map((hop, index) => { const node = nodeById.get(hop.node_id); return <li key={hop.id ?? `${hop.node_id}-${index}`}><button type="button" className={index === activeIndex ? 'is-current' : undefined} onClick={() => chooseStep(index)} aria-current={index === activeIndex ? 'step' : undefined} aria-controls="flow-step-detail"><strong>{index + 1}. {hop.caption}</strong><span>{node?.documentation?.trim() || `${node?.kind ?? 'Code element'} in ${node?.file || 'the repository graph'}.`}</span><small>{node?.file || 'source unavailable'}{node?.line ? `:${node.line}` : ''}</small></button></li>; })}</ol></details>
      {flow.limitations?.length ? <p className="flow-limitations">Path limitation: {flow.limitations.join(' ')}</p> : null}
    </section>
  </>;
}
