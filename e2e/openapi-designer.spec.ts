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

const output = (page: Page) => page.getByRole('region', { name: 'Output', exact: true }).locator('pre');

test('OpenAPI Designer edits a spec with forms and keeps JSON and YAML in sync', async ({ page }) => {
  const { offOrigin, errors } = watch(page);
  await page.goto('/tools/openapi-designer');
  await expect(page).toHaveTitle(/OpenAPI Designer/);

  // Starts from the example document.
  await expect(output(page)).toContainText('title: Pet Store');
  await expect(page.getByText('No problems found.')).toBeVisible();

  await page.getByLabel('Title', { exact: true }).fill('Users API');
  await expect(output(page)).toContainText('title: Users API');

  await page.getByLabel('New path').fill('users/{id}');
  await page.getByRole('button', { name: 'Add path' }).click();
  await page.getByRole('combobox', { name: 'Add operation to /users/{id}' }).click();
  await page.getByRole('option', { name: 'GET', exact: true }).click();
  await page.getByRole('tab', { name: 'JSON' }).click();
  const json = JSON.parse((await output(page).textContent())!);
  expect(json.paths['/users/{id}'].get).toEqual({
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
    responses: { '200': { description: 'OK' } },
  });
  await expect(page.getByText('No problems found.')).toBeVisible();

  // A broken edit shows up under Validation.
  await page.getByLabel('Version', { exact: true }).fill('');
  await expect(page.getByText('info.version is required.')).toBeVisible();
  await expect(page.getByText('1 error')).toBeVisible();

  // Docs preview: example request built from the schemas.
  await page.getByRole('tab', { name: 'Docs preview' }).click();
  const docs = page.getByRole('region', { name: 'Docs preview' });
  await docs.getByText('Create a pet').click();
  const curl = docs.getByText("curl -X POST 'https://api.example.com/v1/pets'");
  await expect(curl).toBeVisible();
  await expect(curl).toContainText('"name": "Rex"');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('OpenAPI Designer imports YAML, lists unsupported parts and reports syntax errors', async ({ page }) => {
  const { offOrigin, errors } = watch(page);
  await page.goto('/tools/openapi-designer');
  const input = page.getByLabel('OpenAPI document to import (JSON or YAML)');

  await input.fill('openapi: 3.1.0\ninfo:\n  title: Hooks\n  version: "2"\nwebhooks:\n  ping:\n    post: {}\npaths: {}\n');
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.getByText('Top-level "webhooks": kept as imported, but not editable in the forms.')).toBeVisible();
  await expect(output(page)).toContainText('webhooks:');
  await expect(output(page)).toContainText('title: Hooks');

  await input.fill('{"openapi": "3.1.0", "info": }');
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.getByText('Couldn’t import')).toBeVisible();
  await expect(output(page)).toContainText('title: Hooks');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('OpenAPI Designer hands the spec to the dependency mapper', async ({ page }) => {
  const { offOrigin, errors } = watch(page);
  await page.goto('/tools/openapi-designer');
  await page.getByRole('button', { name: 'Map dependencies' }).click();
  await expect(page).toHaveURL(/\/tools\/openapi-dependency-mapper$/);
  await expect(page.getByText('4 operations · 5 components · 0 unresolved $refs')).toBeVisible();
  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('OpenAPI Designer has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/openapi-designer');
  await expect(output(page)).toContainText('openapi: 3.1.0');
  await page.getByText('List pets').first().click();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
