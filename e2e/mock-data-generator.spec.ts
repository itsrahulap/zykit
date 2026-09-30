import { expect, test, type Page } from '@playwright/test';

function watch(page: Page) {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    const u = r.url();
    if (!(u.startsWith(origin) || u.startsWith('blob:') || u.startsWith('data:')) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${u}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return { offOrigin, errors };
}

test('Mock Data Generator builds a schema and outputs seeded JSON, CSV and SQL', async ({ page }) => {
  const { offOrigin, errors } = watch(page);
  await page.goto('/tools/mock-data-generator');
  await expect(page).toHaveTitle(/Mock Data Generator/);
  const output = page.getByRole('region', { name: 'Output', exact: true }).locator('pre');

  await page.getByLabel('Rows').fill('5');
  await page.getByLabel('Seed').fill('e2e');
  await expect(page.getByText(/5 rows × 7 fields · seed e2e/)).toBeVisible();
  const rows = JSON.parse((await output.textContent())!);
  expect(rows).toHaveLength(5);
  expect(rows.map((r: { id: number }) => r.id)).toEqual([1, 2, 3, 4, 5]);
  for (const r of rows) expect(r.email).toMatch(/@(example\.(com|org|net)|[a-z]+\.test)$/);

  // Same seed → same data.
  await page.getByLabel('Seed').fill('other');
  await expect(output).not.toHaveText(JSON.stringify(rows, null, 2));
  await page.getByLabel('Seed').fill('e2e');
  await expect(output).toHaveText(JSON.stringify(rows, null, 2));

  await page.getByRole('button', { name: 'Add field' }).click();
  await page.getByLabel('Field 8 name').fill('order');
  await page.getByRole('combobox', { name: 'Field 8 type' }).click();
  await page.getByRole('option', { name: 'Custom pattern' }).click();
  await expect(output).toContainText(/"order": "ORD-\d{4}-[A-Z]{2}"/);

  await page.getByRole('group', { name: 'Format' }).getByRole('button', { name: 'CSV' }).click();
  await expect(output).toHaveText(/^id,first_name,last_name,email,city,status,created_at,order\n1,/);

  await page.getByRole('group', { name: 'Format' }).getByRole('button', { name: 'SQL' }).click();
  await expect(output).toContainText('CREATE TABLE "mock_data"');
  await expect(output).toContainText('INSERT INTO "mock_data"');

  await page.getByLabel('Field 8 name').fill('email');
  await expect(page.getByText('Duplicate field name "email".')).toBeVisible();

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Mock Data Generator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/mock-data-generator');
  await expect(page.getByRole('region', { name: 'Output', exact: true })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
