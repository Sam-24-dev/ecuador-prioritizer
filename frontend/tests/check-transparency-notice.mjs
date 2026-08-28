import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const frontendDir = path.resolve(import.meta.dirname, '..');
const readSource = (...parts) => readFileSync(path.join(frontendDir, ...parts), 'utf8');

const app = readSource('src', 'App.tsx');
const analizar = readSource('src', 'pages', 'analizar.tsx');
const sidebar = readSource('src', 'components', 'layout', 'sidebar.tsx');
const pagePath = path.join(frontendDir, 'src', 'pages', 'transparencia.tsx');

assert.match(app, /import \{ TransparenciaPage \} from '@\/pages\/transparencia';/);
assert.match(app, /<Route path="\/transparencia" element=\{<AppShell><TransparenciaPage \/><\/AppShell>\} \/>/);
assert.match(analizar, /href="\/transparencia"/);
assert.match(analizar, /Antes de enviar/);
assert.match(sidebar, /path: '\/transparencia'/);
assert.match(sidebar, /Transparencia y contacto/);

const transparency = readFileSync(pagePath, 'utf8');
for (const copy of [
  'Samir Caizapasto',
  'ecuadorprioritizer.contacto@gmail.com',
  'texto de la noticia',
  'no verifica los hechos ni toma decisiones sobre personas',
  'sessionStorage',
  'hasta 3 días',
  '7 días',
  '48 horas',
  'No envíes contenido sensible o confidencial',
]) {
  assert.match(transparency, new RegExp(copy.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')), `Missing transparency copy: ${copy}`);
}
assert.match(transparency, /<h1[\s\S]*Transparencia y privacidad/);
assert.match(transparency, /mailto:ecuadorprioritizer\.contacto@gmail\.com/);

console.log('Public transparency notice contract check passed.');
