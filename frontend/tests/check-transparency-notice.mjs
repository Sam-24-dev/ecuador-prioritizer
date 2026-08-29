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
assert.match(analizar, /Antes de analizar, la herramienta envía el texto de la noticia y, si los agregas, su fuente o enlace para ordenar qué noticias conviene revisar primero\. No necesitas crear una cuenta\. No envíes información sensible\./);
assert.match(analizar, /href="\/transparencia">Cómo se usa tu información<\/a>/);
assert.doesNotMatch(analizar, /Antes de enviar:/);
assert.match(sidebar, /path: '\/transparencia'/);
assert.match(sidebar, /Transparencia y contacto/);

const transparency = readFileSync(pagePath, 'utf8');
for (const copy of [
  'Samir Caizapasto',
  'ecuadorprioritizer.contacto@gmail.com',
  '¿Cómo funciona?',
  'Para ordenar las noticias, la herramienta usa el texto que envías y, si los agregas, la fuente o el enlace.',
  'Tu información',
  'No necesitas crear una cuenta.',
  'El texto y los resultados quedan disponibles mientras mantienes abierta esta pestaña.',
  'No envíes información sensible o confidencial.',
  'no verifica hechos ni toma decisiones sobre personas',
  '¿Encontraste un error?',
]) {
  assert.match(transparency, new RegExp(copy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Missing transparency copy: ${copy}`);
}
for (const internalDetail of ['sessionStorage', 'Workers Free', 'Render Hobby', '48 horas', 'logger']) {
  assert.doesNotMatch(transparency, new RegExp(internalDetail), `Internal detail remains: ${internalDetail}`);
}
assert.match(transparency, /<h1[\s\S]*Transparencia y privacidad/);
assert.match(transparency, /mailto:ecuadorprioritizer\.contacto@gmail\.com/);

console.log('Public transparency notice contract check passed.');
