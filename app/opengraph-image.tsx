import { ImageResponse } from 'next/og';

export const alt = 'Unbound Map — read the system before the source';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function imageLabel(value: string, limit: number) {
  const singleLine = value.replace(/\s+/g, ' ').trim();
  return singleLine.length > limit ? `${singleLine.slice(0, limit - 1).trimEnd()}…` : singleLine;
}

export default async function OpenGraphImage({ searchParams }: { searchParams?: SearchParams } = {}) {
  const query = searchParams ? await searchParams : {};
  const repository = imageLabel(one(query.repository) ?? 'Repository', 44);
  const revision = one(query.revision) ? imageLabel(one(query.revision)!, 18) : undefined;
  const flow = one(query.flow) ? imageLabel(one(query.flow)!, 44) : undefined;
  const finding = one(query.finding) ? imageLabel(one(query.finding)!, 44) : undefined;
  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', height: '100%', padding: '68px 78px', color: '#202521', background: '#f4f1ea', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, color: '#667067', fontSize: 28, letterSpacing: 2 }}><span style={{ display: 'flex', width: 28, height: 28, border: '2px solid #202521', borderRadius: 99 }} /> UNBOUND MAP · HLD</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}><div style={{ display: 'flex', flexDirection: 'column', fontSize: 72, lineHeight: 1.05, letterSpacing: -3 }}>{finding ? `${finding}` : flow ? `${flow}` : repository}<br />{finding ? 'security witness.' : flow ? 'architectural path.' : 'before the source.'}</div><div style={{ display: 'flex', fontSize: 30, color: '#4f5c52' }}>{finding ? `Graph-backed evidence from ${repository}.` : flow ? `A source-linked path through ${repository}.` : 'A shareable architecture field guide for unfamiliar codebases.'}</div></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 22, borderTop: '2px solid #d3d0c8', color: '#8b4f27', fontSize: 26 }}><span>{revision ? `revision · ${revision}` : flow ? 'graph-backed flow' : 'repository architecture · flows / trust'}</span><span>unboundcompute</span></div>
    </div>,
    { ...size },
  );
}
