import { defineConfig, devices } from '@playwright/test';
export default defineConfig({ testDir: 'e2e', timeout: 60_000, workers: 4, use: { baseURL: 'http://localhost:4404' }, projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'npx vite preview --outDir /private/tmp/claude-501/b8all --port 4404 --strictPort', url: 'http://localhost:4404', timeout: 120_000 } });
