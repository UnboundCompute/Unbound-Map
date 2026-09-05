import { readFile } from 'node:fs/promises';

const origin = (process.env.DESIGN_MAP_URL ?? 'http://localhost:3000').replace(/\/$/, '');

async function page(path, expected) {
  const response = await fetch(`${origin}${path}`);
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  const body = await response.text();
  for (const marker of expected) {
    if (!body.includes(marker)) throw new Error(`${path} is missing ${JSON.stringify(marker)}`);
  }
  const h1Count = (body.match(/<h1\b/g) ?? []).length;
  if (h1Count !== 1) throw new Error(`${path} rendered ${h1Count} h1 elements; expected exactly one`);
  if (!body.includes('<main')) throw new Error(`${path} is missing its main landmark`);
  console.log(`ok ${path}`);
}

async function pageWithout(path, forbidden) {
  const response = await fetch(`${origin}${path}`);
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  const body = await response.text();
  for (const marker of forbidden) {
    if (body.includes(marker)) throw new Error(`${path} unexpectedly contains ${JSON.stringify(marker)}`);
  }
  console.log(`ok ${path} (without fixture fallback)`);
}

async function image(path) {
  const response = await fetch(`${origin}${path}`);
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/png')) throw new Error(`${path} did not return a PNG preview image`);
  console.log(`ok ${path} (contextual preview image)`);
}

async function xml(path, expected) {
  const response = await fetch(`${origin}${path}`);
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  const body = await response.text();
  for (const marker of expected) {
    if (!body.includes(marker)) throw new Error(`${path} is missing ${JSON.stringify(marker)}`);
  }
  console.log(`ok ${path} (discovery document)`);
}

async function redirect(path, target) {
  const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
  if (![301, 302, 307, 308].includes(response.status)) throw new Error(`${path} returned HTTP ${response.status}, expected redirect`);
  if (!response.headers.get('location')?.includes(target)) throw new Error(`${path} does not redirect to ${target}`);
  console.log(`ok ${path} → ${response.headers.get('location')}`);
}

await page('/?repository=Zeek&revision=main&bundle=b_demo123', ['Zeek architecture snapshot', 'Graph-backed bundle requested', 'Awaiting a verified repository map.', 'Open Architecture loader', 'Open Lachesis context', 'opengraph-image?repository=Zeek&amp;revision=main&amp;bundle=b_demo123', 'full revision', 'Not supplied by snapshot', 'href="/explore?repository=Zeek&amp;revision=main&amp;bundle=b_demo123"']);
await pageWithout('/?repository=Zeek&revision=main&bundle=b_demo123', ['Suricata turns network traffic', 'The structural idea', 'A long packet-processing path']);
await page('/', ['Suricata, before the source.', 'Follow a packet', 'Open Architecture']);
await pageWithout('/', ['class="bar-lachesis"']);
const shellSource = await readFile(new URL('../app/components/DocsShell.tsx', import.meta.url), 'utf8');
if (shellSource.includes('export function SnapshotState')) throw new Error('superseded SnapshotState implementation remains in the shell');
await image('/opengraph-image?repository=Zeek&revision=main');
await page('/architecture?repository=Zeek&revision=main&region=decode&level=2&anchor=DecodeEthernet%28%29', ['Design anchors', 'DecodeEthernet()', 'aria-current="true"', '<meta property="og:title" content="Zeek architecture · Design Map"', 'opengraph-image?repository=Zeek&amp;revision=main', 'href="https://lachesis.unboundcompute.com/?repository=Zeek&amp;revision=main&amp;region=decode&amp;anchor=DecodeEthernet%28%29', '<meta name="twitter:title" content="Zeek architecture · Design Map"']);
await page('/architecture', ['receives from', 'hands off to', 'The projection, in words']);
await page('/architecture?repository=Zeek&revision=main&bundle=b_demo123', ['A graph-backed bundle was requested', 'Preparing the architecture map', 'opengraph-image?repository=Zeek&amp;revision=main&amp;bundle=b_demo123']);
await pageWithout('/architecture?repository=Zeek&revision=main&bundle=b_demo123', ['Illustrative prototype: this eight-region map is editorial fixture content.']);
await page('/flows?repository=Zeek&revision=main&step=ipv4', ['validated IPv4 payload', 'step=ipv4', 'flow-path-map', 'href="/explore?repository=Zeek&amp;revision=main&amp;region=decode&amp;label=validated+IPv4+payload&amp;flow=packet-decode&amp;step=ipv4&amp;anchor=DecodeIPV4%28%29"', '<meta property="og:title" content="Zeek architectural flows · Design Map"', '<meta name="twitter:title" content="Zeek architectural flows · Design Map"']);
await page('/flows?repository=Zeek&revision=main&bundle=b_demo123', ['Graph-backed bundle requested', 'Open Architecture loader', 'Open Lachesis context', 'opengraph-image?repository=Zeek&amp;revision=main&amp;bundle=b_demo123']);
await pageWithout('/flows?repository=Zeek&revision=main&bundle=b_demo123', ['Packet bytes → validated layers → flow state', 'Read all five handoffs as text']);
await page('/flows?step=missing-step', ['requested step is not in this flow']);
await page('/flows?branch=runtime', ['Runtime flow dispatch', 'aria-pressed="true"', 'Observed state selects the parser path.']);
await page('/flows/packet-decode?repository=Zeek&revision=main&bundle=b_demo123&step=ipv4', ['Graph-backed bundle requested', 'Open Architecture loader', 'Open Lachesis context', 'opengraph-image?repository=Zeek&amp;revision=main&amp;bundle=b_demo123']);
await pageWithout('/flows/packet-decode?repository=Zeek&revision=main&bundle=b_demo123&step=ipv4', ['validated IPv4 payload', 'Read all five handoffs as text']);
await page('/trust?repository=Zeek&revision=main&q=memory&kind=input', ['value="memory"', 'value="input"', 'Memory safety', '<meta property="og:title" content="Zeek trust surfaces · Design Map"', '<meta name="twitter:title" content="Zeek trust surfaces · Design Map"']);
await page('/trust?repository=Zeek&revision=main&domain=memory-safety', ['id="memory-safety"', 'id="memory-safety-title"', 'Selected trust domain.', 'Memory safety']);
await page('/trust?repository=Zeek&revision=main&bundle=b_demo123', ['Graph-backed bundle requested', 'Open Architecture loader', 'Open Lachesis context', 'opengraph-image?repository=Zeek&amp;revision=main&amp;bundle=b_demo123']);
await pageWithout('/trust?repository=Zeek&revision=main&bundle=b_demo123', ['Memory safety', 'Illustrative taxonomy']);
await page('/explore?repository=Zeek&revision=main&region=decode&anchor=DecodeIPV4%28%29&bundle=b_demo123', ['Context ready', 'DecodeIPV4()', 'b_demo123', 'aria-label="Open DecodeIPV4() in Lachesis in a new tab"', 'href="/explore?repository=Zeek&amp;revision=main&amp;bundle=b_demo123&amp;region=decode&amp;anchor=DecodeIPV4%28%29"']);
await page('/explore?region=decode&anchor=DecodeIPV4%28%29', ['href="https://lachesis.unboundcompute.com/?repository=Suricata&amp;revision=8f4c1b2&amp;region=decode&amp;anchor=DecodeIPV4%28%29"']);
await page('/embed?repository=Zeek&revision=main&bundle=b_demo123', ['Zeek architecture', 'Graph-backed bundle requested', 'Preparing the architecture map', 'Skip to map', 'id="embed-content"']);
await page('/embed?repository=Zeek&revision=main&region=decode&level=2&anchor=DecodeEthernet%28%29', ['Zeek architecture', 'Design anchors', 'DecodeEthernet()', 'id="embed-content"']);
await page('/architecture?region=unknown&level=1', ['requested region is not present']);
await page('/architecture/not-a-region', ['Region context unavailable', 'aria-atomic="true"']);
await page('/architecture?region=decode&level=2&anchor=MissingAnchor%28%29', ['requested anchor is not present']);
await page('/architecture/decode', ['Inputs and outputs', 'Validated payload window', 'Key structures and state', 'href="/architecture?region=decode&amp;level=1"', 'href="https://lachesis.unboundcompute.com/?repository=Suricata&amp;revision=8f4c1b2&amp;region=decode&amp;label=Packet+decode&amp;anchor=DecodeEthernet%28%29"']);
await page('/architecture/decode?repository=Zeek&revision=main&bundle=b_demo123', ['Graph-backed chapter unavailable', 'will not substitute an illustrative chapter', '<meta property="og:title" content="Architecture region · Zeek"']);
await pageWithout('/architecture/decode?repository=Zeek&revision=main&bundle=b_demo123', ['What this region owns', 'Validated payload window']);
await redirect('/map?region=decode&level=1', '/architecture?region=decode&level=1');
await redirect('/flow?step=ipv4', '/flows?step=ipv4');
await xml('/sitemap.xml', ['<loc>http://localhost:3000/explore</loc>']);
