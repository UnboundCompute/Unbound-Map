import Link from 'next/link';
import type { ReactNode } from 'react';

const sections = [
  { href: '/map', label: 'System Map', note: 'What owns what' },
  { href: '/flow', label: 'Data Flow', note: 'How a packet moves' },
  { href: '/trust', label: 'Trust Surface', note: 'Where obligations begin' },
  { href: '/explore', label: 'Read in Lachesis', note: 'Open the code path' },
];

export function DocsShell({ children, active }: { children: ReactNode; active?: string }) {
  return (
    <div className="docs-shell">
      <header className="docs-header">
        <Link href="/" className="docs-brand" aria-label="Design Map home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>Design Map</span>
        </Link>
        <span className="docs-header-note">Read this before the source</span>
        <span className="docs-header-repo">suricata · main</span>
      </header>
      <div className="docs-body">
        <aside className="docs-sidebar" aria-label="Map navigation">
          <div className="sidebar-label">This map</div>
          <nav className="docs-nav">
            {sections.map((section) => (
              <Link key={section.href} href={section.href} className={`docs-nav-link ${active === section.href ? 'is-active' : ''}`}>
                <span>{section.label}</span><small>{section.note}</small>
              </Link>
            ))}
          </nav>
          <div className="sidebar-divider" />
          <div className="sidebar-label">Snapshot</div>
          <dl className="sidebar-facts">
            <div><dt>revision</dt><dd>8f4c1b2</dd></div>
            <div><dt>coverage</dt><dd>repository</dd></div>
            <div><dt>indexed</dt><dd>12,486 nodes</dd></div>
          </dl>
          <p className="sidebar-footnote">Generated from a Lachesis graph bundle. Layout is editorial; counts are evidence.</p>
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
