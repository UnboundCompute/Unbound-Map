import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsShell, EvidenceNote, PageIntro } from '../../components/DocsShell';
import { EmbedSnippet } from '../../components/EmbedSnippet';
import { MapClient } from '../../components/MapClient';
import { isLachesisBundle, projectTopLevelRegions, toDesignMapSnapshot } from '../../../lib/design-map';
import { loadHostedBundle, loadHostedRepository, type HostedRepositoryIndex } from '../../../lib/hosted';
import { snapshotFromProjection, type RepositorySnapshotView, type SharedSnapshotContext } from '../../../lib/view-model';

type Params = { repository?: string[] };

function routeContext(parts: string[]) {
  if (parts.length !== 2 && parts.length !== 3) return undefined;
  let decoded: string[];
  try {
    decoded = parts.map((part) => decodeURIComponent(part));
  } catch {
    return undefined;
  }
  const host = decoded.length === 2 ? 'github.com' : decoded[0];
  const owner = decoded.length === 2 ? decoded[0] : decoded[1];
  const revisionPart = decoded.length === 2 ? decoded[1] : decoded[2];
  const separator = revisionPart.indexOf('@');
  const repo = separator >= 0 ? revisionPart.slice(0, separator) : revisionPart;
  const revision = separator >= 0 ? revisionPart.slice(separator + 1) : undefined;
  if (!host || !owner || !repo || (revision !== undefined && !revision)) return undefined;
  return { host, owner, repo, revision };
}

function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '')
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
}

function canonicalPath(parts: string[]) {
  return `/r/${parts.map((part) => encodeURIComponent(part)).join('/')}`;
}

function latestPathParts(parts: string[]) {
  if (parts.length === 2) return [parts[0], parts[1].split('@', 1)[0]];
  return [parts[0], parts[1], parts[2].split('@', 1)[0]];
}

function fallbackMetadata(parts: string[]): Metadata {
  const canonical = `${siteOrigin()}${canonicalPath(parts)}`;
  return { title: 'Repository publication · Unbound Map', description: 'A curated, revision-addressed repository architecture guide.', alternates: { canonical }, robots: { index: false, follow: true } };
}

function isCurated(index: HostedRepositoryIndex) {
  return Boolean(index.curated_tour && typeof index.curated_tour === 'object' && !Array.isArray(index.curated_tour));
}

type VerifiedMaintainer = { name: string; url?: string };

function verifiedMaintainer(value: unknown): VerifiedMaintainer | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const candidate = value as Record<string, unknown>;
  if (candidate.verified !== true || typeof candidate.name !== 'string' || !candidate.name.trim()) return undefined;
  if (candidate.url !== undefined) {
    if (typeof candidate.url !== 'string') return undefined;
    try {
      const url = new URL(candidate.url);
      if (!['http:', 'https:'].includes(url.protocol)) return undefined;
    } catch {
      return undefined;
    }
  }
  return { name: candidate.name.trim(), ...(typeof candidate.url === 'string' ? { url: candidate.url } : {}) };
}

async function loadPublication(parts: string[]) {
  const context = routeContext(parts);
  if (!context || !process.env.NEXT_PUBLIC_BUNDLE_API_URL?.trim()) return undefined;
  const index = await loadHostedRepository(context.host, context.owner, context.repo, context.revision);
  if (!isCurated(index)) return undefined;
  const bundle = await loadHostedBundle(index.bundle_id);
  if (!isLachesisBundle(bundle)) throw new Error('The curated repository bundle is invalid.');
  const projection = toDesignMapSnapshot(bundle);
  return {
    context,
    index,
    bundleId: index.bundle_id,
    snapshot: snapshotFromProjection(projection, projectTopLevelRegions(projection)),
  };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const parts = (await params).repository ?? [];
  const fallback = fallbackMetadata(parts);
  try {
    const publication = await loadPublication(parts);
    if (!publication) return fallback;
    const label = publication.index.repository?.replace(`${publication.context.host}/`, '') || `${publication.context.owner}/${publication.context.repo}`;
    const revision = publication.index.revision || publication.context.revision;
    const revisionText = revision ? ` at revision ${revision}` : '';
    const title = `${label}${revisionText} · Unbound Map`;
    const description = publication.snapshot.description ?? `A curated architecture guide to ${label}${revisionText}, generated from a validated Lachesis graph.`;
    const canonical = `${siteOrigin()}${canonicalPath(latestPathParts(parts))}`;
    const imageQuery = new URLSearchParams({ repository: label, ...(revision ? { revision } : {}) }).toString();
    return { title, description, alternates: { canonical }, openGraph: { title, description, type: 'article', url: canonical, images: [{ url: `/opengraph-image?${imageQuery}`, alt: `${label} architecture · Unbound Map` }] }, twitter: { card: 'summary_large_image', title, description, images: [`/opengraph-image?${imageQuery}`] }, robots: { index: !publication.context.revision, follow: true } };
  } catch {
    return fallback;
  }
}

export default async function PublishedRepositoryPage({ params }: { params: Promise<Params> }) {
  const parts = (await params).repository ?? [];
  let publication: Awaited<ReturnType<typeof loadPublication>>;
  try {
    publication = await loadPublication(parts);
  } catch {
    notFound();
  }
  if (!publication) notFound();
  const { context: route, index, snapshot, bundleId } = publication;
  const curatedTour = index.curated_tour && typeof index.curated_tour === 'object' && !Array.isArray(index.curated_tour)
    ? index.curated_tour as Record<string, unknown>
    : undefined;
  const maintainer = verifiedMaintainer(curatedTour?.maintainer);
  const repository = index.repository?.replace(`${route.host}/`, '') || `${route.owner}/${route.repo}`;
  const revision = index.revision || route.revision || snapshot.revision;
  const context: SharedSnapshotContext = { repository, revision, bundle: bundleId };
  const contextQuery = new URLSearchParams({ repository, revision, bundle: bundleId }).toString();
  const architectureLede = snapshot.description ?? `A bounded, graph-backed architecture guide for ${repository} at the pinned revision ${revision}.`;
  const canonical = `${siteOrigin()}${canonicalPath(latestPathParts(parts))}`;
  const structuredData = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'TechArticle', '@id': `${canonical}#article`, headline: `${repository} architecture`, description: architectureLede, url: canonical, mainEntityOfPage: canonical, about: { '@type': 'SoftwareSourceCode', name: repository }, version: revision },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Unbound Map', item: `${siteOrigin()}/` },
      { '@type': 'ListItem', position: 2, name: repository, item: canonical },
    ] },
  ] };
  return <DocsShell active="/architecture" snapshot={snapshot} context={context}><div className="doc-page architecture-page"><PageIntro eyebrow="Curated repository publication" title={`${repository} architecture`} snapshot={snapshot}>{architectureLede}</PageIntro><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />{maintainer ? <aside className="publication-note" aria-label="Maintainer verification"><p><strong>Maintainer verified.</strong> {maintainer.url ? <a href={maintainer.url} target="_blank" rel="noreferrer">{maintainer.name}</a> : maintainer.name} explicitly verified this publication context. This does not turn the map into a security or correctness guarantee.</p></aside> : <aside className="publication-note" aria-label="Publication status"><p><strong>Curated publication.</strong> This map passed the publication curation gate; no maintainer verification is claimed.</p></aside>}<MapClient initialBundle={bundleId} initialSnapshot={snapshot} initialQuery={`?${contextQuery}`} /><EmbedSnippet context={context} /><section className="architecture-next"><h2>Map before source.</h2><p>Placement is a reading aid. Labels, counts, relationships, revision, and coverage come from the validated snapshot; exact symbol behavior belongs in Lachesis.</p><div className="flow-stage-links"><Link className="quiet-link" href={`https://lachesis.unboundcompute.com/?${contextQuery}`} target="_blank" rel="noreferrer">Continue to Lachesis with this snapshot <span aria-hidden="true">↗</span></Link><Link className="quiet-link" href="/" aria-label="Map another repository">Map another repository <span aria-hidden="true">→</span></Link></div></section><EvidenceNote>This curated page is generated from a validated Lachesis projection at the pinned revision. It is not a vulnerability claim or maintainer endorsement unless the publication record says so.</EvidenceNote></div></DocsShell>;
}
