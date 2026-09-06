'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { isLachesisBundle, type BundleFinding, type LachesisBundle } from '../../lib/design-map';
import { casefileFamilies, casefileLabel } from '../../lib/casefiles';
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

function markdownCell(value: string | undefined) {
  return (value?.trim() || 'Not reported').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function witnessMarkdown(bundle: LachesisBundle, bundleId: string, finding: BundleFinding, index: number, nodes: ReadonlyMap<string, LachesisBundle['graph']['nodes'][number]>) {
  const steps = finding.witness?.steps ?? [];
  const first = steps[0] ? nodes.get(steps[0].node_id) : undefined;
  const last = steps.at(-1) ? nodes.get(steps.at(-1)!.node_id) : undefined;
  const status = finding.low_signal ? 'Graph evidence · lower-signal internal surface' : 'Graph evidence · investigation required';
  const semantic = finding.semantic;
  const lines = [
    `# Security Witness — ${findingLabel(finding, index)}`,
    '',
    `> ${status}. This is a lead requiring investigation, not a confirmed vulnerability.`,
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| Repository | ${markdownCell(bundle.meta.repository)} |`,
    `| Revision | \`${markdownCell(bundle.meta.revision)}\` |`,
    `| Bundle | \`${markdownCell(bundleId)}\` · ${markdownCell(bundle.meta.generated_at)} |`,
    `| Witness length | ${steps.length} step${steps.length === 1 ? '' : 's'} |`,
    `| Confidence | ${markdownCell(finding.analysis?.confidence)} |`,
    `| Source | ${markdownCell(first?.label)} · ${markdownCell(first?.file)}${first?.line ? `:${first.line}` : ''} |`,
    `| Sink | ${markdownCell(last?.label)} · ${markdownCell(last?.file)}${last?.line ? `:${last.line}` : ''} |`,
    `| Atropos model | ${markdownCell(semantic?.model_id)} |`,
    `| Watched access path | ${markdownCell(semantic?.access_path)} |`,
    `| Semantic role | ${markdownCell(semantic?.role)} |`,
    `| CWE | ${markdownCell(semantic?.cwe?.join(', '))} |`,
    '| Guard state | Not reported by this projection |',
    '',
    '## Summary',
    '',
    finding.result_summary?.trim() || 'The exporter identified a source-backed path worth reading in context.',
    '',
    '## Witness steps',
    '',
    ...(steps.length ? steps.map((step, stepIndex) => {
      const node = nodes.get(step.node_id);
      const location = node ? `${node.file}${node.line ? `:${node.line}` : ''}` : 'source location unavailable';
      return `${stepIndex + 1}. **${markdownCell(node?.label ?? step.node_id)}** — ${markdownCell(step.role)} · ${location}${step.note ? ` — ${markdownCell(step.note)}` : ''}`;
    }) : ['No witness steps were exported.']),
    '',
    '## Limitations',
    '',
    ...(finding.analysis?.limitations?.length ? finding.analysis.limitations.map((limitation) => `- ${limitation}`) : ['- Presence marks a place to investigate; it does not establish exploitability or a finding.']),
    '',
    `Generated from the validated Lachesis bundle at revision ${bundle.meta.revision}.`,
  ];
  return lines.join('\n');
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const field = document.createElement('textarea');
  field.value = value;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  if (!copied) throw new Error('Clipboard unavailable');
}

export function HostedTrustGlossary({ bundleId, context, initialQuery = '', route = '/trust' }: { bundleId: string; context: SharedSnapshotContext; initialQuery?: string; route?: string }) {
  const [bundle, setBundle] = useState<LachesisBundle>();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState(initialQuery);
  const [artifactState, setArtifactState] = useState<string | null>(null);

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
    return !needle || [finding.finding_id ?? '', findingLabel(finding, index), finding.result_summary ?? '', ...(finding.analysis?.limitations ?? [])].join(' ').toLowerCase().includes(needle);
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
    window.history.replaceState(null, '', `${route}${params.toString() ? `?${params.toString()}` : ''}`);
  };
  const saveWitness = async (finding: BundleFinding, index: number, mode: 'copy' | 'download') => {
    if (!bundle) return;
    const key = finding.finding_id ?? `${index}`;
    try {
      const markdown = witnessMarkdown(bundle, bundleId, finding, index, nodes);
      if (mode === 'copy') {
        await copyText(markdown);
      } else {
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const slug = findingLabel(finding, index).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'security-witness';
        link.href = url;
        link.download = `${slug}-witness.md`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }
      setArtifactState(`${mode}:${key}`);
      window.setTimeout(() => setArtifactState((current) => current === `${mode}:${key}` ? null : current), 2200);
    } catch {
      setArtifactState(`failed:${key}`);
      window.setTimeout(() => setArtifactState((current) => current === `failed:${key}` ? null : current), 2600);
    }
  };

  if (state !== 'ready') return <section className="map-state-panel" role={state === 'error' ? 'alert' : 'status'} aria-live="polite" aria-atomic="true"><span className="map-state-label">{state === 'loading' ? 'Loading trust evidence' : 'Trust evidence unavailable'}</span><h2>{state === 'loading' ? 'Preparing the evidence index…' : 'This trust snapshot could not be opened.'}</h2><p>{state === 'loading' ? 'The bundle is being validated before any graph evidence appears.' : message}</p>{state === 'error' && <div className="map-state-actions"><button type="button" className="quiet-link map-retry" onClick={() => window.location.reload()}>Try again <span aria-hidden="true">↻</span></button><Link className="quiet-link" href={`/explore?${new URLSearchParams({ repository: context.repository ?? '', revision: context.revision ?? '', bundle: bundleId }).toString()}`}>Open Lachesis context <span aria-hidden="true">↗</span></Link></div>}</section>;

  return <><section className="hosted-trust" aria-label="Graph-backed trust evidence"><div className="trust-intro"><h2>Read the evidence, then inspect the obligation.</h2><p>This snapshot exports {findings.length.toLocaleString()} graph evidence item{findings.length === 1 ? '' : 's'}. Presence marks a place to investigate; it is not an adjudicated vulnerability or a security score.</p></div><div className="trust-tools"><label htmlFor="hosted-trust-search">Find evidence</label><input id="hosted-trust-search" type="search" value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Search exported path names…" /></div><div className="trust-result-count" role="status" aria-live="polite" aria-atomic="true">{filtered.length} of {findings.length} evidence items{demotedCount > 0 ? ` · ${demotedCount} lower-signal item${demotedCount === 1 ? '' : 's'} demoted` : ''}</div>{filtered.length ? <div className="trust-domain-list">{ordered.map((finding) => { const index = findings.indexOf(finding); const steps = finding.witness?.steps ?? []; const firstNode = steps[0] ? nodes.get(steps[0].node_id) : undefined; const lastNode = steps.at(-1) ? nodes.get(steps.at(-1)!.node_id) : undefined; const anchor = firstNode?.label ?? lastNode?.label ?? findingLabel(finding, index); const handoff = `/explore?${new URLSearchParams({ repository: bundle!.meta.repository, revision: bundle!.meta.revision, bundle: bundleId, anchor, domain: finding.finding_id ?? findingLabel(finding, index), ...(firstNode?.module ? { region: firstNode.module } : {}) }).toString()}`; const shareHref = finding.finding_id ? `/w/${encodeURIComponent(bundleId)}/${encodeURIComponent(finding.finding_id)}` : `/trust?${new URLSearchParams({ repository: bundle!.meta.repository, revision: bundle!.meta.revision, bundle: bundleId, q: findingLabel(finding, index) }).toString()}`; const source = sourceLink(bundle!, firstNode?.file, firstNode?.line); const atroposParams = finding.semantic?.provider === 'atropos' && finding.semantic.model_id ? new URLSearchParams({ q: finding.semantic.model_id, repository: bundle!.meta.repository, revision: bundle!.meta.revision, bundle: bundleId }) : undefined; const atroposHref = atroposParams ? `https://atropos.unboundcompute.com/search?${atroposParams.toString()}` : undefined; const casefiles = finding.semantic?.model_id ? casefileFamilies[finding.semantic.model_id] ?? [] : []; const artifactKey = finding.finding_id ?? `${index}`; return <article className={`trust-domain hosted-trust-item${finding.low_signal ? ' trust-low-signal' : ''}`} key={finding.finding_id ?? `${anchor}-${index}`}><div className="trust-domain-index"><span>{String(index + 1).padStart(2, '0')}</span><small>{finding.low_signal ? 'lower signal · internal surface' : finding.analysis?.confidence ? `confidence · ${finding.analysis.confidence}` : 'graph evidence'}</small></div><div><h2>{findingLabel(finding, index)}</h2><p className="trust-meaning">{finding.result_summary?.trim() || 'The exporter identified a source-backed path worth reading in context.'}</p><p className="trust-obligation"><strong>Interpretation</strong><span>Inspect the source and guards before deciding whether this represents a defect.</span></p>{finding.semantic?.model_id && <p className="trust-semantic">Atropos model <code>{finding.semantic.model_id}</code>{finding.semantic.access_path ? ` · watches ${finding.semantic.access_path}` : ''}</p>}{steps.length > 0 && <div className="trust-families">{steps.map((step, stepIndex) => <code key={`${step.node_id}-${stepIndex}`}>{nodes.get(step.node_id)?.label ?? step.node_id}</code>)}</div>}<div className="trust-meta"><code>{firstNode?.file || 'source location unavailable'}{firstNode?.line ? `:${firstNode.line}` : ''}{lastNode && lastNode.id !== firstNode?.id ? ` → ${lastNode.file}:${lastNode.line}` : ''}</code><Link className="quiet-link" href={handoff}>Inspect this path in Lachesis <span aria-hidden="true">↗</span></Link>{atroposHref && <a className="quiet-link" href={atroposHref} target="_blank" rel="noreferrer">Inspect Atropos fact <span aria-hidden="true">↗</span></a>}{casefiles.map((path) => <a className="quiet-link" href={`https://trace.unboundcompute.com${path}`} target="_blank" rel="noreferrer" key={path}>Read {casefileLabel(path)} <span aria-hidden="true">↗</span></a>)}{source && <a className="quiet-link" href={source} target="_blank" rel="noreferrer">Read source <span aria-hidden="true">↗</span></a>}<Link className="quiet-link" href={shareHref}>Share evidence view <span aria-hidden="true">↗</span></Link><button type="button" className="quiet-link" onClick={() => void saveWitness(finding, index, 'copy')}>{artifactState === `copy:${artifactKey}` ? 'Witness copied' : artifactState === `failed:${artifactKey}` ? 'Artifact failed' : 'Copy witness'}</button><button type="button" className="quiet-link" onClick={() => void saveWitness(finding, index, 'download')}>{artifactState === `download:${artifactKey}` ? 'Witness saved' : 'Download witness'}</button></div>{finding.analysis?.limitations?.length ? <p className="trust-nonclaim">Exporter limitation: {finding.analysis.limitations.join(' ')}</p> : <p className="trust-nonclaim">Presence marks a place to investigate; it does not establish exploitability or a finding.</p>}</div></article>; })}</div> : <p className="trust-empty">No exported evidence matches “{query}”. Try a broader term.</p>}{findings.length === 0 && <p className="trust-empty">This valid snapshot contains no exported security evidence. That is not a claim that the repository is free of security issues; it means this projection has no items to display.</p>}</section><section className="flow-next" aria-labelledby="trust-next-title"><span className="flow-label">Continue investigating</span><h2 id="trust-next-title">Open the exact graph context.</h2><p>Trust evidence marks a place to read. Lachesis holds the source-level path and guards; Map can start a fresh repository snapshot when you are ready.</p><div className="flow-stage-links"><Link className="quiet-link" href={`/explore?${new URLSearchParams({ repository: context.repository ?? bundle?.meta.repository ?? '', revision: context.revision ?? bundle?.meta.revision ?? '', bundle: bundleId }).toString()}`}>Open Lachesis context <span aria-hidden="true">↗</span></Link><Link className="quiet-link" href="/">Map another repository <span aria-hidden="true">→</span></Link></div></section></>;
}
