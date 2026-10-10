import { expect, test } from '@playwright/test';

test('Markdown Table Generator works locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/markdown-table');
  await expect(page).toHaveTitle(/Markdown Table Generator/);
  await page.getByLabel('Input CSV or TSV').fill('Name,Qty\nApple,3\n日本語,a|b');
  const out = page.getByRole('region', { name: 'Output' });
  await expect(out).toContainText('| Name   | Qty  |');
  await expect(out).toContainText('a\\|b');
  await page.getByRole('combobox', { name: /Column 2/ }).click();
  await page.getByRole('option', { name: 'Right' }).click();
  await expect(out).toContainText('---:');

  await page.getByRole('button', { name: 'Format table' }).click();
  await page.getByLabel('Existing Markdown table').fill('|a|b|\n|:-|-:|\n|1|2|');
  await expect(out).toContainText('| a   |   b |');

  await page.getByRole('button', { name: 'Grid', exact: true }).click();
  await page.getByLabel('Row 1, column 1').fill('Pear');
  await expect(out).toContainText('| Pear');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Markdown Table Generator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/markdown-table');
  await page.getByRole('button', { name: 'Try an example' }).click();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
