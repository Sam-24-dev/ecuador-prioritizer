import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readSource = (relativePath) => readFileSync(path.join(frontendDir, relativePath), 'utf8');
const analizar = readSource('src/pages/analizar.tsx');
const resultados = readSource('src/pages/resultados.tsx');
const card = readSource('src/components/ui/card.tsx');
const sidebar = readSource('src/components/layout/sidebar.tsx');
const header = readSource('src/components/layout/header.tsx');

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(entryPath) : /\.(?:[cm]?[jt]sx?|css)$/.test(entry.name) ? [entryPath] : [];
  });
}

for (const copy of ['Analizar noticias', 'Resultados priorizados', 'Pegar varias noticias', 'Importar archivos .txt', 'Orden de atenci\u00f3n para este lote.', 'Descargar todos los resultados (CSV)']) {
  assert.ok(`${analizar}\n${resultados}\n${sidebar}`.includes(copy), `Missing editorial copy: ${copy}`);
}
assert.match(sidebar, /BrandMark/);
assert.doesNotMatch(sidebar, /<h1\b/, 'Navigation branding must not create a page heading');
assert.match(resultados, /font-editorial/);
assert.match(card, /<h2 ref=\{ref\}/);
assert.doesNotMatch(card, /<h3 ref=\{ref\}/);
for (const [name, page] of [['analysis', analizar], ['results', resultados]]) {
  assert.ok(page.indexOf('<h1') < page.indexOf('<CardTitle'), `${name} must place CardTitle after its page h1`);
}
assert.ok(!header.includes('useTheme'));
assert.ok(!existsSync(path.join(frontendDir, 'src/hooks/useTheme.ts')));

for (const filePath of sourceFiles(path.join(frontendDir, 'src'))) {
  assert.doesNotMatch(readFileSync(filePath, 'utf8'), /dark:|prefers-color-scheme|darkMode/, `Dark-mode residue remains: ${path.relative(frontendDir, filePath)}`);
}

console.log('Editorial UI copy and fixed-light-theme regression check passed.');
