import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4343' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'npx vite preview --outDir /private/tmp/claude-501/b3-c-build --port 4343 --strictPort', url: 'http://localhost:4343', reuseExistingServer: false, timeout: 120_000 },
});
