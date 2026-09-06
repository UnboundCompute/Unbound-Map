import type { MetadataRoute } from 'next';
import { loadHostedRepositories } from '../lib/hosted';

function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
}

function publishedPath(repository: string | undefined, revision: string | undefined) {
  if (!repository || !revision || !/^[0-9a-f]{7,64}$/i.test(revision)) return undefined;
  const parts = repository.split('/').filter(Boolean);
  const [host, owner, repo] = parts.length === 2 ? ['github.com', parts[0], parts[1]] : parts.length === 3 ? parts : [];
  if (!host || !owner || !repo || !['github.com', 'gitlab.com', 'bitbucket.org'].includes(host) || !/^[A-Za-z0-9._-]{1,100}$/.test(owner) || !/^[A-Za-z0-9._-]{1,100}$/.test(repo)) return undefined;
  // The indexed URL is the latest approved publication. The revision is used
  // only to prove that the catalog entry is immutable enough to publish.
  const routeParts = host === 'github.com' ? [owner, repo] : [host, owner, repo];
  return `/r/${routeParts.map((part) => encodeURIComponent(part)).join('/')}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  let routes = ['/'];
  if (process.env.NEXT_PUBLIC_BUNDLE_API_URL?.trim()) {
    try {
      const repositories = await loadHostedRepositories();
      const published = repositories
        .filter((item) => Boolean(item.curated_tour && typeof item.curated_tour === 'object' && !Array.isArray(item.curated_tour)))
        .map((item) => publishedPath(item.repository, item.revision))
        .filter((route): route is string => Boolean(route));
      routes = [...routes, ...published];
    } catch {
      // Keep the sitemap limited to the stable home page when the catalog is unavailable.
    }
  }
  return routes.map((route) => ({ url: `${origin}${route}`, changeFrequency: 'weekly', priority: route === '/' ? 1 : route === '/embed' ? 0.7 : 0.8 }));
}
