import { expect, test, type Page } from '@playwright/test';

// The first check downloads the compiler (~1 MB gzip), so allow more than the default timeout.
const COMPILER_TIMEOUT = 60_000;

const waitForCompiler = (page: Page) => expect(page.getByText(/^TypeScript \d+\.\d+/)).toBeVisible({ timeout: COMPILER_TIMEOUT });

test('TypeScript Type Explorer checks types with the real compiler, locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    const url = r.url();
    if (url.startsWith('blob:')) return;
    if (!url.startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${url}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/typescript-type-explorer');
  await expect(page).toHaveTitle(/TypeScript Type Explorer/);
  await expect(page.getByText('Loading the TypeScript compiler…').first()).toBeVisible();
  await waitForCompiler(page);

  const types = page.getByRole('region', { name: 'Resolved types' });
  await expect(types).toContainText('"id" | "name" | "email"');
  await expect(page.getByText(/^No errors · \d+ types resolved$/)).toBeVisible();

  await page.getByLabel('TypeScript code').fill("type Box<T> = { value: T };\nconst n: number = 'x';\n");
  await expect(page.getByText('2:7', { exact: true })).toBeVisible();
  await expect(page.getByText("Type 'string' is not assignable to type 'number'.")).toBeVisible();
  await expect(page.getByText(/^1 error · 2 types resolved$/)).toBeVisible();

  await page.getByRole('combobox', { name: 'Example' }).click();
  await page.getByRole('option', { name: 'Template literal types', exact: true }).click();
  await expect(types).toContainText('"user:created" | "user:deleted" | "post:created" | "post:deleted"');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('TypeScript Type Explorer has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/typescript-type-explorer');
  await waitForCompiler(page);
  await page.getByRole('combobox', { name: 'Example' }).click();
  await page.getByRole('option', { name: 'Mapped types', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Resolved types' })).toContainText('getTitle');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
