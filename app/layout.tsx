import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Design Map — Read this before the source',
  description: 'A shareable, revision-addressed architecture field guide for understanding unfamiliar codebases before reading the source.',
  applicationName: 'Design Map',
  authors: [{ name: 'Unbound Compute' }],
  keywords: ['software architecture', 'codebase documentation', 'HLD', 'open source', 'repository map'],
  openGraph: { title: 'Design Map — Read this before the source', description: 'See a repository’s structure, responsibilities, flows, and trust surfaces before opening the source.', type: 'article' },
  twitter: { card: 'summary', title: 'Design Map — Read this before the source', description: 'A shareable architecture field guide for unfamiliar codebases.' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
