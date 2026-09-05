import Link from 'next/link';
import type { ReactNode } from 'react';
import { illustrativeSnapshot, type RepositorySnapshotView, type SharedSnapshotContext } from '../../lib/view-model';
import { ShareButton } from './ShareButton';

export const navItems = [
  { href: '/', label: 'Start here', note: 'Get oriented' },
  { href: '/architecture', label: 'Architecture', note: 'See the system' },
  { href: '/flows', label: 'Flows', note: 'Follow a journey' },
  { href: '/trust', label: 'Trust', note: 'Name obligations' },
];

function isActive(href: string, active?: string) {
  return href === '/' ? active === '/' || !active : active === href || Boolean(active?.startsWith(`${href}/`));
}

export function SnapshotState({ snapshot }: { snapshot: RepositorySnapshotView }) {
  const bundlePending = snapshot.provenance === 'illustrative' && snapshot.limitations.some((item) => /bundle\s+(?:was\s+)?requested/i.test(item));
  const stale = snapshot.provenance === 'graph-backed' && snapshot.limitations.some((item) => /\b(stale|outdated|superseded)\b/i.test(item));
  const sparse = snapshot.provenance === 'graph-backed' && snapshot.regions.length <= 1;
  const label = bundlePending ? 'Graph-backed bundle requested' : snapshot.provenance === 'illustrative' ? 'Illustrative fixture · coverage limited' : stale ? 'Graph-backed · stale snapshot' : sparse ? 'Graph-backed · sparse projection' : snapshot.coverageState === 'limited' ? 'Graph-backed · coverage limited' : 'Verified graph-backed';
  return <span className={`snapshot-state snapshot-${snapshot.provenance}${stale ? ' snapshot-stale' : ''}${bundlePending ? ' snapshot-pending' : ''}${sparse ? ' snapshot-sparse' : ''}`}><i aria-hidden="true" />{label}</span>;
}

function contextualHref(href: string, context?: SharedSnapshotContext) {
  if (!context || (!context.repository && !context.revision && !context.bundle)) return href;
  const query = new URLSearchParams({ ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}) }).toString();
  return `${href}${query ? `${href.includes('?') ? '&' : '?'}${query}` : ''}`;
}

function contextualHandoffHref(context?: SharedSnapshotContext) {
  if (!context) return '/explore';
  const query = new URLSearchParams({ ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}), ...(context.region ? { region: context.region } : {}), ...(context.label ? { label: context.label } : {}), ...(context.anchor ? { anchor: context.anchor } : {}), ...(context.flow ? { flow: context.flow } : {}), ...(context.step ? { step: context.step } : {}), ...(context.domain ? { domain: context.domain } : {}) }).toString();
  return `/explore${query ? `?${query}` : ''}`;
}

function lachesisHref(context: SharedSnapshotContext | undefined, snapshot: RepositorySnapshotView) {
  const hasSelection = Boolean(context && (context.region || context.label || context.anchor || context.flow || context.step || context.domain));
  if (!context || (!context.repository && !context.revision && !context.bundle && !hasSelection)) return 'https://lachesis.unboundcompute.com/';
  const query = new URLSearchParams({ repository: context.repository ?? snapshot.repository, revision: context.revision ?? snapshot.revision, ...(context.bundle ? { bundle: context.bundle } : {}), ...(context.region ? { region: context.region } : {}), ...(context.label ? { label: context.label } : {}), ...(context.anchor ? { anchor: context.anchor } : {}), ...(context.flow ? { flow: context.flow } : {}), ...(context.step ? { step: context.step } : {}), ...(context.domain ? { domain: context.domain } : {}) }).toString();
  return `https://lachesis.unboundcompute.com/?${query}`;
}

export function DocsShell({ children, active, snapshot = illustrativeSnapshot, context }: { children: ReactNode; active?: string; snapshot?: RepositorySnapshotView; context?: SharedSnapshotContext }) {
  const activeRoute = active ?? '/';
  const isFixture = snapshot.provenance === 'illustrative';
  const hasHandoffContext = Boolean(context && (context.region || context.label || context.anchor || context.flow || context.step || context.domain));
  const shortRevision = snapshot.revision.length > 14 ? `${snapshot.revision.slice(0, 8)}…${snapshot.revision.slice(-5)}` : snapshot.revision;
  return (
    <div className="docs-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="repo-bar" role="banner">
        <Link href={contextualHref('/', context)} className="wordmark" aria-label="Design Map start here"><span className="wordmark-mark" aria-hidden="true"><i /><i /><i /></span><span>Design Map</span></Link>
        <span className="bar-divider" aria-hidden="true" />
        <span className="bar-repo">{snapshot.repository}</span>
        <details className="revision-detail"><summary aria-label={`Revision ${snapshot.revision}`}><code className="bar-revision">{shortRevision}</code></summary><div className="revision-popover"><span>full revision</span><code>{snapshot.revision}</code></div></details>
        <SnapshotState snapshot={snapshot} />
        {hasHandoffContext && <a className="bar-lachesis" href={lachesisHref(context, snapshot)} target="_blank" rel="noreferrer" aria-label="Open Lachesis in a new tab">Lachesis <span aria-hidden="true">↗</span></a>}
      </header>
      <div className="docs-layout">
        <aside className="reading-rail" aria-label="Repository guide">
          <div className="rail-heading">Read this map</div>
          <nav className="primary-nav" aria-label="Primary navigation">
            {navItems.map((item) => { const current = isActive(item.href, activeRoute); return <Link key={item.href} href={contextualHref(item.href, context)} className={`primary-nav-link ${current ? 'is-current' : ''}`} aria-current={current ? 'page' : undefined}><span>{item.label}</span><small>{item.note}</small></Link>; })}
          </nav>
          <div className="rail-rule" />
          <div className="rail-heading">Snapshot</div>
          <dl className="snapshot-list"><div><dt>revision</dt><dd><code>{snapshot.revision}</code></dd></div><div><dt>generated</dt><dd>{snapshot.generatedAt ? <time dateTime={snapshot.generatedAt}><code>{snapshot.generatedAt}</code></time> : 'Not supplied by snapshot'}</dd></div><div><dt>coverage</dt><dd>{snapshot.coverageScope}</dd></div><div><dt>indexed</dt><dd>{snapshot.indexedNodes.toLocaleString()} nodes</dd></div></dl>
          <p className="rail-note">{snapshot.limitations.some((item) => /bundle\s+(?:was\s+)?requested/i.test(item)) ? 'A graph-backed bundle is requested. The map will replace the fixture only after validation succeeds.' : isFixture ? 'Illustrative content for the prototype. Replace with a verified bundle before sharing.' : snapshot.regions.length <= 1 ? 'Generated from the Lachesis graph, but only one top-level region is available. Treat this as a sparse projection until coverage expands.' : snapshot.limitations.some((item) => /\b(stale|outdated|superseded)\b/i.test(item)) ? 'Generated from the Lachesis graph, but this snapshot is marked stale. Confirm the revision before relying on it.' : snapshot.coverageState === 'limited' ? 'Generated from the Lachesis graph, but this view covers only part of the indexed repository.' : 'Generated from the Lachesis graph. Layout is editorial; counts retain bundle provenance.'}</p>
        </aside>
        <main id="main-content" className="docs-main" tabIndex={-1}>{children}</main>
      </div>
      <footer className="docs-footer"><span>Design Map · read this before the source</span><Link href={contextualHandoffHref(context)}>Continue to Lachesis <span aria-hidden="true">↗</span></Link></footer>
    </div>
  );
}

export function PageIntro({ eyebrow, title, children, snapshot = illustrativeSnapshot }: { eyebrow?: string; title: string; children: ReactNode; snapshot?: RepositorySnapshotView }) {
  return <header className="page-intro">{eyebrow && <p className="page-eyebrow">{eyebrow}</p>}<h1>{title}</h1><p className="page-lede">{children}</p><div className="intro-source"><SnapshotState snapshot={snapshot} /><span>{snapshot.coverageScope}</span><ShareButton /></div></header>;
}

export function EvidenceNote({ children }: { children: ReactNode }) { return <aside className="evidence-note"><span className="evidence-label">How to read the evidence</span><p>{children}</p></aside>; }

export function BundlePendingState({ snapshot, context, subject }: { snapshot: RepositorySnapshotView; context: SharedSnapshotContext; subject: string }) {
  const exploreQuery = new URLSearchParams({ repository: snapshot.repository, revision: snapshot.revision, ...(context.bundle ? { bundle: context.bundle } : {}), ...(context.region ? { region: context.region } : {}), ...(context.label ? { label: context.label } : {}), ...(context.anchor ? { anchor: context.anchor } : {}), ...(context.flow ? { flow: context.flow } : {}), ...(context.step ? { step: context.step } : {}), ...(context.domain ? { domain: context.domain } : {}) }).toString();
  return <section className="map-state-panel" role="status" aria-live="polite" aria-atomic="true"><span className="map-state-label">Graph-backed bundle requested</span><h2>Preparing a verified {subject}.</h2><p>This page will not substitute illustrative content while the requested snapshot is unresolved. Open Architecture to validate the bundle, or continue to Lachesis with the context you already have.</p><div className="map-state-actions"><Link className="primary-button" href={`/architecture?${new URLSearchParams({ repository: snapshot.repository, revision: snapshot.revision, ...(context.bundle ? { bundle: context.bundle } : {}) }).toString()}`}>Open Architecture loader <span aria-hidden="true">→</span></Link><Link className="quiet-link" href={`/explore?${exploreQuery}`}>Open Lachesis context <span aria-hidden="true">↗</span></Link></div></section>;
}
