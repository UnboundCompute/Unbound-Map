import assert from 'node:assert/strict';
import { loadHostedBundle } from '../lib/hosted.ts';

const originalFetch = globalThis.fetch;
const calls = [];
globalThis.fetch = async (url, options) => {
  calls.push({ url, options });
  return new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } });
};

await assert.rejects(() => loadHostedBundle('not-a-bundle'), /hosted map link is invalid/);
assert.equal(calls.length, 0, 'invalid IDs must not reach fetch');

const success = await loadHostedBundle('b_demo1234');
assert.deepEqual(success, { ok: true });
assert.equal(calls[0].options.redirect, 'error');
assert.equal(calls[0].options.headers.Accept, 'application/json');

globalThis.fetch = async () => new Response('<html>not json</html>', { status: 200 });
await assert.rejects(() => loadHostedBundle('b_demo1234'), /response was not valid JSON/);

globalThis.fetch = async () => ({ ok: true, status: 200, headers: new Headers(), text: async () => { throw new Error('stream failed'); } });
await assert.rejects(() => loadHostedBundle('b_demo1234'), /response could not be read/);

globalThis.fetch = async () => new Response('', { status: 410 });
await assert.rejects(() => loadHostedBundle('b_demo1234'), /expired or no longer exists/);

globalThis.fetch = async () => new Response('', { status: 200, headers: { 'content-length': String(25 * 1024 * 1024 + 1) } });
await assert.rejects(() => loadHostedBundle('b_demo1234'), /too large to open/);

globalThis.fetch = originalFetch;
console.log('ok hosted transport validation and recovery cases');
