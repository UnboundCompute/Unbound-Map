import Link from 'next/link';
import type { ReactNode } from 'react';
import { illustrativeSnapshot, type RepositorySnapshotView } from '../../lib/view-model';

const sections = [
  { href: '/map', label: 'System Map', note: 'What owns what' },
  { href: '/flow', label: 'Data Flow', note: 'How a packet moves' },
  { href: '/trust', label: 'Trust Surface', note: 'Where obligations begin' },
  { href: '/explore', label: 'Read in Lachesis', note: 'Open the code path' },
];

export function DocsShell({ children, active, snapshot = illustrativeSnapshot }: { children: ReactNode; active?: string; snapshot?: RepositorySnapshotView }) {
  const isFixture = snapshot.provenance === 'illustrative';
  return (
    <div className="docs-shell">
      <header className="docs-header">
        <Link href="/" className="docs-brand" aria-label="Design Map home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>Design Map</span>
        </Link>
        <span className="docs-header-note">Read this before the source</span>
        <span className="docs-header-repo">{snapshot.repository} · {snapshot.revision}{isFixture ? ' · illustrative' : ''}</span>
      </header>
      <div className="docs-body">
        <aside className="docs-sidebar" aria-label="Map navigation">
          <div className="sidebar-label">This map</div>
          <nav className="docs-nav">
            {sections.map((section) => (
              <Link key={section.href} href={section.href} aria-current={active === section.href ? 'page' : undefined} className={`docs-nav-link ${active === section.href ? 'is-active' : ''}`}>
                <span>{section.label}</span><small>{section.note}</small>
              </Link>
            ))}
          </nav>
          <div className="sidebar-divider" />
          <div className="sidebar-label">Snapshot</div>
          <dl className="sidebar-facts">
            <div><dt>revision</dt><dd>{snapshot.revision}</dd></div>
            <div><dt>coverage</dt><dd>{snapshot.coverageScope}</dd></div>
            <div><dt>indexed</dt><dd>{snapshot.indexedNodes.toLocaleString()} nodes</dd></div>
          </dl>
          <p className="sidebar-footnote">{isFixture ? 'Illustrative prototype. Replace this snapshot with a graph-backed bundle before sharing.' : 'Generated from a Lachesis graph bundle. Layout is editorial; counts are evidence.'}</p>
        </aside>
        <main className="docs-main">{children}</main>
      </div>
    </div>
  );
}

export const DocTabs = ({ active }: { active: string }) => (
  <nav className="doc-tabs" aria-label="Map sections">
    {sections.slice(0, 3).map((section) => <Link key={section.href} href={section.href} className={active === section.href ? 'is-active' : ''}>{section.label}</Link>)}
  </nav>
);
