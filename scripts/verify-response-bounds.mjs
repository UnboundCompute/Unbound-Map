import assert from 'node:assert/strict';
import { boundedJson } from '../lib/response-bounds.ts';

const response = (body, headers = {}) => new Response(body, { headers });

assert.deepEqual(await boundedJson(response('{"ok":true}')), { ok: true });
await assert.rejects(
  boundedJson(response('{"ok":true}', { 'content-length': '2097153' })),
  /oversized response/,
);
await assert.rejects(
  boundedJson(response('x'.repeat(2 * 1024 * 1024 + 1))),
  /oversized response/,
);
await assert.rejects(boundedJson(response('{broken')), /invalid response/);

console.log('response bounds: passed');
