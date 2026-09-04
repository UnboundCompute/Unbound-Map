import Link from 'next/link';
import type { Metadata } from 'next';
import { DocsShell, EvidenceNote, PageIntro } from './components/DocsShell';
import { illustrativeSnapshot, snapshotWithContext, type SharedSnapshotContext } from '../lib/view-model';
import { documentMetadata } from '../lib/seo';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const repository = one((await searchParams).repository);
  const label = repository ?? illustrativeSnapshot.repository;
  return documentMetadata(`${label} · Design Map`, `See ${label}'s structure, responsibilities, and first architectural path before reading the source.`);
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const context: SharedSnapshotContext = { repository: one(query.repository), revision: one(query.revision), bundle: one(query.bundle) };
  const snapshot = snapshotWithContext(illustrativeSnapshot, context);
  const contextQuery = new URLSearchParams({ ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}) }).toString();
  const contextual = (href: string) => `${href}${contextQuery ? `?${contextQuery}` : ''}`;
  return <DocsShell active="/" snapshot={snapshot} context={context}>
    <div className="doc-page start-page">
      <PageIntro title={`${snapshot.repository}: see the system before you read it.`} snapshot={snapshot}>
        {snapshot.repository} turns network traffic into structured protocol state, runs a wide detection stage across it, and emits alerts and telemetry. This is the short architectural orientation before the source.
      </PageIntro>
      <section className="thesis-block" aria-labelledby="thesis-title"><div className="thesis-label">The structural idea</div><h2 id="thesis-title">A long packet-processing path with a broad detection stage in the middle.</h2><p>Start at the wire, follow the handoffs, then choose the region that answers your question. The map names responsibilities; Lachesis opens the exact implementation.</p></section>
      <section className="start-map-preview" aria-labelledby="preview-title"><div className="section-heading-row"><div><h2 id="preview-title">The route through the repository</h2><p>One glance gives you the shape. Select a stage to focus its responsibility in Architecture.</p></div><Link className="quiet-link" href={contextual('/architecture')}>Open Architecture <span aria-hidden="true">→</span></Link></div><nav className="macro-path" aria-label="Network input to output architecture path">{[['wire', 'input'], ['decode', 'decode'], ['flow + stream', 'core'], ['protocols', 'protocols'], ['detect', 'detect'], ['output', 'output']].map(([label, region], index) => <Link key={label} href={`/architecture?region=${region}&level=1${contextQuery ? `&${contextQuery}` : ''}`} className={index === 4 ? 'path-emphasis' : ''}>{label}</Link>)}</nav><p className="map-caption">The detection stage is intentionally wider: it is where protocol-aware rules, prefilters, and matchers meet the normalized stream.</p></section>
      <section className="reading-start" aria-labelledby="start-title"><div className="section-heading-row"><div><h2 id="start-title">Choose a way in</h2><p>Each page answers one question. You can leave and come back without losing repository context.</p></div></div><div className="start-links"><Link href={contextual('/architecture')} className="start-link"><span className="start-number">01</span><span><strong>Find a responsibility</strong><small>See the bounded system map and region chapters.</small></span><span className="link-arrow" aria-hidden="true">↗</span></Link><Link href={contextual('/flows')} className="start-link"><span className="start-number">02</span><span><strong>Follow a packet</strong><small>Walk one canonical path from bytes to flow state.</small></span><span className="link-arrow" aria-hidden="true">↗</span></Link><Link href={contextual('/trust')} className="start-link"><span className="start-number">03</span><span><strong>Understand an obligation</strong><small>Use the glossary to locate trust surfaces without calling them findings.</small></span><span className="link-arrow" aria-hidden="true">↗</span></Link></div></section>
      <EvidenceNote>Illustrative prototype: repository facts and {snapshot.repository} wording here are a content fixture until a graph-backed snapshot is connected. Structural claims should carry the loaded revision and coverage when published.</EvidenceNote>
    </div>
  </DocsShell>;
}
