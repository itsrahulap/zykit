import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Mock API Generator edits endpoints and exports locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/mock-api-generator');
  await expect(page).toHaveTitle(/Mock API Generator/);
  const exp = page.getByRole('region', { name: 'Export', exact: true });
  await expect(exp).toContainText('openapi: 3.1.0');
  await expect(exp).toContainText('/users/{id}:');

  await page.getByRole('group', { name: 'Export as' }).getByRole('button', { name: 'json-server db.json' }).click();
  await expect(exp).toContainText('"users": [');

  await page.getByRole('button', { name: 'Add endpoint' }).click();
  await page.getByLabel('Path').fill('/users/{other}');
  await expect(page.getByText('Same route as another GET /users/:id.')).toBeVisible();
  await expect(exp).toContainText('Fix the endpoints marked');
  await page.getByLabel('Path').fill('/orders');
  await page.getByLabel('Response body (JSON)').fill('[{"id": 1}]');
  await expect(exp).toContainText('"orders": [');

  const zip = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Fixtures (ZIP)' }).click();
  const zipBytes = await readFile((await (await zip).path())!);
  expect(zipBytes.includes(Buffer.from('get_orders_200.json'))).toBe(true);

  // The project survives a reload (saved in localStorage).
  await page.reload();
  await expect(page.getByRole('button', { name: /GET\s*\/orders/ })).toBeVisible();

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Mock API Generator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/mock-api-generator');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
