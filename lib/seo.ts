import type { Metadata } from 'next';

/** Keep browser titles and social previews aligned with the same document context. */
export function documentMetadata(title: string, description: string, context: { repository?: string; revision?: string; bundle?: string } = {}): Metadata {
  const imageQuery = new URLSearchParams({ ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}) }).toString();
  const image = { url: `/opengraph-image${imageQuery ? `?${imageQuery}` : ''}`, alt: `${title} — Unbound Map architecture guide` };
  return {
    title,
    description,
    openGraph: { title, description, type: 'article', images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}
