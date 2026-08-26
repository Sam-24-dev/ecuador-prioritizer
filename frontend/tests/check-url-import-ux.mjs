import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const frontendDir = path.resolve(import.meta.dirname, '..');
const readSource = (...parts) => readFileSync(path.join(frontendDir, ...parts), 'utf8');

const dialog = readSource('src', 'components', 'analysis', 'url-import-dialog.tsx');
const page = readSource('src', 'pages', 'analizar.tsx');
const session = readSource('src', 'session', 'batch-session.tsx');
const results = readSource('src', 'pages', 'resultados.tsx');

assert.doesNotMatch(dialog, /Usamos el backend configurado para validar y extraer el contenido\./);
assert.doesNotMatch(dialog, /error instanceof Error/);
assert.match(dialog, /No fue posible extraer esta URL[\s\S]*Verifica que sea un enlace p[uú]blico/);
assert.match(dialog, /isLotFull:\s*boolean/);
assert.match(dialog, /if \(isLotFull\)[\s\S]*?return;[\s\S]*?mutate\(/);
assert.match(dialog, /onChange=\{\(event\) => startAnotherImport\(event\.target\.value\)\}/);
assert.match(dialog, /Importar otra URL/);
assert.match(dialog, /Noticia agregada al lote\. Puedes importar otra URL\./);
assert.match(dialog, /Cerrar importación/);
assert.match(dialog, /displaySource:\s*url/);
assert.match(dialog, /onConfirm\s*:\s*\(draft:\s*\{\s*text:\s*string;\s*source:\s*string;\s*displaySource:\s*string\s*}\)/s);

assert.match(page, /displaySource:\s*draft\.displaySource/);
assert.match(page, /isLotFull=\{items\.length >= MAX_NEWS_ITEMS\}/);
const requestMap = page.match(/items:\s*prepared\.map\(\(item\)\s*=>\s*\(\{[^}]+\}\)/s)?.[0] ?? '';
assert.match(requestMap, /client_id:\s*item\.id/);
assert.match(requestMap, /text:\s*item\.text/);
assert.match(requestMap, /source:\s*item\.source\s*\|\|\s*undefined/);
assert.doesNotMatch(requestMap, /displaySource|original_url|final_url|title|author|published_at|warnings/);

assert.match(session, /displaySource\?: string/);
assert.match(session, /displaySource:\s*draft\.displaySource/);
assert.match(results, /item\.displaySource \?\? item\.source/);

assert.match(dialog, /function safeHttpUrl\(value: string\): string \| null/);
assert.match(dialog, /const finalUrl = preview \? safeHttpUrl\(preview\.final_url\) : null/);
assert.match(dialog, /finalUrl \? <a[\s\S]*href=\{finalUrl\}[\s\S]*: <span[\s\S]*preview\.final_url/);

const input = readSource('src', 'components', 'ui', 'input.tsx');
const textarea = readSource('src', 'components', 'ui', 'textarea.tsx');
assert.match(input, /aria-invalid=\{error \? 'true' : undefined\}/);
assert.match(input, /aria-describedby=\{error \? errorId : undefined\}/);
assert.match(input, /React\.useId\(\)/);
assert.match(input, /const inputId = id \|\| `input-\$\{generatedId\}`/);
assert.match(textarea, /aria-invalid=\{error \? 'true' : undefined\}/);
assert.match(textarea, /aria-describedby=\{error \? errorId : undefined\}/);
assert.match(textarea, /React\.useId\(\)/);
assert.match(textarea, /const textareaId = id \|\| `textarea-\$\{generatedId\}`/);

console.log('URL import UX contract check passed.');
