import assert from 'node:assert/strict';

const { approvedCanonicalRoutes } = await import('../lib/sitemap.ts');
const routes = approvedCanonicalRoutes([
  { repository: 'github.com/acme/widget', revision: 'a'.repeat(40), bundle_id: 'b_12345678', curated_tour: { id: 'tour-a' } },
  { repository: 'github.com/acme/widget', revision: 'b'.repeat(40), bundle_id: 'b_87654321', curated_tour: { id: 'tour-b' } },
  { repository: 'gitlab.com/team/service', revision: 'c'.repeat(40), bundle_id: 'b_abcdefgh', curated_tour: { id: 'tour-c' } },
  { repository: 'github.com/acme/unreviewed', revision: 'd'.repeat(40), bundle_id: 'b_unreviewed', curated_tour: undefined },
  { repository: 'not-a-supported-host/team/repo', revision: 'e'.repeat(40), bundle_id: 'b_invalid1', curated_tour: { id: 'tour-invalid' } },
]);
assert.deepEqual(routes, ['/r/acme/widget', '/r/gitlab.com/team/service']);
console.log('sitemap publication gate: approved canonical routes deduplicated');
