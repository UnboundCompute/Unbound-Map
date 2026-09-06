import { readFile } from 'node:fs/promises';

const origin = (process.env.DESIGN_MAP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
// A bundle id only needs to exist for the browser to resolve the graph; the
// server-rendered HTML shows the awaiting/loading state regardless, so these
// route assertions do not depend on a live bundle API. Point SMOKE_BUNDLE at a
// real cached bundle when running the full browser-backed validation.
const bundle = process.env.SMOKE_BUNDLE ?? 'b_smoketest0000';
const ctx = `repository=Flask&revision=main&bundle=${bundle}`;
const enc = bundle.replace(/&/g, '&amp;');

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
  const ids = [...body.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) throw new Error(`${path} rendered duplicate IDs: ${[...new Set(duplicateIds)].join(', ')}`);
  console.log(`ok ${path}`);
}

async function pageWithout(path, forbidden) {
  const response = await fetch(`${origin}${path}`);
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  const body = await response.text();
  for (const marker of forbidden) {
    if (body.includes(marker)) throw new Error(`${path} unexpectedly contains ${JSON.stringify(marker)}`);
  }
  console.log(`ok ${path} (no placeholder content)`);
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
  const location = response.headers.get('location') ?? '';
  if (!location.includes(target)) throw new Error(`${path} redirected to ${location}, expected ${target}`);
  console.log(`ok ${path} → ${location}`);
}

// A no-bundle deep link is gated: the proxy sends it back to the repository picker.
async function redirectHome(path) {
  const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
  if (![301, 302, 307, 308].includes(response.status)) throw new Error(`${path} returned HTTP ${response.status}, expected a gate redirect`);
  const location = new URL(response.headers.get('location') ?? '', origin);
  if (location.pathname !== '/' || location.search) throw new Error(`${path} did not redirect to the bare picker (got ${location.pathname}${location.search})`);
  console.log(`ok ${path} → / (selection gate)`);
}

// 1. The selection gate: the bare map opens on the repository picker only.
await page('/', ['Choose a repository to begin', 'class="launcher"', 'Enter a repository URL', 'Select a cached repository']);
await pageWithout('/', ['map-workbench', 'class="bar-lachesis"', 'Suricata', 'Packet input', 'wire input']);

// 2. Every non-home surface is gated behind a bundle: no bundle → back to the picker.
for (const route of ['/architecture', '/flows', '/trust', '/explore', '/embed', '/map', '/flow']) {
  await redirectHome(route);
  await redirectHome(`${route}?repository=Flask&revision=main`);
}
// Region chapters and nested flow paths are gated too.
await redirectHome('/architecture/some-region');
await redirectHome('/flows/some-flow');

// 3. A shared deep link that carries a bundle renders (this is the shared-link path).
await page(`/?${ctx}`, ['architecture snapshot', 'Repository shape', 'The map appears only after its graph projection passes validation', 'Explore architecture', 'Open in Lachesis', `bundle=${enc}`]);
await page(`/architecture?${ctx}`, ['What are the major responsibilities', 'A graph-backed bundle was requested', 'Loading graph snapshot', 'Preparing the architecture map']);
await pageWithout(`/architecture?${ctx}`, ['Suricata', 'Packet input', 'wire input', 'runtime spine', 'Illustrative']);
await page(`/flows?${ctx}`, ['Which path explains this repository?']);
await pageWithout(`/flows?${ctx}`, ['Suricata', 'packet-decode', 'validated IPv4 payload', 'Illustrative']);
await page(`/f/${bundle}/main-path`, ['Bundle-pinned flow card', 'A path worth reading.', `bundle=${enc}`]);
await page(`/trust?${ctx}`, ['What evidence needs a closer read?']);
await pageWithout(`/trust?${ctx}`, ['Memory safety', 'Illustrative taxonomy', 'Suricata']);
await page(`/embed?${ctx}`, ['Flask architecture', 'Skip to map', 'id="embed-content"', 'Graph-backed bundle requested']);
await pageWithout(`/embed?${ctx}`, ['Suricata', 'Illustrative snapshot']);

// 4. Legacy aliases keep working when they carry a bundle.
await redirect(`/map?${ctx}`, '/architecture');
await redirect(`/flow?${ctx}`, '/flows');

// 5. Metadata, preview image, and discovery documents.
await image('/opengraph-image?repository=Flask&revision=main');
await page(`/architecture?${ctx}`, ['<meta property="og:title" content="Flask architecture · Unbound Map"', '<meta name="twitter:title" content="Flask architecture · Unbound Map"']);
await xml('/sitemap.xml', ['<loc>http://localhost:3000/']);

// 6. The superseded snapshot-state implementation must be gone from the shell.
const shellSource = await readFile(new URL('../app/components/DocsShell.tsx', import.meta.url), 'utf8');
if (shellSource.includes('export function SnapshotState')) throw new Error('superseded SnapshotState implementation remains in the shell');
if (shellSource.includes('illustrativeSnapshot')) throw new Error('illustrative snapshot reference remains in the shell');

console.log('\nall route smoke checks passed');
