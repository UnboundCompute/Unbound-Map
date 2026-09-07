import Link from 'next/link';
import type { ReactNode } from 'react';
import { emptySnapshot, type RepositorySnapshotView, type SharedSnapshotContext } from '../../lib/view-model';
import { ShareButton } from './ShareButton';
import { LiveSnapshotDetails, LiveSnapshotIdentity, LiveSnapshotState } from './LiveSnapshotState';
import { lachesisOrigin } from '../../lib/links';
import { flowCardHref } from '../../lib/artifact-id';

export const navItems = [
  { href: '/', label: 'Overview', note: 'Get oriented' },
  { href: '/architecture', label: 'Architecture', note: 'See the system' },
  { href: '/flows', label: 'Important flows', note: 'Follow a path' },
  { href: '/trust', label: 'Security', note: 'Name obligations' },
];

const ecosystemLinks = [
  ['Map', 'https://map.unboundcompute.com/', 'overview'],
  ['Atropos', 'https://atropos.unboundcompute.com/', 'semantics'],
  ['Lachesis', 'https://lachesis.unboundcompute.com/', 'investigate'],
  ['Casefiles', 'https://trace.unboundcompute.com/', 'evidence'],
  ['Researcher', 'https://unboundcompute.com/', 'prove'],
] as const;

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

function publicationMailto(action: string, context: SharedSnapshotContext, snapshot: RepositorySnapshotView) {
  const repository = context.repository ?? snapshot.repository;
  const revision = context.revision ?? snapshot.revision;
  const subject = `${action}: ${repository} @ ${revision}`;
  const body = `Repository: ${repository}\nRevision: ${revision}\nBundle: ${context.bundle ?? 'not supplied'}\n\nPlease include the map URL and the specific claim or refresh context.`;
  return `mailto:riyan@unboundcompute.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function DocsShell({ children, active, snapshot = emptySnapshot, context }: { children: ReactNode; active?: string; snapshot?: RepositorySnapshotView; context?: SharedSnapshotContext }) {
  const activeRoute = active ?? '/';
  const hasHandoffContext = Boolean(context && (context.region || context.label || context.anchor || context.flow || context.step || context.domain));
  const hasPublicSnapshot = Boolean(context?.repository && context?.revision && context?.bundle);
  return (
    <div className="docs-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <nav className="ecosystem-rail" aria-label="UnboundCompute products">
        <a className="ecosystem-wordmark" href="https://unboundcompute.com/" target="_blank" rel="noreferrer">UNBOUNDCOMPUTE</a>
        <span className="ecosystem-divider" aria-hidden="true" />
        <div className="ecosystem-links">
          {ecosystemLinks.map(([label, href, detail]) => <a key={label} className={label === 'Map' ? 'active' : undefined} href={href} target="_blank" rel="noreferrer" aria-current={label === 'Map' ? 'page' : undefined}><b>{label}</b><small>{detail}</small></a>)}
        </div>
      </nav>
      <header className="repo-bar" role="banner">
        <Link href={contextualHref('/', context)} className="wordmark" aria-label="Unbound Map overview"><span className="wordmark-mark" aria-hidden="true"><i /><i /><i /></span><span>Unbound Map</span></Link>
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
        <main id="main-content" className="docs-main" tabIndex={-1}>{children}{hasPublicSnapshot && <aside className="publication-note" aria-label="Publication and correction controls"><p><strong>Independent analysis.</strong> Generated from public source at the pinned revision. This map is not affiliated with or endorsed by the repository maintainers unless explicitly marked verified.</p><div className="publication-actions"><a href={publicationMailto('Verify architecture', context!, snapshot)}>Verify architecture</a><a href={publicationMailto('Suggest a correction', context!, snapshot)}>Suggest a correction</a><a href={publicationMailto('Request a refresh', context!, snapshot)}>Request a refresh</a><a href={publicationMailto('Report a misleading claim', context!, snapshot)}>Report a misleading claim</a><a href={publicationMailto('Request a takedown', context!, snapshot)}>Request a takedown</a></div></aside>}</main>
      </div>
      <footer className="docs-footer"><span>Unbound Map · read this before the source</span><Link href={contextualHandoffHref(context)}>Continue to Lachesis <span aria-hidden="true">↗</span></Link></footer>
    </div>
  );
}

export function PageIntro({ eyebrow, title, children, snapshot = emptySnapshot, context }: { eyebrow?: string; title: string; children: ReactNode; snapshot?: RepositorySnapshotView; context?: SharedSnapshotContext }) {
  const shareHref = context?.bundle && context?.flow
    ? flowCardHref(context.bundle, context.flow)
    : undefined;
  return <header className="page-intro">{eyebrow && <p className="page-eyebrow">{eyebrow}</p>}<h1>{title}</h1><p className="page-lede">{children}</p><div className="intro-source"><LiveSnapshotState showCoverage provenance={snapshot.provenance} coverageState={snapshot.coverageState} limitations={snapshot.limitations} regionCount={snapshot.regions.length} repository={snapshot.repository} revision={snapshot.revision} generatedAt={snapshot.generatedAt} coverageScope={snapshot.coverageScope} indexedNodes={snapshot.indexedNodes} includedNodes={snapshot.includedNodes} /><ShareButton href={shareHref} /></div></header>;
}

export function EvidenceNote({ children }: { children: ReactNode }) { return <aside className="evidence-note"><span className="evidence-label">How to read the evidence</span><p>{children}</p></aside>; }

export function BundlePendingState({ snapshot, context, subject }: { snapshot: RepositorySnapshotView; context: SharedSnapshotContext; subject: string }) {
  const exploreQuery = new URLSearchParams({ repository: snapshot.repository, revision: snapshot.revision, ...(context.bundle ? { bundle: context.bundle } : {}), ...(context.region ? { region: context.region } : {}), ...(context.label ? { label: context.label } : {}), ...(context.anchor ? { anchor: context.anchor } : {}), ...(context.flow ? { flow: context.flow } : {}), ...(context.step ? { step: context.step } : {}), ...(context.domain ? { domain: context.domain } : {}) }).toString();
  return <section className="map-state-panel" role="status" aria-live="polite" aria-atomic="true"><span className="map-state-label">Graph-backed bundle requested</span><h2>Awaiting a verified {subject}.</h2><p>This page will not substitute placeholder content while the requested snapshot is unresolved. Open Architecture to validate the bundle, or continue to Lachesis with the context you already have.</p><div className="map-state-actions"><Link className="primary-button" href={`/architecture?${new URLSearchParams({ repository: snapshot.repository, revision: snapshot.revision, ...(context.bundle ? { bundle: context.bundle } : {}) }).toString()}`}>Open Architecture loader <span aria-hidden="true">→</span></Link><Link className="quiet-link" href={`/explore?${exploreQuery}`}>Open Lachesis context <span aria-hidden="true">↗</span></Link></div></section>;
}
