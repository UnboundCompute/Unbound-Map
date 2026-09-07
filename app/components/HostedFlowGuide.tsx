'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { isLachesisBundle, projectTopLevelRegions, toDesignMapSnapshot, type BundleRequestPath, type LachesisBundle } from '../../lib/design-map';
import { loadHostedBundle } from '../../lib/hosted';
import { snapshotFromProjection, sourceHref, type SharedSnapshotContext } from '../../lib/view-model';
import { trackEvent } from '../../lib/analytics';

function publishSnapshot(bundle: LachesisBundle) {
  const projection = toDesignMapSnapshot(bundle);
  const snapshot = snapshotFromProjection(projection, projectTopLevelRegions(projection));
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
    includedNodes: snapshot.includedNodes,
  } }));
}

// Neutral, library-appropriate framing (H14): a call/execution path, not a
// "request lifecycle" or "journey" — for a library the entry is the compiler
// walking an AST, not an HTTP request.
function flowDescription(description: string) {
  return description.replace(/^request lifecycle\b/i, 'Call path');
}
function flowTitle(path: BundleRequestPath) {
  const description = path.description.trim();
  if (description && !/^request lifecycle from\b/i.test(description)) return description.replace(/[.]$/, '');
  const first = path.hops[0]?.caption || path.id.replace(/^request[.:_-]*/, '').replace(/[._-]+/g, ' ');
  return `${first} call path`;
}

function regionForNode(bundle: LachesisBundle, nodeId: string) {
  // Projection ownership follows the adapter's deterministic last-authored
  // concept assignment for intentionally overlapping concepts.
  const concept = bundle.graph.concepts?.filter((item) => item.node_ids.includes(nodeId)).at(-1);
  if (concept) return concept.id;
  return bundle.graph.modules?.find((item) => item.node_ids?.includes(nodeId))?.id;
}

function readableEntrypoint(entry: { label: string }) {
  return !/^(?:<)?anonymous(?:@|>|$)/i.test(entry.label.trim());
}

export function HostedFlowGuide({ bundleId, context, initialFlow, initialStep, route = '/flows' }: { bundleId: string; context: SharedSnapshotContext; initialFlow?: string; initialStep?: string; route?: string }) {
  const [bundle, setBundle] = useState<LachesisBundle>();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [flowId, setFlowId] = useState(initialFlow ?? '');
  const [stepId, setStepId] = useState(initialStep ?? '');
  const [artifactState, setArtifactState] = useState<'idle' | 'copied' | 'failed'>('idle');

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
    if (state === 'ready' && bundle) trackEvent('artifact_viewed', { surface: route.startsWith('/f/') ? 'flow_card' : 'flow_guide' });
  }, [bundle, route, state]);

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
  const moduleByNodeId = useMemo(() => new Map((bundle?.graph.modules ?? []).flatMap((module) => (module.node_ids ?? []).map((nodeId) => [nodeId, module.id] as const))), [bundle]);
  const activeIndex = Math.max(0, flow?.hops.findIndex((hop) => (hop.id ?? hop.node_id) === stepId) ?? 0);
  const activeHop = flow?.hops[activeIndex];
  const activeNode = activeHop ? nodeById.get(activeHop.node_id) : undefined;
  const flowModuleCount = flow ? new Set(flow.hops.map((hop) => moduleByNodeId.get(hop.node_id) ?? nodeById.get(hop.node_id)?.module).filter(Boolean)).size : 0;
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
  if (!bundle) return null;

  const stepKey = activeHop.id ?? activeHop.node_id;
  const explore = `/explore?${new URLSearchParams({ repository: bundle!.meta.repository, revision: bundle!.meta.revision, bundle: bundleId, flow: flow.id, step: stepKey, anchor: activeNode?.label ?? activeHop.caption, ...((activeNode?.module ?? regionForNode(bundle!, activeHop.node_id)) ? { region: activeNode?.module ?? regionForNode(bundle!, activeHop.node_id) } : {}) }).toString()}`;
  const flowLabel = flowTitle(flow);
  const artifactMarkdown = `## ${flowLabel}\n\nRepository: ${bundle.meta.repository}\nRevision: ${bundle.meta.revision}\nSteps: ${flow.hops.length}\nModules represented: ${flowModuleCount || 'not reported'}\nEvidence confidence: ${flow.confidence || 'not reported'}\n\n${flowDescription(flow.description)}\n\n${flow.hops.map((hop, index) => `${index + 1}. ${hop.caption}`).join('\n')}\n\nEvidence: graph-backed projection. This is not proof of one observed runtime execution.\n\nOpen the interactive flow: ${typeof window === 'undefined' ? route : window.location.href}`;
  const artifactImage = `/opengraph-image?${new URLSearchParams({ repository: bundle.meta.repository, revision: bundle.meta.revision, bundle: bundleId, flow: flowLabel }).toString()}`;
  const immutableArtifactHref = `/f/${encodeURIComponent(bundleId)}/${encodeURIComponent(flow.id)}`;
  async function copyArtifact(value: string) {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const field = document.createElement('textarea');
        field.value = value;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        if (!document.execCommand('copy')) throw new Error('Clipboard unavailable');
        field.remove();
      }
      setArtifactState('copied');
      trackEvent('artifact_created', { format: value === immutableArtifactHref ? 'link' : 'markdown' });
      window.setTimeout(() => setArtifactState('idle'), 1800);
    } catch {
      setArtifactState('failed');
      window.setTimeout(() => setArtifactState('idle'), 2600);
    }
  }
  return <>
    {bundle.graph.entrypoints?.filter(readableEntrypoint).length ? <section className="hosted-entrypoints" aria-labelledby="hosted-entrypoints-title"><div><span className="flow-label">Repository entrypoints</span><h2 id="hosted-entrypoints-title">Begin with a real boundary.</h2><p>These exported places are intended starting points for reading the repository.</p></div><ul>{bundle.graph.entrypoints.filter(readableEntrypoint).slice(0, 8).map((entry) => { const region = regionForNode(bundle!, entry.node_id); const href = `/explore?${new URLSearchParams({ repository: bundle!.meta.repository, revision: bundle!.meta.revision, bundle: bundleId, anchor: entry.label, ...(region ? { region } : {}) }).toString()}`; const source = sourceHref({ sourceUrlTemplate: bundle!.meta.source_url_template, revision: bundle!.meta.revision }, entry.file, entry.line); return <li key={entry.id}><div><strong>{entry.label}</strong><small>{entry.kind} · {entry.file}{entry.line ? `:${entry.line}` : ''}</small></div><span>{source && <a className="quiet-link" href={source} target="_blank" rel="noreferrer">Source <span aria-hidden="true">↗</span></a>}<Link className="quiet-link" href={href}>Open in Lachesis <span aria-hidden="true">↗</span></Link></span></li>; })}</ul></section> : null}
    {flows.length > 1 && <nav className="hosted-flow-index" aria-label="Available guided paths"><span>Choose a path</span><div>{flows.slice(0, 8).map((item) => <button key={item.id} type="button" aria-pressed={item.id === flow.id} onClick={() => chooseFlow(item)}>{flowTitle(item)}</button>)}</div></nav>}
    <section className="guided-flow" aria-labelledby="flow-steps-title">
      <div className="flow-progress"><div><span className="flow-label">Graph-backed path · {flow.hops.length} steps</span><h2 id="flow-steps-title">{flowLabel}</h2><p className="flow-snapshot-meta">{bundle.meta.repository} · revision {bundle.meta.revision}</p></div><div className="flow-progress-side"><span className="flow-count">{String(activeIndex + 1).padStart(2, '0')} / {String(flow.hops.length).padStart(2, '0')}</span><div className="flow-artifact-actions" aria-label="Share this flow"><button type="button" onClick={() => void copyArtifact(immutableArtifactHref)}>{artifactState === 'copied' ? 'Link copied' : artifactState === 'failed' ? 'Copy failed' : 'Copy link'}</button><a href={immutableArtifactHref}>Open flow card ↗</a><button type="button" onClick={() => void copyArtifact(artifactMarkdown)}>Copy Markdown</button><a href={artifactImage} target="_blank" rel="noreferrer">Open social card ↗</a></div></div></div>
      <p className="flow-provenance">{flowDescription(flow.description)} This is a selected static call path from the exported graph, not proof of one observed runtime execution.</p>
      <dl className="flow-fields flow-summary" aria-label="Flow evidence summary"><div><dt>total steps</dt><dd>{flow.hops.length}</dd></div><div><dt>modules represented</dt><dd>{flowModuleCount || 'Not reported'}</dd></div><div><dt>evidence confidence</dt><dd>{flow.confidence || 'Not reported'}</dd></div></dl>
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
    <section className="flow-next" aria-labelledby="flow-next-title"><span className="flow-label">Continue exploring</span><h2 id="flow-next-title">Map another repository.</h2><p>Start a new graph-backed architecture guide when you are ready to compare another codebase.</p><Link className="quiet-link" href="/" onClick={() => trackEvent('artifact_conversion', { action: 'map_another_repository' })}>Choose a repository <span aria-hidden="true">→</span></Link></section>
  </>;
}
