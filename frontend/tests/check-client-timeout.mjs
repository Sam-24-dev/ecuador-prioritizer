import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const frontendDir = path.resolve(import.meta.dirname, '..');
const readSource = (...parts) => readFileSync(path.join(frontendDir, ...parts), 'utf8');
const adapter = readSource('src', 'services', 'api', 'httpAdapter.ts');
const timeout = readSource('src', 'services', 'api', 'request-timeout.ts');
const dialog = readSource('src', 'components', 'analysis', 'url-import-dialog.tsx');

assert.match(timeout, /export const CLIENT_TIMEOUT_MS = 90_000/);
assert.match(timeout, /setTimeout[\s\S]*timeoutMs/);
assert.match(timeout, /clearTimeout/);
assert.match(timeout, /addEventListener\('abort'/);
assert.match(timeout, /removeEventListener\('abort'/);
assert.match(adapter, /createClientTimeoutSignal\(signal\)/);
assert.match(adapter, /createClientTimeoutSignal\(\)/);
assert.match(adapter, /didTimeout\(\)/);
assert.match(adapter, /client_timeout/);
assert.equal((adapter.match(/signal: timeout\.signal/g) ?? []).length, 2);
assert.match(dialog, /case 'client_timeout'/);

console.log('Client timeout contract check passed.');
