import { defineConfig, devices } from '@playwright/test';
export default defineConfig({ testDir: 'e2e', timeout: 60_000, workers: 4, use: { baseURL: 'http://localhost:4414' }, projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'npx vite preview --outDir /private/tmp/claude-501/b9all --port 4414 --strictPort', url: 'http://localhost:4414', timeout: 120_000 } });
