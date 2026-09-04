import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')),
  title: 'Design Map — Read this before the source',
  description: 'A shareable, revision-addressed architecture field guide for understanding unfamiliar codebases before reading the source.',
  applicationName: 'Design Map',
  authors: [{ name: 'Unbound Compute' }],
  keywords: ['software architecture', 'codebase documentation', 'HLD', 'open source', 'repository map'],
  openGraph: { title: 'Design Map — Read this before the source', description: 'See a repository’s structure, responsibilities, flows, and trust surfaces before opening the source.', type: 'article', images: [{ url: '/opengraph-image', alt: 'Design Map — read the system before the source' }] },
  twitter: { card: 'summary_large_image', title: 'Design Map — Read this before the source', description: 'A shareable architecture field guide for unfamiliar codebases.', images: [{ url: '/opengraph-image', alt: 'Design Map — read the system before the source' }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = { '@context': 'https://schema.org', '@type': 'TechArticle', headline: 'Design Map — Read this before the source', description: 'A shareable architecture field guide for understanding unfamiliar codebases before reading the source.', author: { '@type': 'Organization', name: 'Unbound Compute' }, about: { '@type': 'Thing', name: 'Software architecture documentation' } };
  return (
    <html lang="en">
      <body>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></body>
    </html>
  );
}
