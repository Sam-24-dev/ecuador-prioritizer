import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const headersPath = path.join(frontendDir, 'public', '_headers');

assert.ok(existsSync(headersPath), 'Missing Cloudflare static-assets header file: public/_headers');

const headers = readFileSync(headersPath, 'utf8');
assert.match(headers, /^\/\*\r?\n/m, 'Headers must apply to every static asset');
assert.match(headers, /Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https:\/\/ecuador-prioritizer-api\.onrender\.com http:\/\/localhost:8000; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'/);
assert.match(headers, /X-Frame-Options: DENY/);
assert.match(headers, /X-Content-Type-Options: nosniff/);
assert.match(headers, /Referrer-Policy: strict-origin-when-cross-origin/);
assert.match(headers, /Permissions-Policy: geolocation=\(\), microphone=\(\), camera=\(\)/);
assert.doesNotMatch(headers, /Strict-Transport-Security/i, 'HSTS is intentionally out of scope');

console.log('Cloudflare static security-header regression check passed.');
