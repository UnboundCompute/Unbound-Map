import type { MetadataRoute } from 'next';

function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
}

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  const routes = ['/'];
  return routes.map((route) => ({ url: `${origin}${route}`, changeFrequency: 'weekly', priority: route === '/' ? 1 : route === '/embed' ? 0.7 : 0.8 }));
}
