import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const iconPath = path.join(frontendDir, 'public', 'favicon.svg');
const indexPath = path.join(frontendDir, 'index.html');

assert.ok(existsSync(iconPath), 'Missing static favicon: public/favicon.svg');
const icon = readFileSync(iconPath, 'utf8');
assert.match(icon, /viewBox="0 0 48 48"/);
assert.match(icon, /stroke="#29443d"/);
for (const pathData of ['M5 6H15L25 24', 'M5 15H17L25 24', 'M5 24H25', 'M5 33H17L25 24', 'M5 42H15L25 24']) {
  assert.match(icon, new RegExp(`d="${pathData}"`), `Missing BrandMark path: ${pathData}`);
}
assert.match(icon, /<circle cx="25" cy="24" r="2\.5" fill="#29443d"\s*\/>/);

const index = readFileSync(indexPath, 'utf8');
assert.match(index, /<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg"\s*\/>/);

const distPath = path.join(frontendDir, 'dist', 'favicon.svg');
if (existsSync(path.join(frontendDir, 'dist'))) {
  assert.ok(existsSync(distPath), 'Build did not emit dist/favicon.svg');
  assert.equal(readFileSync(distPath, 'utf8'), icon, 'Built favicon differs from source');
}

console.log('Static favicon contract check passed.');
