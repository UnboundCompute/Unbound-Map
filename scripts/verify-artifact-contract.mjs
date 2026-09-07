import assert from 'node:assert/strict';
import fs from 'node:fs';

const mapClient = fs.readFileSync(new URL('../app/components/MapClient.tsx', import.meta.url), 'utf8');
const flowGuide = fs.readFileSync(new URL('../app/components/HostedFlowGuide.tsx', import.meta.url), 'utf8');
const embed = fs.readFileSync(new URL('../app/components/EmbedSnippet.tsx', import.meta.url), 'utf8');

for (const [label, source, terms] of [
  ['architecture poster', mapClient, ['Download landscape SVG', 'Download portrait SVG', 'graph-backed projection', 'revision ·']],
  ['Mermaid export', mapClient, ['Copy Mermaid', 'flowchart LR', 'linkSnapshot.revision']],
  ['ARCHITECTURE.md export', mapClient, ['Download ARCHITECTURE.md', 'Revision-pinned architecture reading guide', 'Repository:', 'Revision:']],
  ['flow card', flowGuide, ['Open flow card', 'artifactMarkdown', 'bundle.meta.repository', 'bundle.meta.revision']],
  ['README badge', embed, ['README badge Markdown', 'previewQuery', 'architecture field guide']],
]) {
  for (const term of terms) assert.ok(source.includes(term), `${label} is missing ${term}`);
}

console.log('Map artifact contract: poster, Mermaid, Markdown, flow card, and README badge preserve context');
