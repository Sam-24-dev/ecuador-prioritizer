import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const wrangler = readFileSync(path.join(repoDir, 'wrangler.toml'), 'utf8');

assert.match(wrangler, /\[observability\]\r?\nenabled\s*=\s*true\s*(?:\r?\n|$)/,
  'Workers Logs must be explicitly enabled in the top-level observability config');
assert.doesNotMatch(wrangler, /\blogpush\s*=\s*true\b/,
  'Workers Logpush is out of scope and requires the paid plan');
assert.doesNotMatch(wrangler, /\[observability\.traces\]/,
  'Workers Traces are out of scope for this Logs-only slice');

console.log('Cloudflare Workers Logs observability contract check passed.');
