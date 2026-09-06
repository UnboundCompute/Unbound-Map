import Link from 'next/link';
import type { ReactNode } from 'react';
import { emptySnapshot, type RepositorySnapshotView, type SharedSnapshotContext } from '../../lib/view-model';
import { ShareButton } from './ShareButton';
import { LiveSnapshotDetails, LiveSnapshotIdentity, LiveSnapshotState } from './LiveSnapshotState';
import { lachesisOrigin } from '../../lib/links';

export const navItems = [
  { href: '/', label: 'Start here', note: 'Get oriented' },
  { href: '/architecture', label: 'Architecture', note: 'See the system' },
  { href: '/flows', label: 'Flows', note: 'Follow a path' },
  { href: '/trust', label: 'Trust', note: 'Name obligations' },
];

function isActive(href: string, active?: string) {
  return href === '/' ? active === '/' || !active : active === href || Boolean(active?.startsWith(`${href}/`));
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
  const origin = lachesisOrigin();
  if (!context || (!context.repository && !context.revision && !context.bundle && !hasSelection)) return `${origin}/`;
  const query = new URLSearchParams({ repository: context.repository ?? snapshot.repository, revision: context.revision ?? snapshot.revision, ...(context.bundle ? { bundle: context.bundle } : {}), ...(context.region ? { region: context.region } : {}), ...(context.label ? { label: context.label } : {}), ...(context.anchor ? { anchor: context.anchor } : {}), ...(context.flow ? { flow: context.flow } : {}), ...(context.step ? { step: context.step } : {}), ...(context.domain ? { domain: context.domain } : {}) }).toString();
  return `${origin}/?${query}`;
}

export function DocsShell({ children, active, snapshot = emptySnapshot, context }: { children: ReactNode; active?: string; snapshot?: RepositorySnapshotView; context?: SharedSnapshotContext }) {
  const activeRoute = active ?? '/';
  const hasHandoffContext = Boolean(context && (context.region || context.label || context.anchor || context.flow || context.step || context.domain));
  return (
    <div className="docs-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="repo-bar" role="banner">
        <Link href={contextualHref('/', context)} className="wordmark" aria-label="Unbound Map start here"><span className="wordmark-mark" aria-hidden="true"><i /><i /><i /></span><span>Unbound Map</span></Link>
        <span className="bar-divider" aria-hidden="true" />
        <LiveSnapshotIdentity repository={snapshot.repository} revision={snapshot.revision} />
        <LiveSnapshotState provenance={snapshot.provenance} coverageState={snapshot.coverageState} limitations={snapshot.limitations} regionCount={snapshot.regions.length} repository={snapshot.repository} revision={snapshot.revision} generatedAt={snapshot.generatedAt} coverageScope={snapshot.coverageScope} indexedNodes={snapshot.indexedNodes} includedNodes={snapshot.includedNodes} />
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
          <LiveSnapshotDetails provenance={snapshot.provenance} coverageState={snapshot.coverageState} limitations={snapshot.limitations} regionCount={snapshot.regions.length} repository={snapshot.repository} revision={snapshot.revision} generatedAt={snapshot.generatedAt} coverageScope={snapshot.coverageScope} indexedNodes={snapshot.indexedNodes} includedNodes={snapshot.includedNodes} />
        </aside>
        <main id="main-content" className="docs-main" tabIndex={-1}>{children}</main>
      </div>
      <footer className="docs-footer"><span>Unbound Map · read this before the source</span><Link href={contextualHandoffHref(context)}>Continue to Lachesis <span aria-hidden="true">↗</span></Link></footer>
    </div>
  );
}

export function PageIntro({ eyebrow, title, children, snapshot = emptySnapshot }: { eyebrow?: string; title: string; children: ReactNode; snapshot?: RepositorySnapshotView }) {
  return <header className="page-intro">{eyebrow && <p className="page-eyebrow">{eyebrow}</p>}<h1>{title}</h1><p className="page-lede">{children}</p><div className="intro-source"><LiveSnapshotState showCoverage provenance={snapshot.provenance} coverageState={snapshot.coverageState} limitations={snapshot.limitations} regionCount={snapshot.regions.length} repository={snapshot.repository} revision={snapshot.revision} generatedAt={snapshot.generatedAt} coverageScope={snapshot.coverageScope} indexedNodes={snapshot.indexedNodes} includedNodes={snapshot.includedNodes} /><ShareButton /></div></header>;
}

export function EvidenceNote({ children }: { children: ReactNode }) { return <aside className="evidence-note"><span className="evidence-label">How to read the evidence</span><p>{children}</p></aside>; }

export function BundlePendingState({ snapshot, context, subject }: { snapshot: RepositorySnapshotView; context: SharedSnapshotContext; subject: string }) {
  const exploreQuery = new URLSearchParams({ repository: snapshot.repository, revision: snapshot.revision, ...(context.bundle ? { bundle: context.bundle } : {}), ...(context.region ? { region: context.region } : {}), ...(context.label ? { label: context.label } : {}), ...(context.anchor ? { anchor: context.anchor } : {}), ...(context.flow ? { flow: context.flow } : {}), ...(context.step ? { step: context.step } : {}), ...(context.domain ? { domain: context.domain } : {}) }).toString();
  return <section className="map-state-panel" role="status" aria-live="polite" aria-atomic="true"><span className="map-state-label">Graph-backed bundle requested</span><h2>Awaiting a verified {subject}.</h2><p>This page will not substitute placeholder content while the requested snapshot is unresolved. Open Architecture to validate the bundle, or continue to Lachesis with the context you already have.</p><div className="map-state-actions"><Link className="primary-button" href={`/architecture?${new URLSearchParams({ repository: snapshot.repository, revision: snapshot.revision, ...(context.bundle ? { bundle: context.bundle } : {}) }).toString()}`}>Open Architecture loader <span aria-hidden="true">→</span></Link><Link className="quiet-link" href={`/explore?${exploreQuery}`}>Open Lachesis context <span aria-hidden="true">↗</span></Link></div></section>;
}
