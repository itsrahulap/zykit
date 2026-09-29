import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4352', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx vite preview --outDir /private/tmp/claude-501/find-build --port 4352 --strictPort',
    url: 'http://localhost:4352',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
