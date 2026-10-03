import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60000,
  use: { baseURL: 'http://localhost:4391' },
  webServer: { command: 'npx vite preview --outDir /private/tmp/claude-501/b7a --port 4391 --strictPort', url: 'http://localhost:4391', reuseExistingServer: false },
});
