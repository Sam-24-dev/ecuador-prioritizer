import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const frontendDir = path.resolve(import.meta.dirname, '..');
const source = path.join(frontendDir, 'src', 'lib', 'txt-import.ts');
const outputDir = mkdtempSync(path.join(os.tmpdir(), 'ecuador-prioritizer-txt-import-'));

try {
  execFileSync(
    process.execPath,
    [
      path.join(frontendDir, 'node_modules', 'typescript', 'bin', 'tsc'),
      source,
      '--outDir', outputDir,
      '--target', 'ES2022',
      '--module', 'NodeNext',
      '--moduleResolution', 'NodeNext',
      '--skipLibCheck',
    ],
    { stdio: 'inherit' },
  );

  const { validateTxtImport } = await import(pathToFileURL(path.join(outputDir, 'txt-import.js')).href);
  const validUtf8News = Buffer.from('  Última hora: Ecuador prioriza la atención de la emergencia climática.  ', 'utf8').toString('utf8');

  assert.deepEqual(validateTxtImport(validUtf8News), {
    ok: true,
    text: 'Última hora: Ecuador prioriza la atención de la emergencia climática.',
  });
  assert.deepEqual(validateTxtImport('Primera noticia\n---\nSegunda noticia'), {
    ok: true,
    text: 'Primera noticia\n---\nSegunda noticia',
  });
  assert.deepEqual(validateTxtImport('x'.repeat(2000)), { ok: true, text: 'x'.repeat(2000) });
  assert.deepEqual(validateTxtImport('x'.repeat(2001)), {
    ok: false,
    feedback: 'debe contener entre 15 y 2000 caracteres.',
  });
  assert.deepEqual(validateTxtImport('   \n\t  '), {
    ok: false,
    feedback: 'debe contener entre 15 y 2000 caracteres.',
  });

  console.log('TXT import parsing and validation regression check passed.');
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
