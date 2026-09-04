import Link from 'next/link';
import type { Metadata } from 'next';
import { MapClient } from '../components/MapClient';
import { EmbedSnippet } from '../components/EmbedSnippet';
import { illustrativeSnapshot } from '../../lib/view-model';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const query = await searchParams;
  const repository = one(query.repository);
  const bundle = one(query.bundle);
  const label = repository ?? (bundle ? 'Graph-backed repository' : illustrativeSnapshot.repository);
  return { title: `${label} architecture map · Design Map`, description: `An embeddable high-level architecture map for ${label}.` };
}

export default async function EmbedPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const bundle = one(query.bundle);
  const repository = one(query.repository) ?? (bundle ? 'Graph-backed repository' : illustrativeSnapshot.repository);
  return <main className="embed-page"><header className="embed-header"><div><span className="embed-kicker">Design Map · HLD</span><h1>{repository} architecture</h1><p>Read the system shape before the source.</p></div><Link href="/architecture">Open full guide <span aria-hidden="true">↗</span></Link></header><MapClient route="/embed" /><EmbedSnippet /><footer className="embed-footer"><span>{bundle ? 'Graph-backed bundle requested' : `Illustrative snapshot · ${illustrativeSnapshot.revision}`}</span><Link href="/">About this map</Link></footer></main>;
}
