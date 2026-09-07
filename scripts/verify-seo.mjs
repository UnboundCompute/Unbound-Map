import assert from 'node:assert/strict';

const { documentMetadata } = await import('../lib/seo.ts');

const artifact = documentMetadata(
  'Flow card · Unbound Map',
  'A pinned flow card.',
  { repository: 'acme/widget', revision: 'a'.repeat(40), bundle: 'b_12345678', flow: 'request.main', canonicalPath: '/f/b_12345678/request.main' },
);
assert.deepEqual(artifact.robots, { index: false, follow: true });
assert.equal(artifact.alternates?.canonical, '/f/b_12345678/request.main');
assert.match(String(artifact.openGraph?.images?.[0]?.url), /bundle=b_12345678/);

const landing = documentMetadata('Unbound Map', 'A stable landing page.');
assert.equal(landing.robots, undefined);
assert.equal(landing.alternates, undefined);

console.log('SEO contract: share artifacts are canonical and query-state snapshots remain noindex');
