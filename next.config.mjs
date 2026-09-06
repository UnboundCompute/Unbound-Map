import { fileURLToPath } from 'node:url';

// Keep this in sync with bundleApiOrigin() in lib/links.ts. The browser cannot
// call the bundle API directly because that origin serves no CORS headers, so
// the client speaks to this app's own origin and these rewrites forward the
// request to the bundle API server-side, where the same-origin policy does not
// apply.
const DEFAULT_BUNDLE_API_URL = 'https://56h5zgua56.execute-api.us-east-1.amazonaws.com';
function bundleApiOrigin() {
  const configured = process.env.NEXT_PUBLIC_BUNDLE_API_URL?.trim();
  if (!configured) return DEFAULT_BUNDLE_API_URL;
  try {
    const parsed = new URL(configured);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) return DEFAULT_BUNDLE_API_URL;
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return DEFAULT_BUNDLE_API_URL;
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: { root: fileURLToPath(new URL('.', import.meta.url)) },
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${bundleApiOrigin()}/api/:path*` }];
  },
};

export default nextConfig;
