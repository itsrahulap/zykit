import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'e2e',
  timeout: 60000,
  use: { baseURL: 'http://localhost:4403' },
  webServer: { command: 'npx vite preview --outDir /private/tmp/claude-501/b8c --port 4403 --strictPort', url: 'http://localhost:4403', reuseExistingServer: false },
});
