import { expect, test } from '@playwright/test';

test('.env Diff compares files with masked values', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/env-diff');
  await expect(page).toHaveTitle(/\.env Diff/);
  await page.getByRole('textbox', { name: 'File A' }).fill('PORT=3000\nDB_PASSWORD=\nSHARED=same\n');
  await page.getByRole('textbox', { name: 'File B' }).fill('PORT=8080\nSHARED=same\nAPI_TOKEN=hunter2\nPORT=9090\nbroken line\n');
  await expect(page.getByText('1 missing · 1 extra · 1 changed · 1 same')).toBeVisible();

  const diff = page.getByRole('region', { name: 'Differences' });
  await expect(diff).not.toContainText('hunter2');
  await expect(diff).toContainText('Looks secret');
  await page.getByRole('button', { name: 'Reveal values of API_TOKEN' }).click();
  await expect(diff).toContainText('hunter2');
  await expect(diff).not.toContainText('9090');
  await page.getByRole('button', { name: 'Hide all' }).click();
  await expect(diff).not.toContainText('hunter2');

  await diff.getByRole('button', { name: /^Missing/ }).click();
  await expect(diff.getByText('DB_PASSWORD')).toBeVisible();
  await expect(diff.getByText('SHARED')).toHaveCount(0);

  const problems = page.getByRole('status', { name: 'File B problems' });
  await expect(problems).toContainText('PORT is set 2 times');
  await expect(problems).toContainText('Line 5');

  await expect(page.getByRole('region', { name: 'Output' }).locator('pre')).toHaveText('PORT=\nSHARED=\nAPI_TOKEN=\nPORT=');
  await expect(page).not.toHaveURL(/#s=/);

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('.env Diff has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/env-diff');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Differences' })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
