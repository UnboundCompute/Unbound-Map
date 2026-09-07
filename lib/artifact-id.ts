export const FLOW_CARD_RENDERER_VERSION = '1';

export function flowCardHref(bundle: string, flow: string) {
  const query = new URLSearchParams({ renderer: FLOW_CARD_RENDERER_VERSION });
  return `/f/${encodeURIComponent(bundle)}/${encodeURIComponent(flow)}?${query.toString()}`;
}
