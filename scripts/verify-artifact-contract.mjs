import assert from 'node:assert/strict';
import fs from 'node:fs';

const mapClient = fs.readFileSync(new URL('../app/components/MapClient.tsx', import.meta.url), 'utf8');
const flowGuide = fs.readFileSync(new URL('../app/components/HostedFlowGuide.tsx', import.meta.url), 'utf8');
const embed = fs.readFileSync(new URL('../app/components/EmbedSnippet.tsx', import.meta.url), 'utf8');
const openGraph = fs.readFileSync(new URL('../app/opengraph-image.tsx', import.meta.url), 'utf8');
const publication = fs.readFileSync(new URL('../app/r/[...repository]/page.tsx', import.meta.url), 'utf8');
const docsShell = fs.readFileSync(new URL('../app/components/DocsShell.tsx', import.meta.url), 'utf8');
const trust = fs.readFileSync(new URL('../app/components/HostedTrustGlossary.tsx', import.meta.url), 'utf8');
const artifactIds = fs.readFileSync(new URL('../lib/artifact-id.ts', import.meta.url), 'utf8');

for (const [label, source, terms] of [
  ['architecture poster', mapClient, ['Download landscape SVG', 'Download portrait SVG', 'graph-backed projection', 'revision ·']],
  ['Mermaid export', mapClient, ['Copy Mermaid', 'flowchart LR', 'linkSnapshot.revision']],
  ['ARCHITECTURE.md export', mapClient, ['Download ARCHITECTURE.md', 'Revision-pinned architecture reading guide', 'Repository:', 'Revision:']],
  ['flow card', flowGuide, ['Open flow card', 'artifactMarkdown', 'bundle.meta.repository', 'bundle.meta.revision']],
  ['README badge', embed, ['README badge Markdown', 'previewQuery', 'architecture field guide']],
  ['repository publication', publication, ['Continue to Lachesis with this snapshot', 'Map another repository']],
  ['shared documentation shell', docsShell, ['Continue to Lachesis', 'Map another repository', 'docs-footer-actions']],
  ['security witness', trust, ["evidenceStatusLabel('lead')", 'not an adjudicated vulnerability']],
]) {
  for (const term of terms) assert.ok(source.includes(term), `${label} is missing ${term}`);
}

assert.match(mapClient, /const width = portrait \? 1080 : 1600;/, 'poster export widths must be 1080px portrait and 1600px landscape');
assert.match(mapClient, /const height = portrait \? 1350 : 900;/, 'poster export heights must be 1350px portrait and 900px landscape');
assert.match(mapClient, /width="\$\{width\}" height="\$\{height\}" viewBox=/, 'poster SVG must declare intrinsic dimensions and viewBox');
assert.match(openGraph, /export const size = \{ width: 1200, height: 630 \};/, 'Open Graph image must be 1200x630');
assert.match(openGraph, /export const alt = /, 'Open Graph image must provide alt text');
assert.match(artifactIds, /FLOW_CARD_RENDERER_VERSION = '1'/, 'flow cards must declare a renderer version');
assert.match(artifactIds, /renderer: FLOW_CARD_RENDERER_VERSION/, 'flow card URLs must carry the renderer version');
assert.match(flowGuide, /flowCardHref\(bundleId, flow\.id\)/, 'flow card links must use the versioned artifact identity');

console.log('Map artifact contract: poster, Mermaid, Markdown, flow card, and README badge preserve context');
