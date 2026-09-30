import { expect, test } from '@playwright/test';

test('JSON Schema Validator lists errors and generates schemas', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/json-schema');
  await expect(page).toHaveTitle(/JSON Schema Validator/);
  await page.getByRole('button', { name: 'Try an example' }).click();
  const list = page.getByRole('region', { name: 'Validation errors' });
  await expect(list).toContainText('Missing required property "city"');
  await expect(list).toContainText('/address/zip');
  await expect(list).toContainText('#/$defs/address/properties/zip/pattern');
  await expect(list).toContainText('Property "nickname" isn’t allowed');
  await expect(list).toContainText('Must be a valid email');
  await expect(page.getByText(/^Invalid: 6 errors/)).toBeVisible();

  await page.getByLabel(/Check formats/).uncheck();
  await expect(page.getByText(/^Invalid: 5 errors/)).toBeVisible();

  await page.getByRole('textbox', { name: 'JSON document' }).fill('{"id": 1, "name": "Ada", "tags": ["a"], "when": "2024-01-02"}');
  await page.getByRole('button', { name: 'Generate schema from JSON' }).click();
  await expect(page.getByRole('textbox', { name: 'JSON Schema' })).toHaveValue(/"format": "date"/);
  await expect(page.getByText('The document is valid against this schema.')).toBeVisible();

  await page.getByRole('textbox', { name: 'JSON Schema' }).fill('{"type": ');
  await expect(page.getByText('Schema syntax error')).toBeVisible();

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('JSON Schema Validator stops a catastrophic pattern', async ({ page }) => {
  await page.goto('/tools/json-schema');
  await page.getByRole('textbox', { name: 'JSON Schema' }).fill('{"pattern": "^(a+)+$"}');
  await page.getByRole('textbox', { name: 'JSON document' }).fill(`"${'a'.repeat(40)}!"`);
  await expect(page.getByText(/^Stopped after/)).toBeVisible({ timeout: 10_000 });
  await page.getByRole('textbox', { name: 'JSON document' }).fill('"aaa"');
  await expect(page.getByText('The document is valid against this schema.')).toBeVisible();
});

test('JSON Schema Validator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/json-schema');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Validation errors' })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
