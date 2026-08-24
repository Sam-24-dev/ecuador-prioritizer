import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const frontendDir = path.resolve(import.meta.dirname, '..');
const source = path.join(frontendDir, 'src', 'lib', 'csv.ts');
const outputDir = mkdtempSync(path.join(os.tmpdir(), 'ecuador-prioritizer-csv-'));

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

  const { escapeCsvCell } = await import(pathToFileURL(path.join(outputDir, 'csv.js')).href);

  assert.equal(escapeCsvCell('=SUM(1,1)'), `"'=SUM(1,1)"`);
  assert.equal(escapeCsvCell(' \t-HYPERLINK("https://example.test")'), `"' \t-HYPERLINK(""https://example.test"")"`);
  assert.equal(escapeCsvCell('@cmd'), `"'@cmd"`);
  assert.equal(escapeCsvCell('plain, "quoted"\ntext'), `"plain, ""quoted""\ntext"`);
  assert.equal(escapeCsvCell(-0.25, { trustedGeneratedNumber: true }), '"-0.25"');
  assert.equal(escapeCsvCell('-0.25'), `"'-0.25"`);

  console.log('CSV formula-injection regression check passed.');
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}