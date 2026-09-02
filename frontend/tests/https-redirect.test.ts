import assert from 'node:assert/strict';
import worker from '../../worker/index.ts';

const httpRequest = new Request('http://ecuador-prioritizer.scaizapa.workers.dev/results?source=home');
const redirectResponse = await worker.fetch(httpRequest, {
  ASSETS: { fetch: async () => { throw new Error('HTTP requests must not reach assets'); } },
});

assert.equal(redirectResponse.status, 308);
assert.equal(redirectResponse.headers.get('location'), 'https://ecuador-prioritizer.scaizapa.workers.dev/results?source=home');

const httpsRequest = new Request('https://ecuador-prioritizer.scaizapa.workers.dev/results?source=home');
const assetResponse = new Response('asset', { headers: { 'X-Existing': 'preserved' } });
let receivedRequest: Request | undefined;
const response = await worker.fetch(httpsRequest, {
  ASSETS: { fetch: async (request) => { receivedRequest = request; return assetResponse; } },
});

assert.strictEqual(receivedRequest, httpsRequest);
assert.equal(response.status, 200);
assert.equal(await response.text(), 'asset');
assert.equal(response.headers.get('X-Existing'), 'preserved');
assert.equal(response.headers.get('Strict-Transport-Security'), 'max-age=31536000');

const notFoundResponse = new Response('not found', { status: 404 });
const notFound = await worker.fetch(httpsRequest, {
  ASSETS: { fetch: async () => notFoundResponse },
});

assert.strictEqual(notFound, notFoundResponse);
assert.equal(notFound.headers.get('Strict-Transport-Security'), null);
