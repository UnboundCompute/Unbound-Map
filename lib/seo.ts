import type { Metadata } from 'next';

/** Keep browser titles and social previews aligned with the same document context. */
export function documentMetadata(title: string, description: string, context: { repository?: string; revision?: string; bundle?: string; flow?: string } = {}): Metadata {
  const imageQuery = new URLSearchParams({ ...(context.repository ? { repository: context.repository } : {}), ...(context.revision ? { revision: context.revision } : {}), ...(context.bundle ? { bundle: context.bundle } : {}), ...(context.flow ? { flow: context.flow } : {}) }).toString();
  const image = { url: `/opengraph-image${imageQuery ? `?${imageQuery}` : ''}`, alt: `${title} — Unbound Map architecture guide` };
  return {
    title,
    description,
    // Bundle/query URLs are shareable working artifacts, not approved
    // repository publications. Keep them discoverable through links while
    // withholding them from search until a canonical approval route exists.
    ...(context.bundle ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, type: 'article', images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}
