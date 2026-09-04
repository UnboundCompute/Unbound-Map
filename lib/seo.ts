import type { Metadata } from 'next';

/** Keep browser titles and social previews aligned with the same document context. */
export function documentMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    openGraph: { title, description, type: 'article', images: ['/opengraph-image'] },
    twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image'] },
  };
}
