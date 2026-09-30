import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: 'line',
  use: { baseURL: 'http://localhost:4363' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx vite preview --outDir /private/tmp/claude-501/b5c-build --port 4363 --strictPort',
    url: 'http://localhost:4363',
    reuseExistingServer: false,
  },
});
