import { expect, test } from '@playwright/test';

test('gitignore Generator works locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/gitignore-generator');
  await expect(page).toHaveTitle(/gitignore/i);
  await expect(page.getByText('# === Node.js ===').first()).toBeVisible();

  await page.getByLabel('Search templates').fill('python');
  await page.getByLabel('Python', { exact: true }).check();
  await expect(page.getByText('__pycache__/').first()).toBeVisible();
  await page.getByLabel('Custom lines').fill('my-secret.txt');
  await expect(page.getByText('# === Custom ===').first()).toBeVisible();

  await page.getByLabel('Paths', { exact: true }).fill('node_modules/a/b.js\nsrc/index.ts\n.vscode/settings.json\nmy-secret.txt');
  const results = page.getByRole('list', { name: 'Test results' });
  await expect(results.getByRole('listitem').nth(0)).toContainText('Ignored');
  await expect(results.getByRole('listitem').nth(1)).toContainText('Not ignored');
  await expect(results.getByRole('listitem').nth(2)).toContainText('Not ignored');
  await expect(results.getByRole('listitem').nth(3)).toContainText('Matched line');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download \.gitignore/ }).click();
  expect((await download).suggestedFilename()).toBe('.gitignore');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('gitignore Generator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/gitignore-generator');
  await page.getByRole('button', { name: 'Example paths' }).click();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
