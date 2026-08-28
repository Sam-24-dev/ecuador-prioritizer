import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const analizar = readFileSync(path.join(frontendDir, 'src/pages/analizar.tsx'), 'utf8');
const urlImport = readFileSync(path.join(frontendDir, 'src/components/analysis/url-import-dialog.tsx'), 'utf8');
const waitCopy = 'Puede tardar; tus noticias se conservan si falla.';

assert.match(analizar, new RegExp(`analyzeMutation\\.isPending[\\s\\S]*${waitCopy.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}`));
assert.match(urlImport, new RegExp(`isPending[\\s\\S]*${waitCopy.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}`));

console.log('Analysis and extraction wait-context regression check passed.');
