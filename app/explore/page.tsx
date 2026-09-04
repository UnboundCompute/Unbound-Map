import Link from 'next/link';
import type { Metadata } from 'next';
import { DocsShell, PageIntro } from '../components/DocsShell';
import { illustrativeSnapshot, snapshotWithContext, type SharedSnapshotContext } from '../../lib/view-model';

type SearchParams = Record<string, string | string[] | undefined>;
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export async function generateMetadata({ searchParams }: { searchParams?: Promise<SearchParams> }): Promise<Metadata> {
  const query = searchParams ? await searchParams : {};
  const repository = one(query.repository);
  const anchor = one(query.anchor);
  const label = repository ?? illustrativeSnapshot.repository;
  return { title: `${anchor ? `${anchor} · ` : ''}${label} handoff · Lachesis`, description: `Open ${anchor ?? 'the selected architecture context'} in Lachesis for ${label}, tied to the shared repository revision.` };
}

export default async function ExplorePage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const query = searchParams ? await searchParams : {};
  const context = { repository: one(query.repository), revision: one(query.revision), region: one(query.region), label: one(query.label), anchor: one(query.anchor), flow: one(query.flow), domain: one(query.domain), bundle: one(query.bundle) };
  const sharedContext: SharedSnapshotContext = { repository: context.repository, revision: context.revision, bundle: context.bundle };
  const snapshot = snapshotWithContext(illustrativeSnapshot, sharedContext);
  const hasContext = Boolean(context.repository || context.revision || context.region || context.anchor || context.flow || context.domain);
  const repository = context.repository ?? illustrativeSnapshot.repository;
  const revision = context.revision ?? illustrativeSnapshot.revision;
  const label = context.label ?? context.region ?? 'No region selected';
  const anchor = context.anchor ?? 'Choose an anchor from Architecture, Flows, or Trust';
  const sourceParams = new URLSearchParams({ repository, revision, ...(context.region ? { region: context.region } : {}), ...(context.label ? { label: context.label } : {}), ...(context.anchor ? { anchor: context.anchor } : {}), ...(context.flow ? { flow: context.flow } : {}), ...(context.domain ? { domain: context.domain } : {}), ...(context.bundle ? { bundle: context.bundle } : {}) });
  const lachesisUrl = `https://lachesis.unboundcompute.com/?${sourceParams.toString()}`;
  return <DocsShell active="/explore" snapshot={snapshot} context={sharedContext}><div className="doc-page handoff-page"><PageIntro title="Continue in Lachesis." snapshot={snapshot}>Design Map gives you the chapter. Lachesis gives you the paragraph: exact symbols, callers, callees, traces, and source evidence tied to the same repository revision.</PageIntro><section className={`handoff-card ${hasContext ? 'has-context' : ''}`} aria-labelledby="handoff-title"><div><p className="card-label">{hasContext ? 'Context ready' : 'No context selected'}</p><h2 id="handoff-title">{hasContext ? label : 'Choose a region or flow step first.'}</h2><p>{hasContext ? `Lachesis will open ${anchor} in ${repository} at ${revision}.` : 'The handoff will show exactly what Lachesis is about to open once you arrive from Architecture, Flows, or Trust.'}</p></div>{hasContext ? <a className="primary-button" href={lachesisUrl} target="_blank" rel="noreferrer">Open this context in Lachesis <span aria-hidden="true">↗</span></a> : <Link className="primary-button" href="/architecture">Choose from Architecture <span aria-hidden="true">→</span></Link>}</section>{hasContext && <dl className="handoff-context"><div><dt>repository</dt><dd>{repository}</dd></div><div><dt>revision</dt><dd><code>{revision}</code></dd></div><div><dt>anchor</dt><dd><code>{anchor}</code></dd></div>{context.flow && <div><dt>flow step</dt><dd>{context.flow}</dd></div>}{context.domain && <div><dt>trust domain</dt><dd>{context.domain}</dd></div>}</dl>}<section className="handoff-boundary" aria-labelledby="boundary-title"><h2 id="boundary-title">Keep the altitude clear.</h2><div className="boundary-grid"><div><strong>Design Map</strong><p>Orientation, architecture, vocabulary, canonical design flows, and trust-surface locations.</p></div><div><strong>Lachesis</strong><p>Function bodies, exact references, dynamic paths, taint reachability, and source evidence.</p></div></div></section></div></DocsShell>;
}
