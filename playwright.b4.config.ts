import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4351', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'npx vite preview --outDir /private/tmp/claude-501/b4-build --port 4351 --strictPort', url: 'http://localhost:4351', reuseExistingServer: false, timeout: 60_000 },
});
