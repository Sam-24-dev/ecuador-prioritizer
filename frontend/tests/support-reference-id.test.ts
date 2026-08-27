import assert from 'node:assert/strict';
import { getSupportReferenceId, getSupportReferenceIdFromError } from '../src/services/api/support-reference-id.ts';

const responseWithId = new Response(null, { headers: { 'X-Request-ID': '  req-7f3a  ' } });
assert.equal(getSupportReferenceId(responseWithId), 'req-7f3a');

const responseWithoutId = new Response(null);
assert.equal(getSupportReferenceId(responseWithoutId), undefined);

const unsafeResponse = new Response(null, { headers: { 'X-Request-ID': 'request,secret' } });
assert.equal(getSupportReferenceId(unsafeResponse), undefined);

assert.equal(getSupportReferenceIdFromError({ supportReferenceId: ' req-7f3a ' }), 'req-7f3a');
assert.equal(getSupportReferenceIdFromError(new Error('internal detail')), undefined);
assert.equal(getSupportReferenceIdFromError({ supportReferenceId: 'x'.repeat(129) }), undefined);

console.log('Support reference ID extraction checks passed.');
