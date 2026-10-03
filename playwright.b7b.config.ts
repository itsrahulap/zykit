import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'e2e',
  timeout: 60000,
  use: { baseURL: 'http://localhost:4392' },
  webServer: { command: 'npx vite preview --outDir /private/tmp/claude-501/b7b --port 4392 --strictPort', url: 'http://localhost:4392', reuseExistingServer: false },
});
