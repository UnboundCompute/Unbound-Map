import Link from 'next/link';
import type { Metadata } from 'next';
import { DocsShell, EvidenceNote, PageIntro } from '../components/DocsShell';
import { MapClient } from '../components/MapClient';
import { EmbedSnippet } from '../components/EmbedSnippet';
import { illustrativeSnapshot, snapshotWithContext, type SharedSnapshotContext } from '../../lib/view-model';
import { documentMetadata } from '../../lib/seo';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const repository = one((await searchParams).repository);
  const label = repository ?? illustrativeSnapshot.repository;
  const query = await searchParams;
  return documentMetadata(`${label} architecture · Design Map`, `Explore ${label}'s bounded responsibilities, relationships, and region chapters before opening the source.`, { repository, revision: one(query.revision) });
}

export default async function ArchitecturePage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const context: SharedSnapshotContext = { repository: one(query.repository), revision: one(query.revision), bundle: one(query.bundle) };
  const snapshot = snapshotWithContext(illustrativeSnapshot, context);
  const contextQuery = new URLSearchParams({ ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}) }).toString();
  const initialQuery = new URLSearchParams({ ...(contextQuery ? Object.fromEntries(new URLSearchParams(contextQuery).entries()) : {}), ...(one(query.region) ? { region: one(query.region)! } : {}), ...(one(query.level) ? { level: one(query.level)! } : {}), ...(one(query.anchor) ? { anchor: one(query.anchor)! } : {}) }).toString();
  const initialLevel = one(query.level) === '1' || one(query.level) === '2' ? one(query.level)! : '0';
  return <DocsShell active="/architecture" snapshot={snapshot} context={context}><div className="doc-page architecture-page"><PageIntro title="What are the major responsibilities?" snapshot={snapshot}>The first map is deliberately bounded. It shows the regions that carry {snapshot.repository} from network input to detection and output, then lets you focus one region at a time.</PageIntro><MapClient initialBundle={context.bundle} initialLevel={initialLevel} initialRegion={one(query.region) ?? 'decode'} initialQuery={initialQuery ? `?${initialQuery}` : ''} /><EmbedSnippet context={context} /><section className="architecture-next"><h2>Map before source.</h2><p>Placement is a reading aid. Labels, counts, and anchors should come from the loaded graph snapshot; exact symbol behavior belongs in Lachesis.</p><Link className="quiet-link" href={`/flows${contextQuery ? `?${contextQuery}` : ''}`}>Follow the packet flow <span aria-hidden="true">→</span></Link></section><EvidenceNote>Illustrative prototype: this eight-region map is editorial fixture content. A graph-backed bundle may produce a different shape, number of regions, and coverage scope.</EvidenceNote></div></DocsShell>;
}
