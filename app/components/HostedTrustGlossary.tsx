'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { isLachesisBundle, type BundleFinding, type LachesisBundle } from '../../lib/design-map';
import { loadHostedBundle } from '../../lib/hosted';
import type { SharedSnapshotContext } from '../../lib/view-model';

function findingLabel(finding: BundleFinding, index: number) {
  return finding.display_name?.trim() || `Graph evidence ${String(index + 1).padStart(2, '0')}`;
}

function sourceLink(bundle: LachesisBundle, file?: string, line?: number) {
  const template = bundle.meta.source_url_template;
  if (!template || !file || !line || line < 1) return undefined;
  return template.replaceAll('{revision}', encodeURIComponent(bundle.meta.revision)).replaceAll('{file}', file.split('/').map(encodeURIComponent).join('/')).replaceAll('{line}', String(line)).replaceAll('{end_line}', String(line));
}

export function HostedTrustGlossary({ bundleId, context, initialQuery = '' }: { bundleId: string; context: SharedSnapshotContext; initialQuery?: string }) {
  const [bundle, setBundle] = useState<LachesisBundle>();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    loadHostedBundle(bundleId, controller.signal).then((value) => {
      if (!isLachesisBundle(value)) throw new Error('This hosted trust bundle does not match the supported code-understanding contract.');
      setBundle(value);
      setState('ready');
    }).catch((error) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setMessage(error instanceof Error ? error.message : 'This trust bundle could not be loaded.');
      setState('error');
    });
    return () => controller.abort();
  }, [bundleId]);

  useEffect(() => {
    const restore = () => setQuery(new URLSearchParams(window.location.search).get('q') ?? '');
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);

  const findings = bundle?.security?.findings ?? [];
  const nodes = useMemo(() => new Map((bundle?.graph.nodes ?? []).map((node) => [node.id, node])), [bundle]);
  const filtered = findings.filter((finding, index) => {
    const needle = query.trim().toLowerCase();
    return !needle || [findingLabel(finding, index), finding.result_summary ?? '', ...(finding.analysis?.limitations ?? [])].join(' ').toLowerCase().includes(needle);
  });
  // Named security surfaces lead; findings the exporter flagged low_signal (a
  // traceback local, a bare file handle, an anonymous callback) sink to the
  // bottom so "what needs a closer read" is not headed by internal artifacts.
  // Array sort is stable, so the exporter's order is preserved within each band.
  const ordered = [...filtered].sort((a, b) => Number(a.low_signal ?? false) - Number(b.low_signal ?? false));
  const demotedCount = findings.reduce((total, finding) => total + (finding.low_signal ? 1 : 0), 0);
  const updateQuery = (value: string) => {
    setQuery(value);
    const params = new URLSearchParams(window.location.search);
    value ? params.set('q', value) : params.delete('q');
    window.history.replaceState(null, '', `/trust${params.toString() ? `?${params.toString()}` : ''}`);
  };

  if (state !== 'ready') return <section className="map-state-panel" role={state === 'error' ? 'alert' : 'status'} aria-live="polite" aria-atomic="true"><span className="map-state-label">{state === 'loading' ? 'Loading trust evidence' : 'Trust evidence unavailable'}</span><h2>{state === 'loading' ? 'Preparing the evidence index…' : 'This trust snapshot could not be opened.'}</h2><p>{state === 'loading' ? 'The bundle is being validated before any graph evidence appears.' : message}</p>{state === 'error' && <div className="map-state-actions"><button type="button" className="quiet-link map-retry" onClick={() => window.location.reload()}>Try again <span aria-hidden="true">↻</span></button><Link className="quiet-link" href={`/explore?${new URLSearchParams({ repository: context.repository ?? '', revision: context.revision ?? '', bundle: bundleId }).toString()}`}>Open Lachesis context <span aria-hidden="true">↗</span></Link></div>}</section>;

  return <section className="hosted-trust" aria-label="Graph-backed trust evidence"><div className="trust-intro"><h2>Read the evidence, then inspect the obligation.</h2><p>This snapshot exports {findings.length.toLocaleString()} graph evidence item{findings.length === 1 ? '' : 's'}. Presence marks a place to investigate; it is not an adjudicated vulnerability or a security score.</p></div><div className="trust-tools"><label htmlFor="hosted-trust-search">Find evidence</label><input id="hosted-trust-search" type="search" value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Search exported path names…" /></div><div className="trust-result-count" role="status" aria-live="polite" aria-atomic="true">{filtered.length} of {findings.length} evidence items{demotedCount > 0 ? ` · ${demotedCount} lower-signal item${demotedCount === 1 ? '' : 's'} demoted` : ''}</div>{filtered.length ? <div className="trust-domain-list">{ordered.map((finding) => { const index = findings.indexOf(finding); const steps = finding.witness?.steps ?? []; const firstNode = steps[0] ? nodes.get(steps[0].node_id) : undefined; const lastNode = steps.at(-1) ? nodes.get(steps.at(-1)!.node_id) : undefined; const anchor = firstNode?.label ?? lastNode?.label ?? findingLabel(finding, index); const handoff = `/explore?${new URLSearchParams({ repository: bundle!.meta.repository, revision: bundle!.meta.revision, bundle: bundleId, anchor, domain: finding.finding_id ?? findingLabel(finding, index), ...(firstNode?.module ? { region: firstNode.module } : {}) }).toString()}`; const source = sourceLink(bundle!, firstNode?.file, firstNode?.line); const atroposHref = finding.semantic?.provider === 'atropos' && finding.semantic.model_id ? `https://atropos.unboundcompute.com/search?q=${encodeURIComponent(finding.semantic.model_id)}` : undefined; return <article className={`trust-domain hosted-trust-item${finding.low_signal ? ' trust-low-signal' : ''}`} key={finding.finding_id ?? `${anchor}-${index}`}><div className="trust-domain-index"><span>{String(index + 1).padStart(2, '0')}</span><small>{finding.low_signal ? 'lower signal · internal surface' : finding.analysis?.confidence ? `confidence · ${finding.analysis.confidence}` : 'graph evidence'}</small></div><div><h2>{findingLabel(finding, index)}</h2><p className="trust-meaning">{finding.result_summary?.trim() || 'The exporter identified a source-backed path worth reading in context.'}</p><p className="trust-obligation"><strong>Interpretation</strong><span>Inspect the source and guards before deciding whether this represents a defect.</span></p>{finding.semantic?.model_id && <p className="trust-semantic">Atropos model <code>{finding.semantic.model_id}</code>{finding.semantic.access_path ? ` · watches ${finding.semantic.access_path}` : ''}</p>}{steps.length > 0 && <div className="trust-families">{steps.map((step, stepIndex) => <code key={`${step.node_id}-${stepIndex}`}>{nodes.get(step.node_id)?.label ?? step.node_id}</code>)}</div>}<div className="trust-meta"><code>{firstNode?.file || 'source location unavailable'}{firstNode?.line ? `:${firstNode.line}` : ''}{lastNode && lastNode.id !== firstNode?.id ? ` → ${lastNode.file}:${lastNode.line}` : ''}</code><Link className="quiet-link" href={handoff}>Inspect this path in Lachesis <span aria-hidden="true">↗</span></Link>{atroposHref && <a className="quiet-link" href={atroposHref} target="_blank" rel="noreferrer">Inspect Atropos fact <span aria-hidden="true">↗</span></a>}{source && <a className="quiet-link" href={source} target="_blank" rel="noreferrer">Read source <span aria-hidden="true">↗</span></a>}</div>{finding.analysis?.limitations?.length ? <p className="trust-nonclaim">Exporter limitation: {finding.analysis.limitations.join(' ')}</p> : <p className="trust-nonclaim">Presence marks a place to investigate; it does not establish exploitability or a finding.</p>}</div></article>; })}</div> : <p className="trust-empty">No exported evidence matches “{query}”. Try a broader term.</p>}{findings.length === 0 && <p className="trust-empty">This valid snapshot contains no exported security evidence. That is not a claim that the repository is free of security issues; it means this projection has no items to display.</p>}</section>;
}
