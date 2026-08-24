import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const frontendDir = path.resolve(import.meta.dirname, '..');
const readSource = (...parts) => readFileSync(path.join(frontendDir, ...parts), 'utf8');

const dialog = readSource('src', 'components', 'analysis', 'url-import-dialog.tsx');
const page = readSource('src', 'pages', 'analizar.tsx');

assert.match(dialog, /onConfirm\s*:\s*\(draft:\s*\{\s*text:\s*string;\s*source:\s*string;\s*displaySource:\s*string\s*}\)\s*=>\s*boolean/s);
const confirmationCall = dialog.match(/onConfirm\(\{[^}]+\}\)/s)?.[0] ?? '';
assert.match(confirmationCall, /source:\s*preview\.domain\.trim\(\)/);
assert.match(confirmationCall, /displaySource:\s*url/);
assert.doesNotMatch(confirmationCall, /original_url|final_url|title|author|published_at|warnings/);
assert.match(page, /<UrlImportDialog[\s\S]*isLotFull=\{items\.length >= MAX_NEWS_ITEMS\}[\s\S]*onConfirm=\{handleUrlPreviewConfirmed\}/);
assert.match(page, /const mappedItem:\s*BatchDraftItem\s*=\s*\{\s*\.\.\.createDraft\(\),\s*text:\s*draft\.text,\s*source:\s*draft\.source,\s*displaySource:\s*draft\.displaySource\s*\}/);
assert.match(page, /const seen = new Set<string>\(\)/);
assert.match(page, /setDuplicateIds\(duplicates\)/);
const requestMap = page.match(/items:\s*prepared\.map\(\(item\)\s*=>\s*\(\{[^}]+\}\)/s)?.[0] ?? '';
assert.match(requestMap, /client_id:\s*item\.id,\s*text:\s*item\.text,\s*source:\s*item\.source\s*\|\|\s*undefined/s);
assert.doesNotMatch(requestMap, /displaySource|title|author|published_at|final_url|warnings/);

console.log('URL import batch mapping contract check passed.');
