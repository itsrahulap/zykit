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

test('OpenAPI Dependency Mapper maps, filters and exports the example', async ({ page }) => {
  const { offOrigin, errors } = watch(page);
  await page.goto('/tools/openapi-dependency-mapper');
  await expect(page).toHaveTitle(/OpenAPI Dependency Mapper/);

  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByText('4 operations · 5 components · 0 unresolved $refs')).toBeVisible();

  await page.getByRole('button', { name: 'Operation POST /orders' }).click();
  const details = page.getByRole('region', { name: 'Details' });
  await expect(details).toContainText('placeOrder');
  for (const name of ['Order', 'Pet', 'NewPet', 'Category', 'Error']) await expect(details).toContainText(name);
  await page.getByRole('button', { name: 'Component Category' }).click();
  await expect(details).toContainText('cycle');

  await page.getByRole('combobox', { name: 'Tag' }).click();
  await page.getByRole('option', { name: 'orders' }).click();
  await expect(page.getByText('Showing 1 operation and 5 components.')).toBeVisible();
  await page.getByLabel('Schema name').fill('nothing-like-this');
  await expect(page.getByText('Nothing matches the filters.')).toBeVisible();

  const summary = page.getByRole('region', { name: 'Output', exact: true }).locator('pre');
  await expect(summary).toContainText('| POST /orders | placeOrder | orders |');
  await page.getByRole('button', { name: 'JSON', exact: true }).click();
  expect(JSON.parse((await summary.textContent())!).operations).toHaveLength(4);

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('OpenAPI Dependency Mapper reports unresolved refs and syntax errors', async ({ page }) => {
  const { offOrigin, errors } = watch(page);
  await page.goto('/tools/openapi-dependency-mapper');
  const input = page.getByLabel('OpenAPI document (JSON or YAML)');

  await input.fill(
    'openapi: 3.0.3\ninfo: {title: T, version: "1"}\npaths:\n  /a:\n    get:\n      responses:\n        "200":\n          description: ok\n          content:\n            application/json:\n              schema: {$ref: "#/components/schemas/Missing"}\n        "500": {$ref: "https://example.com/errors.yaml#/E"}\n',
  );
  await expect(page.getByText('1 operation · 0 components · 1 unresolved $ref')).toBeVisible();
  await expect(page.getByText(/Unresolved \$ref "#\/components\/schemas\/Missing"/)).toBeVisible();
  await expect(page.getByText(/External \$ref "https:\/\/example.com\/errors.yaml#\/E" .* was not fetched/)).toBeVisible();

  await input.fill('{"openapi": ');
  await expect(page.getByText('Couldn’t read the document', { exact: true })).toBeVisible();

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('OpenAPI Dependency Mapper has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/openapi-dependency-mapper');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Graph (scrollable)' })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
