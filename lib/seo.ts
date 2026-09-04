import type { Metadata } from 'next';

/** Keep browser titles and social previews aligned with the same document context. */
export function documentMetadata(title: string, description: string): Metadata {
  const image = { url: '/opengraph-image', alt: `${title} — Design Map architecture guide` };
  return {
    title,
    description,
    openGraph: { title, description, type: 'article', images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}
