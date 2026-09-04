import type { MetadataRoute } from 'next';

/** Keep the public reading guide discoverable; deployment can add a host-specific sitemap later. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' } };
}
