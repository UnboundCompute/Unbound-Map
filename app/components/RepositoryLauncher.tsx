'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

type CachedRepo = { repository?: string; git_url?: string; ref?: string; revision?: string; bundle_id?: string };
type BuildStatus = { status?: string; bundle_id?: string; sha?: string; error?: { message?: string } };
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
function openSnapshot(repo: CachedRepo) { window.location.href = `/?${new URLSearchParams({ repository: repoLabel(repo), revision: repo.revision || repo.ref || 'main', bundle: repo.bundle_id! }).toString()}`; }
function wait(milliseconds: number) { return new Promise((resolve) => window.setTimeout(resolve, milliseconds)); }

export function RepositoryLauncher() {
  const [repos, setRepos] = useState<CachedRepo[]>([]); const [catalogState, setCatalogState] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [url, setUrl] = useState(''); const [ref, setRef] = useState('main'); const [buildState, setBuildState] = useState<'idle' | 'building' | 'error'>('idle'); const [message, setMessage] = useState(''); const [buildStatus, setBuildStatus] = useState('submitted');
  const buildController = useRef<AbortController | null>(null);
  useEffect(() => { const controller = new AbortController(); fetch(api('/api/repos'), { headers: { Accept: 'application/json' }, signal: controller.signal }).then((response) => { if (!response.ok) throw new Error('Repository catalog is unavailable right now.'); return response.json(); }).then((body) => { const next = Array.isArray(body?.repositories) ? body.repositories : []; setRepos(next); setCatalogState(next.length ? 'ready' : 'empty'); }).catch((error) => { if (error.name !== 'AbortError') { setCatalogState('error'); setMessage(error instanceof Error ? error.message : 'Repository catalog is unavailable right now.'); } }); return () => controller.abort(); }, []);
  const validUrl = useMemo(() => /^https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(url.trim()), [url]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!validUrl) { setBuildState('error'); setMessage('Use a public HTTPS GitHub, GitLab, or Bitbucket repository URL.'); return; }
    buildController.current?.abort();
    const controller = new AbortController();
    buildController.current = controller;
    setBuildState('building'); setBuildStatus('submitted'); setMessage('Starting the repository build…');
    try {
      const response = await fetch(api('/api/build'), { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ git_url: url.trim(), ref: ref.trim() || 'main' }), signal: controller.signal });
      const body = await response.json();
      if (!response.ok || !body?.job_id) throw new Error(body?.error?.message || 'The hosted build could not be started.');
      for (let attempt = 0; attempt < 300; attempt += 1) {
        await wait(2_000);
        const statusResponse = await fetch(api(`/api/build/${encodeURIComponent(body.job_id)}`), { headers: { Accept: 'application/json' }, signal: controller.signal });
        const status = await statusResponse.json() as BuildStatus;
        if (!statusResponse.ok) throw new Error(status?.error?.message || 'The build status could not be read.');
        if (status.status === 'ready' && status.bundle_id) { openSnapshot({ repository: url.trim(), revision: status.sha || ref.trim() || 'main', bundle_id: status.bundle_id }); return; }
        if (['error', 'expired', 'cancelled', 'too_large', 'unsupported_language'].includes(status.status || '')) throw new Error(status?.error?.message || `The build stopped with status: ${status.status}.`);
        setBuildStatus(status.status || 'submitted');
        const stage = BUILD_STAGE_ALIASES[status.status || ''] ?? 0;
        setMessage(`${BUILD_STAGES[stage]?.[1] ?? 'Build repository'}…`);
      }
      throw new Error('The build is still running. Try the cached repository list in a few minutes.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setBuildState('error'); setMessage(error instanceof Error ? error.message : 'The hosted build could not be started.');
    } finally {
      if (buildController.current === controller) buildController.current = null;
    }
  }
  const activeStage = BUILD_STAGE_ALIASES[buildStatus] ?? 0;
  function stopWaiting() {
    buildController.current?.abort();
    setBuildState('idle');
    setBuildStatus('submitted');
    setMessage('Stopped waiting. The server job may continue; reopen it from the cached repository list when it is ready.');
  }
  return <section className="launcher" aria-label="Repository selection"><div className="launcher-grid"><form className="launcher-card launcher-form" onSubmit={submit}><div className="launcher-card-top"><span className="launcher-tag">Generate a new map</span></div><h3>Enter a repository URL</h3><p>Paste a public repository URL. Lachesis will build its graph-backed snapshot, then open the existing map and documentation.</p><label htmlFor="repo-url">Repository URL</label><input id="repo-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://github.com/owner/repository" autoComplete="url" /><label htmlFor="repo-ref">Branch or revision <span>(optional)</span></label><input id="repo-ref" value={ref} onChange={(event) => setRef(event.target.value)} placeholder="main" /><button className="primary-button launcher-submit" type="submit" disabled={buildState === 'building'}>{buildState === 'building' ? 'Building map…' : 'Build this map'} <span aria-hidden="true">→</span></button>{buildState === 'building' && <div className="launcher-progress" role="status" aria-live="polite" aria-busy="true"><div className="launcher-progress-head"><span>{message}</span><button type="button" onClick={stopWaiting}>Stop waiting</button></div><ol>{BUILD_STAGES.map(([key, label], index) => <li className={index < activeStage ? 'is-done' : index === activeStage ? 'is-current' : ''} key={key}><i aria-hidden="true" />{label}</li>)}</ol><p>Stages update as the local/hosted build reports progress. No findings are inferred from this status.</p></div>}{buildState === 'error' && message && <p className="launcher-message" role="alert">{message}</p>}{buildState === 'idle' && message && <p className="launcher-message" role="status">{message}</p>}</form><div className="launcher-card cached-card"><div className="launcher-card-top"><span className="launcher-tag">Open immediately</span></div><h3>Select a cached repository</h3><p>Choose an existing snapshot to continue without rebuilding.</p>{catalogState === 'loading' && <p className="launcher-status" role="status">Loading indexed repositories…</p>}{catalogState === 'error' && <p className="launcher-status" role="status">{message}</p>}{catalogState === 'empty' && <p className="launcher-status">No public snapshots are available yet. Enter a repository URL to create one.</p>}{catalogState === 'ready' && <ul className="cached-list">{repos.map((repo) => repo.bundle_id ? <li key={`${repo.repository}-${repo.revision}`}><button type="button" onClick={() => openSnapshot(repo)}><span>{repoLabel(repo)}</span><small>{repo.revision ? repo.revision.slice(0, 10) : 'latest'} <b aria-hidden="true">→</b></small></button></li> : null)}</ul>}</div></div></section>;
}
