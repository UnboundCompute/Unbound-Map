import type { MetadataRoute } from 'next';
import { loadHostedRepositories } from '../lib/hosted';
import { approvedCanonicalRoutes } from '../lib/sitemap';

function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  let routes = ['/'];
  if (process.env.NEXT_PUBLIC_BUNDLE_API_URL?.trim()) {
    try {
      const repositories = await loadHostedRepositories();
      routes = [...new Set([...routes, ...approvedCanonicalRoutes(repositories)])];
    } catch {
      // Keep the sitemap limited to the stable home page when the catalog is unavailable.
    }
  }
  return routes.map((route) => ({ url: `${origin}${route}`, changeFrequency: 'weekly', priority: route === '/' ? 1 : route === '/embed' ? 0.7 : 0.8 }));
}
