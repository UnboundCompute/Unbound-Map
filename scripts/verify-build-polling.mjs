import assert from 'node:assert/strict';
import { pollDelayMilliseconds, retryAfterMilliseconds } from '../lib/build-polling.ts';

assert.equal(retryAfterMilliseconds('2'), 2_000);
assert.equal(retryAfterMilliseconds('120'), 30_000, 'Retry-After must be capped');
assert.equal(retryAfterMilliseconds('not-a-delay'), undefined);
assert.equal(retryAfterMilliseconds('Wed, 21 Oct 2015 07:28:00 GMT', Date.parse('Wed, 21 Oct 2015 07:27:00 GMT')), 30_000);
assert.equal(pollDelayMilliseconds(0, undefined, 0), 1_000);
assert.equal(pollDelayMilliseconds(30, undefined, 250), 8_250);
assert.equal(pollDelayMilliseconds(2, 4_000, 250), 4_000, 'server Retry-After must win over local backoff');
console.log('build polling: bounded backoff, jitter, and Retry-After passed');
