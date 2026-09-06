'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { bundleApiOrigin } from '../../lib/links';

type CachedRepo = { repository?: string; git_url?: string; ref?: string; revision?: string; bundle_id?: string };
type BuildStatus = { status?: string; bundle_id?: string; sha?: string; error?: { message?: string } };
function api(path: string) { return `${bundleApiOrigin()}${path}`; }
function repoLabel(repo: CachedRepo) { return (repo.repository || repo.git_url || 'Repository').replace(/^https?:\/\//, '').replace(/\.git$/, ''); }
function openSnapshot(repo: CachedRepo) { window.location.href = `/?${new URLSearchParams({ repository: repoLabel(repo), revision: repo.revision || repo.ref || 'main', bundle: repo.bundle_id! }).toString()}`; }
function wait(milliseconds: number) { return new Promise((resolve) => window.setTimeout(resolve, milliseconds)); }

export function RepositoryLauncher() {
  const [repos, setRepos] = useState<CachedRepo[]>([]); const [catalogState, setCatalogState] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [url, setUrl] = useState(''); const [ref, setRef] = useState('main'); const [buildState, setBuildState] = useState<'idle' | 'building' | 'error'>('idle'); const [message, setMessage] = useState('');
  useEffect(() => { const controller = new AbortController(); fetch(api('/api/repos'), { headers: { Accept: 'application/json' }, signal: controller.signal }).then((response) => { if (!response.ok) throw new Error('Repository catalog is unavailable right now.'); return response.json(); }).then((body) => { const next = Array.isArray(body?.repositories) ? body.repositories : []; setRepos(next); setCatalogState(next.length ? 'ready' : 'empty'); }).catch((error) => { if (error.name !== 'AbortError') { setCatalogState('error'); setMessage(error instanceof Error ? error.message : 'Repository catalog is unavailable right now.'); } }); return () => controller.abort(); }, []);
  const validUrl = useMemo(() => /^https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(url.trim()), [url]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!validUrl) { setBuildState('error'); setMessage('Use a public HTTPS GitHub, GitLab, or Bitbucket repository URL.'); return; }
    setBuildState('building'); setMessage('Starting the repository build…');
    try {
      const response = await fetch(api('/api/build'), { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ git_url: url.trim(), ref: ref.trim() || 'main' }) });
      const body = await response.json();
      if (!response.ok || !body?.job_id) throw new Error(body?.error?.message || 'The hosted build could not be started.');
      for (let attempt = 0; attempt < 300; attempt += 1) {
        await wait(2_000);
        const statusResponse = await fetch(api(`/api/build/${encodeURIComponent(body.job_id)}`), { headers: { Accept: 'application/json' } });
        const status = await statusResponse.json() as BuildStatus;
        if (!statusResponse.ok) throw new Error(status?.error?.message || 'The build status could not be read.');
        if (status.status === 'ready' && status.bundle_id) { openSnapshot({ repository: url.trim(), revision: status.sha || ref.trim() || 'main', bundle_id: status.bundle_id }); return; }
        if (['error', 'expired', 'cancelled', 'too_large', 'unsupported_language'].includes(status.status || '')) throw new Error(status?.error?.message || `The build stopped with status: ${status.status}.`);
        setMessage(status.status ? `Building repository · ${status.status.replaceAll('_', ' ')}…` : 'Building repository…');
      }
      throw new Error('The build is still running. Try the cached repository list in a few minutes.');
    } catch (error) { setBuildState('error'); setMessage(error instanceof Error ? error.message : 'The hosted build could not be started.'); }
  }
  return <section className="launcher" aria-labelledby="launcher-title"><div className="launcher-heading"><h2 id="launcher-title">Bring a repository into focus.</h2><p>Start with a fresh public repository or open a snapshot that has already been indexed by Lachesis.</p></div><div className="launcher-grid"><form className="launcher-card launcher-form" onSubmit={submit}><div className="launcher-card-top"><span className="launcher-tag">Generate a new map</span></div><h3>Enter a repository URL</h3><p>Paste a public repository URL. Lachesis will build its graph-backed snapshot, then open the existing map and documentation.</p><label htmlFor="repo-url">Repository URL</label><input id="repo-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://github.com/owner/repository" autoComplete="url" /><label htmlFor="repo-ref">Branch or revision <span>(optional)</span></label><input id="repo-ref" value={ref} onChange={(event) => setRef(event.target.value)} placeholder="main" /><button className="primary-button launcher-submit" type="submit" disabled={buildState === 'building'}>{buildState === 'building' ? 'Building map…' : 'Build this map'} <span aria-hidden="true">→</span></button>{buildState !== 'idle' && message && <p className="launcher-message" role={buildState === 'error' ? 'alert' : 'status'}>{message}</p>}</form><div className="launcher-card cached-card"><div className="launcher-card-top"><span className="launcher-tag">Open immediately</span></div><h3>Select a cached repository</h3><p>Choose an existing snapshot to continue without rebuilding.</p>{catalogState === 'loading' && <p className="launcher-status" role="status">Loading indexed repositories…</p>}{catalogState === 'error' && <p className="launcher-status" role="status">{message}</p>}{catalogState === 'empty' && <p className="launcher-status">No public snapshots are available yet. Enter a repository URL to create one.</p>}{catalogState === 'ready' && <ul className="cached-list">{repos.map((repo) => repo.bundle_id ? <li key={`${repo.repository}-${repo.revision}`}><button type="button" onClick={() => openSnapshot(repo)}><span>{repoLabel(repo)}</span><small>{repo.revision ? repo.revision.slice(0, 10) : 'latest'} <b aria-hidden="true">→</b></small></button></li> : null)}</ul>}</div></div></section>;
}
