import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expectedSitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://ecuador-prioritizer.scaizapa.workers.dev/</loc></url>\n</urlset>\n';
const expectedRobots = 'User-agent: *\nAllow: /\n\nSitemap: https://ecuador-prioritizer.scaizapa.workers.dev/sitemap.xml\n';

function assertCrawlFile(relativePath, expected) {
  const sourcePath = path.join(frontendDir, 'public', relativePath);
  assert.ok(existsSync(sourcePath), `Missing static crawl file: public/${relativePath}`);
  assert.equal(readFileSync(sourcePath, 'utf8'), expected, `Unexpected public/${relativePath} content`);

  const builtPath = path.join(frontendDir, 'dist', relativePath);
  if (existsSync(path.join(frontendDir, 'dist'))) {
    assert.ok(existsSync(builtPath), `Build did not emit dist/${relativePath}`);
    assert.equal(readFileSync(builtPath, 'utf8'), expected, `Unexpected dist/${relativePath} content`);
  }
}

assertCrawlFile('robots.txt', expectedRobots);
assertCrawlFile('sitemap.xml', expectedSitemap);
assert.doesNotMatch(readFileSync(path.join(frontendDir, 'public', 'robots.txt'), 'utf8'), /resultados/i);
assert.doesNotMatch(readFileSync(path.join(frontendDir, 'public', 'sitemap.xml'), 'utf8'), /resultados/i);
console.log('SEO crawl-file static output check passed.');
