import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig, devices } from 'playwright/test';

export default defineConfig({
  testDir: './tests/e2e', timeout: 30_000, expect: { timeout: 5_000 }, fullyParallel: false,
  reporter: [['line']], outputDir: join(tmpdir(), 'ecuador-prioritizer-phase2-playwright'),
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'off', screenshot: 'off' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4173', cwd: '.', url: 'http://127.0.0.1:4173', reuseExistingServer: false, timeout: 30_000, env: { VITE_API_BASE_URL: 'http://localhost:8000/api/v1' } },
});
