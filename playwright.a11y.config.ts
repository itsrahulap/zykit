import { defineConfig, devices } from '@playwright/test';

// Temporary config for the accessibility audit (e2e/a11y.spec.ts). Build first:
//   npx vite build --outDir /private/tmp/claude-501/a11y-build --emptyOutDir
export default defineConfig({
  testDir: 'e2e',
  testMatch: /a11y\.spec\.ts/,
  timeout: 180_000,
  workers: 6,
  outputDir: '/private/tmp/claude-501/a11y-results',
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4355', actionTimeout: 10_000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx vite preview --outDir /private/tmp/claude-501/a11y-build --port 4355 --strictPort',
    url: 'http://localhost:4355',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
