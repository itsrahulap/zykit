import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60000,
  use: { baseURL: 'http://localhost:4413' },
  webServer: { command: 'npx vite preview --outDir /private/tmp/claude-501/b9c --port 4413 --strictPort', url: 'http://localhost:4413', reuseExistingServer: false },
});
