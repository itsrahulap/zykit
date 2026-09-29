import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: '/Users/rahul/Learn/toolstack/e2e',
  outputDir: '/private/tmp/claude-501/-Users-rahul-Learn-toolstack/fe15f794-13cf-4990-8c60-860126bf1701/scratchpad/pw-results',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4199' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'npx vite preview --port 4199 --strictPort', cwd: '/Users/rahul/Learn/toolstack', url: 'http://localhost:4199', timeout: 120_000 },
});
