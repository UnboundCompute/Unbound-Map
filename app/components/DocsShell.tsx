import Link from 'next/link';
import type { ReactNode } from 'react';
import { illustrativeSnapshot, type RepositorySnapshotView } from '../../lib/view-model';

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
  const label = snapshot.provenance === 'illustrative' ? 'Illustrative fixture · coverage limited' : snapshot.coverageState === 'limited' ? 'Graph-backed · coverage limited' : 'Verified graph-backed';
  return <span className={`snapshot-state snapshot-${snapshot.provenance}`}><i aria-hidden="true" />{label}</span>;
}

export function DocsShell({ children, active, snapshot = illustrativeSnapshot }: { children: ReactNode; active?: string; snapshot?: RepositorySnapshotView }) {
  const activeRoute = active ?? '/';
  const isFixture = snapshot.provenance === 'illustrative';
  return (
    <div className="docs-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="repo-bar" role="banner">
        <Link href="/" className="wordmark" aria-label="Design Map start here"><span className="wordmark-mark" aria-hidden="true"><i /><i /><i /></span><span>Design Map</span></Link>
        <span className="bar-divider" aria-hidden="true" />
        <span className="bar-repo">{snapshot.repository}</span>
        <code className="bar-revision">{snapshot.revision}</code>
        <SnapshotState snapshot={snapshot} />
        <a className="bar-lachesis" href="https://lachesis.unboundcompute.com/" target="_blank" rel="noreferrer">Lachesis <span aria-hidden="true">↗</span></a>
      </header>
      <div className="docs-layout">
        <aside className="reading-rail" aria-label="Repository guide">
          <div className="rail-heading">Read this map</div>
          <nav className="primary-nav" aria-label="Primary navigation">
            {navItems.map((item) => { const current = isActive(item.href, activeRoute); return <Link key={item.href} href={item.href} className={`primary-nav-link ${current ? 'is-current' : ''}`} aria-current={current ? 'page' : undefined}><span>{item.label}</span><small>{item.note}</small></Link>; })}
          </nav>
          <div className="rail-rule" />
          <div className="rail-heading">Snapshot</div>
          <dl className="snapshot-list"><div><dt>revision</dt><dd><code>{snapshot.revision}</code></dd></div><div><dt>coverage</dt><dd>{snapshot.coverageScope}</dd></div><div><dt>indexed</dt><dd>{snapshot.indexedNodes.toLocaleString()} nodes</dd></div></dl>
          <p className="rail-note">{isFixture ? 'Illustrative content for the prototype. Replace with a verified bundle before sharing.' : snapshot.coverageState === 'limited' ? 'Generated from the Lachesis graph, but this view covers only part of the indexed repository.' : 'Generated from the Lachesis graph. Layout is editorial; counts retain bundle provenance.'}</p>
        </aside>
        <main id="main-content" className="docs-main">{children}</main>
      </div>
      <footer className="docs-footer"><span>Design Map · read this before the source</span><Link href="/explore">Continue to Lachesis <span aria-hidden="true">↗</span></Link></footer>
    </div>
  );
}

export function PageIntro({ eyebrow, title, children, snapshot = illustrativeSnapshot }: { eyebrow?: string; title: string; children: ReactNode; snapshot?: RepositorySnapshotView }) {
  return <header className="page-intro">{eyebrow && <p className="page-eyebrow">{eyebrow}</p>}<h1>{title}</h1><p className="page-lede">{children}</p><div className="intro-source"><SnapshotState snapshot={snapshot} /><span>{snapshot.coverageScope}</span></div></header>;
}

export function EvidenceNote({ children }: { children: ReactNode }) { return <aside className="evidence-note"><span className="evidence-label">How to read the evidence</span><p>{children}</p></aside>; }
