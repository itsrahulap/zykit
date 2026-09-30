import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  outputDir: '/private/tmp/claude-501/a11yfix-results',
  use: { baseURL: 'http://localhost:4365', actionTimeout: 10_000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'npx vite preview --outDir /private/tmp/claude-501/a11yfix-build --port 4365 --strictPort', url: 'http://localhost:4365', reuseExistingServer: false, timeout: 120_000 },
});
