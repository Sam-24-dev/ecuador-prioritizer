import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const frontendDir = path.resolve(import.meta.dirname, '..');
const readSource = (...parts) => readFileSync(path.join(frontendDir, ...parts), 'utf8');

const dialog = readSource('src', 'components', 'analysis', 'url-import-dialog.tsx');
const page = readSource('src', 'pages', 'analizar.tsx');

assert.match(dialog, /export function UrlImportDialog/);
assert.match(dialog, /useExtractUrl\(\)/);
assert.match(dialog, /AbortController/);
assert.match(dialog, /Confirmar[^<]*vista previa|Confirmar y mantener/);
assert.match(dialog, /warnings/);
assert.match(dialog, /original_length/);
assert.match(dialog, /truncated/);
assert.match(dialog, /Textarea/);
assert.match(dialog, /role=["']alert["']/);
assert.match(dialog, /Cancelar/);
assert.match(dialog, /function urlExtractionErrorMessage\(error: unknown\)/);
assert.match(dialog, /invalid_url/);
assert.match(dialog, /rate_limited/);
assert.match(dialog, /upstream_timeout/);
assert.match(dialog, /No fue posible extraer esta URL/);
assert.match(dialog, /prueba con otro art[ií]culo p[uú]blico/);
assert.match(dialog, /No pudimos extraer el contenido de este enlace/);
assert.match(dialog, /Probar otro enlace/);
assert.match(dialog, /Pegar el texto/);
assert.match(dialog, /Intenta de nuevo m[aá]s tarde/);
assert.doesNotMatch(dialog, /BatchDraftItem|useBatchSession|setItems|onAddToLot|addDraft/);

assert.match(page, /UrlImportDialog/);
assert.match(page, /Importar desde URL/);
assert.doesNotMatch(page, /onConfirmed=|onAddToLot=/);

console.log('URL import UI contract check passed.');
