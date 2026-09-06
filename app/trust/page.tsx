import Link from 'next/link';
import type { Metadata } from 'next';
import { DocsShell, EvidenceNote, PageIntro } from '../components/DocsShell';
import { HostedTrustGlossary } from '../components/HostedTrustGlossary';
import { emptySnapshot, snapshotWithContext, type SharedSnapshotContext } from '../../lib/view-model';
import { documentMetadata } from '../../lib/seo';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const query = await searchParams;
  const repository = one(query.repository);
  const label = repository ?? 'Repository';
  return documentMetadata(`${label} trust surfaces · Unbound Map`, `Use a searchable glossary to understand security and correctness obligations in ${label} without mistaking presence for a finding.`, { repository, revision: one(query.revision), bundle: one(query.bundle) });
}

export default async function TrustPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const context: SharedSnapshotContext = { repository: one(query.repository), revision: one(query.revision), bundle: one(query.bundle), domain: one(query.domain) };
  const snapshot = snapshotWithContext(emptySnapshot, context);
  if (!context.bundle) {
    return <DocsShell active="/trust" snapshot={snapshot} context={context}><div className="doc-page trust-page"><PageIntro title="Choose a repository first." snapshot={snapshot}>Trust surfaces are read from a validated graph snapshot's exported evidence. Select or build a repository to begin.</PageIntro><section className="map-state-panel" role="status" aria-live="polite" aria-atomic="true"><span className="map-state-label">No repository selected</span><h2>Open a repository to load its trust surfaces.</h2><p>Unbound Map does not show a placeholder taxonomy. Pick a cached repository or add a public repository URL to begin.</p><Link className="primary-button" href="/">Choose a repository <span aria-hidden="true">→</span></Link></section></div></DocsShell>;
  }
  return <DocsShell active="/trust" snapshot={snapshot} context={context}><div className="doc-page trust-page"><PageIntro title="What evidence needs a closer read?" snapshot={snapshot}>This index keeps exported graph evidence separate from adjudicated findings. Open the source context before drawing a security conclusion.</PageIntro><HostedTrustGlossary bundleId={context.bundle} context={context} initialQuery={one(query.q)} /><EvidenceNote>Graph-backed evidence is a pointer into Lachesis, not a vulnerability verdict. Empty security evidence is explained rather than replaced with a placeholder taxonomy.</EvidenceNote></div></DocsShell>;
}
