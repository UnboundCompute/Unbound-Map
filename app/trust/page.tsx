import Link from 'next/link';
import type { Metadata } from 'next';
import { BundlePendingState, DocsShell, EvidenceNote, PageIntro } from '../components/DocsShell';
import { TrustGlossary } from '../components/TrustGlossary';
import { illustrativeSnapshot, snapshotWithContext, type SharedSnapshotContext } from '../../lib/view-model';
import { documentMetadata } from '../../lib/seo';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const query = await searchParams;
  const repository = one(query.repository);
  const label = repository ?? illustrativeSnapshot.repository;
  return documentMetadata(`${label} trust surfaces · Design Map`, `Use a searchable glossary to understand security and correctness obligations in ${label} without mistaking presence for a finding.`, { repository, revision: one(query.revision), bundle: one(query.bundle) });
}

export default async function TrustPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const context: SharedSnapshotContext = { repository: one(query.repository), revision: one(query.revision), bundle: one(query.bundle), domain: one(query.domain) };
  const snapshot = snapshotWithContext(illustrativeSnapshot, context);
  const contextQuery = new URLSearchParams({ ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}) }).toString();
  const requestedKind = one(query.kind);
  const initialKind = requestedKind && ['all', 'input', 'effect', 'lifecycle'].includes(requestedKind) ? requestedKind : 'all';
  return <DocsShell active="/trust" snapshot={snapshot} context={context}><div className="doc-page trust-page"><PageIntro title="Where do obligations begin?" snapshot={snapshot}>{context.bundle ? 'A graph-backed trust index will appear after the requested snapshot is validated.' : 'Trust surfaces are places where data enters, is constrained, or leaves a processing boundary. This page explains the obligation without turning a source or sink into a vulnerability claim.'}</PageIntro>{context.bundle ? <><BundlePendingState snapshot={snapshot} context={context} subject="trust index" /><EvidenceNote>The requested bundle is not yet verified. Trust domains, locations, and counts remain hidden until its graph projection succeeds.</EvidenceNote></> : <><section className="trust-intro"><h2>Read the obligation, then inspect the evidence.</h2><p>Choose a surface by what it does—enters, protects, or leaves—then open its anchor in Lachesis for exact guards and references.</p></section><TrustGlossary context={context} initialQuery={one(query.q)} initialKind={initialKind} initialDomain={one(query.domain)} /><EvidenceNote>Illustrative taxonomy: the domains and locations below are a prototype index. Presence identifies where to investigate; it does not establish exploitability or a finding.</EvidenceNote><Link className="quiet-link" href={`/architecture${contextQuery ? `?${contextQuery}` : ''}`}>Return to Architecture <span aria-hidden="true">→</span></Link></>}</div></DocsShell>;
}
