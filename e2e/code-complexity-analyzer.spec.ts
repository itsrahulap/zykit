import { expect, test, type Page } from '@playwright/test';

// The first analysis downloads the TypeScript compiler chunk into the worker.
const ANALYSIS_TIMEOUT = 60_000;

function watch(page: Page) {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    const sameOrigin = r.url().startsWith(origin) || r.url().startsWith('blob:');
    if (!sameOrigin || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return { offOrigin, errors };
}

test('Code Complexity Analyzer measures functions in a worker', async ({ page }) => {
  test.setTimeout(90_000);
  const { offOrigin, errors } = watch(page);

  await page.goto('/tools/code-complexity-analyzer');
  await expect(page).toHaveTitle(/Code Complexity Analyzer/);
  await page.getByRole('button', { name: 'Try an example' }).click();
  const status = page.locator('[aria-live="polite"]').first();
  await expect(status).toHaveText(/4 functions, 1 over a threshold\./, { timeout: ANALYSIS_TIMEOUT });

  const top = page.getByRole('region', { name: 'Top 10 functions' });
  await expect(top.getByRole('row').nth(1)).toContainText('shippingCost');
  await expect(top.getByRole('row').nth(1)).toContainText('12');
  await expect(top.getByRole('row').nth(1)).toContainText('complexity');

  // The top function is selected: its decision points are marked in its source.
  const source = page.getByRole('region', { name: /Source of shippingCost/ });
  await expect(source.locator('mark')).toHaveCount(11);
  await expect(source.locator('mark').first()).toHaveText('if');

  // Thresholds re-flag without re-parsing.
  await page.getByLabel('Complexity above').fill('15');
  await expect(status).toHaveText(/4 functions, 0 over a threshold\./);
  await page.getByLabel('Lines above').fill('3');
  await expect(status).toHaveText(/4 functions, 2 over a threshold\./);
  await expect(top.getByRole('row').nth(1)).toContainText('lines');

  await top.getByRole('button', { name: 'Cart.add' }).click();
  await expect(page.getByRole('region', { name: /Source of Cart\.add/ }).locator('mark')).toHaveText(['if']);

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Code Complexity Analyzer reports syntax errors and keeps going', async ({ page }) => {
  test.setTimeout(90_000);
  const { errors } = watch(page);
  await page.goto('/tools/code-complexity-analyzer');
  await page.getByLabel('Code').fill('function ok(a) {\n  return a || 1;\n}\nconst x = ;\n');
  await expect(page.locator('[aria-live="polite"]').first()).toHaveText(/1 function, 0 over a threshold, 1 syntax error\./, { timeout: ANALYSIS_TIMEOUT });
  await expect(page.getByRole('region', { name: 'Syntax errors' })).toContainText('4:11 Expression expected.');
  await expect(page.getByRole('region', { name: 'All functions' })).toContainText('ok');
  expect(errors).toEqual([]);
});

test('Code Complexity Analyzer has no sideways scrolling on a phone', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/code-complexity-analyzer');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'All functions' })).toBeVisible({ timeout: ANALYSIS_TIMEOUT });
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
