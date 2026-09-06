'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { repositoryRefError, repositoryUrlError } from '../../lib/repository-intake';
import { pollDelayMilliseconds, retryAfterMilliseconds } from '../../lib/build-polling';
import { boundedJson } from '../../lib/response-bounds';

type CachedRepo = { repository?: string; git_url?: string; ref?: string; revision?: string; bundle_id?: string };
type BuildStatus = { status?: string; bundle_id?: string; sha?: string; error?: { message?: string } };
type BuildSubmission = { job_id?: string; error?: { message?: string } };
type BuildCancellation = { status?: string; error?: { message?: string } };
const BUILD_STAGES = [
  ['fetching', 'Fetch repository'],
  ['inventory_ready', 'Inventory files'],
  ['graph_building', 'Build code graph'],
  ['graph_ready', 'Resolve relationships'],
  ['semantics_enriching', 'Attach security semantics'],
  ['map_generating', 'Select readable architecture'],
  ['artifacts_rendering', 'Prepare shareable artifacts'],
] as const;
const BUILD_STAGE_ALIASES: Record<string, number> = {
  submitted: 0, queued: 0, validating: 0, validated: 0, fetching: 0,
  inventory_ready: 1, graph_building: 2, graph_ready: 3,
  semantics_enriching: 4, map_generating: 5, artifacts_rendering: 6,
};
// Call this app's own origin: the bundle API sends no CORS headers, so the
// browser cannot reach it directly. The `/api/*` rewrite in next.config.mjs
// forwards these requests to the bundle API server-side.
function api(path: string) { return path; }
function repoLabel(repo: CachedRepo) { return (repo.repository || repo.git_url || 'Repository').replace(/^https?:\/\//, '').replace(/\.git$/, ''); }
function openSnapshot(repo: CachedRepo, sourceFile?: string, sourceLine?: string) { window.location.href = `/?${new URLSearchParams({ repository: repoLabel(repo), revision: repo.revision || repo.ref || 'main', bundle: repo.bundle_id!, ...(sourceFile ? { source_file: sourceFile } : {}), ...(sourceLine ? { source_line: sourceLine } : {}) }).toString()}`; }
function wait(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve(); }, milliseconds);
    function onAbort() { window.clearTimeout(timer); reject(new DOMException('Polling cancelled', 'AbortError')); }
    if (signal.aborted) onAbort();
    else signal.addEventListener('abort', onAbort, { once: true });
  });
}
async function waitUntilVisible(signal: AbortSignal) {
  while (document.visibilityState === 'hidden') {
    await new Promise<void>((resolve, reject) => {
      function onVisibility() { document.removeEventListener('visibilitychange', onVisibility); signal.removeEventListener('abort', onAbort); resolve(); }
      function onAbort() { document.removeEventListener('visibilitychange', onVisibility); reject(new DOMException('Polling cancelled', 'AbortError')); }
      if (signal.aborted) onAbort();
      else { document.addEventListener('visibilitychange', onVisibility, { once: true }); signal.addEventListener('abort', onAbort, { once: true }); }
    });
  }
}

export function RepositoryLauncher({ initialRepository, initialRef, initialSourceFile, initialSourceLine }: { initialRepository?: string; initialRef?: string; initialSourceFile?: string; initialSourceLine?: string } = {}) {
  const [repos, setRepos] = useState<CachedRepo[]>([]); const [catalogState, setCatalogState] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [url, setUrl] = useState(initialRepository ? `https://github.com/${initialRepository.replace(/^https?:\/\//, '').replace(/^github\.com\//, '').replace(/\.git$/, '')}` : ''); const [ref, setRef] = useState(initialRef || 'main'); const [buildState, setBuildState] = useState<'idle' | 'building' | 'error'>('idle'); const [message, setMessage] = useState(''); const [buildStatus, setBuildStatus] = useState('submitted');
  const [contextStatus, setContextStatus] = useState<'idle' | 'checking' | 'not-found' | 'error'>('idle');
  const buildController = useRef<AbortController | null>(null);
  const activeJobId = useRef<string | null>(null);
  useEffect(() => { const controller = new AbortController(); fetch(api('/api/repos'), { headers: { Accept: 'application/json' }, signal: controller.signal }).then((response) => { if (!response.ok) throw new Error('Repository catalog is unavailable right now.'); return boundedJson<{ repositories?: CachedRepo[] }>(response); }).then((body) => { const next = Array.isArray(body?.repositories) ? body.repositories : []; setRepos(next); setCatalogState(next.length ? 'ready' : 'empty'); }).catch((error) => { if (error.name !== 'AbortError') { setCatalogState('error'); setMessage(error instanceof Error ? error.message : 'Repository catalog is unavailable right now.'); } }); return () => controller.abort(); }, []);
  useEffect(() => {
    if (!initialRepository) return;
    const cleaned = initialRepository.replace(/^https?:\/\//, '').replace(/\.git$/, '');
    const parts = cleaned.split('/').filter(Boolean);
    if (parts.length < 2) { setContextStatus('not-found'); return; }
    const host = parts.length >= 3 ? parts[0] : 'github.com';
    const owner = parts.length >= 3 ? parts[1] : parts[0];
    const name = parts.length >= 3 ? parts[2] : parts[1];
    const params = initialRef ? `?revision=${encodeURIComponent(initialRef)}` : '';
    const controller = new AbortController();
    setContextStatus('checking');
    fetch(api(`/api/repos/${encodeURIComponent(host)}/${encodeURIComponent(owner)}/${encodeURIComponent(name)}${params}`), { headers: { Accept: 'application/json' }, signal: controller.signal })
      .then((response) => { if (response.status === 404) return null; if (!response.ok) throw new Error('The indexed repository could not be checked.'); return boundedJson<CachedRepo>(response); })
      .then((record) => { if (record?.bundle_id) { openSnapshot(record, initialSourceFile, initialSourceLine); return; } setContextStatus('not-found'); })
      .catch((error) => { if (error.name !== 'AbortError') setContextStatus('error'); });
    return () => controller.abort();
  }, [initialRef, initialRepository]);
  const urlError = useMemo(() => repositoryUrlError(url), [url]);
  const refError = useMemo(() => repositoryRefError(ref), [ref]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (urlError || refError) { setBuildState('error'); setMessage(urlError || refError || 'Check the repository details and try again.'); return; }
    buildController.current?.abort();
    const controller = new AbortController();
    buildController.current = controller;
    setBuildState('building'); setBuildStatus('submitted'); setMessage('Starting the repository build…');
    try {
      const response = await fetch(api('/api/build'), { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ git_url: url.trim(), ref: ref.trim() || 'main' }), signal: controller.signal });
      const body = await boundedJson<BuildSubmission>(response);
      if (!response.ok || !body?.job_id) throw new Error(body?.error?.message || 'The hosted build could not be started.');
      activeJobId.current = body.job_id;
      const pollingDeadline = Date.now() + 15 * 60 * 1000;
      for (let attempt = 0; attempt < 180; attempt += 1) {
        const remaining = pollingDeadline - Date.now();
        if (remaining <= 0) throw new Error('The build is still running. Try the cached repository list in a few minutes.');
        await waitUntilVisible(controller.signal);
        await wait(Math.min(pollDelayMilliseconds(attempt, undefined, Math.floor(Math.random() * 251)), remaining), controller.signal);
        const statusResponse = await fetch(api(`/api/build/${encodeURIComponent(body.job_id)}`), { headers: { Accept: 'application/json' }, signal: controller.signal });
        if (!statusResponse.ok && [429, 500, 502, 503, 504].includes(statusResponse.status)) {
          const retryAfter = retryAfterMilliseconds(statusResponse.headers.get('retry-after'));
          if (retryAfter != null) {
            await waitUntilVisible(controller.signal);
            await wait(Math.min(pollDelayMilliseconds(attempt, retryAfter), pollingDeadline - Date.now()), controller.signal);
            continue;
          }
        }
        const status = await boundedJson<BuildStatus>(statusResponse);
        if (!statusResponse.ok) throw new Error(status?.error?.message || 'The build status could not be read.');
        if (status.status === 'ready' && status.bundle_id) { activeJobId.current = null; openSnapshot({ repository: url.trim(), revision: status.sha || ref.trim() || 'main', bundle_id: status.bundle_id }, initialSourceFile, initialSourceLine); return; }
        if (['error', 'expired', 'cancelled', 'too_large', 'unsupported_language'].includes(status.status || '')) { activeJobId.current = null; throw new Error(status?.error?.message || `The build stopped with status: ${status.status}.`); }
        setBuildStatus(status.status || 'submitted');
        const stage = BUILD_STAGE_ALIASES[status.status || ''] ?? 0;
        setMessage(`${BUILD_STAGES[stage]?.[1] ?? 'Build repository'}…`);
      }
      throw new Error('The build is still running. Try the cached repository list in a few minutes.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      if (!(error instanceof DOMException && error.name === 'AbortError')) { activeJobId.current = null; setBuildState('error'); setMessage(error instanceof Error ? error.message : 'The hosted build could not be started.'); }
    } finally {
      if (buildController.current === controller) buildController.current = null;
    }
  }
  const activeStage = BUILD_STAGE_ALIASES[buildStatus] ?? 0;
  async function stopWaiting() {
    const jobId = activeJobId.current;
    buildController.current?.abort();
    activeJobId.current = null;
    setBuildState('idle');
    setBuildStatus('submitted');
    setMessage(jobId ? 'Cancelling the server build…' : 'Stopped waiting. The current bundle was kept.');
    if (!jobId) return;
    try {
      const response = await fetch(api(`/api/build/${encodeURIComponent(jobId)}/cancel`), { method: 'POST', headers: { Accept: 'application/json' } });
      const body = await boundedJson<BuildCancellation>(response);
      if (!response.ok) throw new Error(body?.error?.message || 'The server build could not be cancelled.');
      setMessage(body.status === 'cancelled' ? 'Hosted build cancelled. The current bundle was kept.' : `The hosted build is already ${body.status || 'finished'}.`);
    } catch (error) {
      setMessage(`${error instanceof Error ? error.message : 'The server build could not be cancelled.'} The current bundle was kept.`);
    }
  }
  return <section className="launcher" aria-label="Repository selection"><div className="launcher-grid"><form className="launcher-card launcher-form" onSubmit={submit}><div className="launcher-card-top"><span className="launcher-tag">Generate a new map</span></div><h3>Enter a repository URL</h3><p>Paste a public repository URL. Lachesis will build its graph-backed snapshot, then open the existing map and documentation.</p>{contextStatus === 'checking' && <p className="launcher-context" role="status">Checking for an indexed snapshot of this repository…</p>}{contextStatus === 'not-found' && initialRepository && <p className="launcher-context" role="status">No published snapshot was found for this ref. The build form is ready below.</p>}{contextStatus === 'error' && <p className="launcher-context" role="status">The indexed snapshot could not be checked. You can still submit the prefilled repository for a new build.</p>}<label htmlFor="repo-url">Repository URL</label><input id="repo-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://github.com/owner/repository" autoComplete="url" aria-invalid={Boolean(urlError)} aria-describedby={urlError ? 'repo-url-error' : undefined} /><label htmlFor="repo-ref">Branch or revision <span>(optional)</span></label><input id="repo-ref" value={ref} onChange={(event) => setRef(event.target.value)} placeholder="main" aria-invalid={Boolean(refError)} aria-describedby={refError ? 'repo-ref-error' : undefined} /><button className="primary-button launcher-submit" type="submit" disabled={buildState === 'building' || contextStatus === 'checking'}>{buildState === 'building' ? 'Building map…' : contextStatus === 'checking' ? 'Checking snapshot…' : 'Build this map'} <span aria-hidden="true">→</span></button>{buildState === 'building' && <div className="launcher-progress" role="status" aria-live="polite" aria-busy="true"><div className="launcher-progress-head"><span>{message}</span><button type="button" onClick={stopWaiting}>Stop waiting</button></div><ol>{BUILD_STAGES.map(([key, label], index) => <li className={index < activeStage ? 'is-done' : index === activeStage ? 'is-current' : ''} key={key}><i aria-hidden="true" />{label}</li>)}</ol><p>Stages update as the local/hosted build reports progress. No findings are inferred from this status.</p></div>}{buildState === 'error' && message && <p id="repo-url-error" className="launcher-message" role="alert">{message}</p>}{buildState === 'idle' && message && <p id="repo-url-error" className="launcher-message" role="status">{message}</p>}</form><div className="launcher-card cached-card"><div className="launcher-card-top"><span className="launcher-tag">Open immediately</span></div><h3>Select a cached repository</h3><p>Choose an existing snapshot to continue without rebuilding.</p>{catalogState === 'loading' && <p className="launcher-status" role="status">Loading indexed repositories…</p>}{catalogState === 'error' && <p className="launcher-status" role="status">{message}</p>}{catalogState === 'empty' && <p className="launcher-status">No public snapshots are available yet. Enter a repository URL to create one.</p>}{catalogState === 'ready' && <ul className="cached-list">{repos.map((repo) => repo.bundle_id ? <li key={`${repo.repository}-${repo.revision}`}><button type="button" onClick={() => openSnapshot(repo, initialSourceFile, initialSourceLine)}><span>{repoLabel(repo)}</span><small>{repo.revision ? repo.revision.slice(0, 10) : 'latest'} <b aria-hidden="true">→</b></small></button></li> : null)}</ul>}</div></div></section>;
}
