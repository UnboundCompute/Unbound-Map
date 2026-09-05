import assert from 'node:assert/strict';
import { isLachesisBundle, projectTopLevelRegions, toDesignMapSnapshot } from '../lib/design-map.ts';

const origin = (process.env.LACHESIS_EXPLORER_URL ?? 'http://127.0.0.1:3200').replace(/\/$/, '');
const endpoint = `${origin}/api/bundles/b_demo1234`;

const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
assert.equal(response.status, 200, `expected demo bundle endpoint to return 200, got ${response.status}`);
const payload = await response.json();
assert.ok(isLachesisBundle(payload), 'Explorer response must satisfy the Lachesis 2.0 bundle contract');

const snapshot = toDesignMapSnapshot(payload);
const regions = projectTopLevelRegions(snapshot, 9);
assert.equal(snapshot.repository, 'demo/atlas-commerce');
assert.equal(snapshot.revision, 'main');
assert.ok(snapshot.relationships.length > 0, 'graph relationships must survive the handoff');
assert.ok(snapshot.limitations.some((item) => /demo fixture/i.test(item)), 'fixture provenance must survive projection');
assert.ok(regions.length > 0, 'the projected bundle must produce at least one readable region');

const invalid = await fetch(`${origin}/api/bundles/not-a-bundle`);
assert.equal(invalid.status, 400);
const unknown = await fetch(`${origin}/api/bundles/b_unknown1234`);
assert.equal(unknown.status, 404);
const options = await fetch(endpoint, { method: 'OPTIONS' });
assert.equal(options.status, 204);
assert.equal(options.headers.get('access-control-allow-origin'), '*');

console.log(`ok Explorer → Design Map integration (${regions.length} region, ${snapshot.relationships.length} relationships)`);
