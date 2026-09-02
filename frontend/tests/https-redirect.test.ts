import assert from 'node:assert/strict';
import worker from '../../worker/index.ts';

const httpRequest = new Request('http://ecuador-prioritizer.scaizapa.workers.dev/results?source=home');
const redirectResponse = await worker.fetch(httpRequest, {
  ASSETS: { fetch: async () => { throw new Error('HTTP requests must not reach assets'); } },
});

assert.equal(redirectResponse.status, 308);
assert.equal(redirectResponse.headers.get('location'), 'https://ecuador-prioritizer.scaizapa.workers.dev/results?source=home');

const httpsRequest = new Request('https://ecuador-prioritizer.scaizapa.workers.dev/results?source=home');
const assetResponse = new Response('asset');
let receivedRequest: Request | undefined;
const response = await worker.fetch(httpsRequest, {
  ASSETS: { fetch: async (request) => { receivedRequest = request; return assetResponse; } },
});

assert.strictEqual(response, assetResponse);
assert.strictEqual(receivedRequest, httpsRequest);
