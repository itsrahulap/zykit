import { expect, test } from '@playwright/test';

test('EXPLAIN Visualizer shows the plan tree and findings locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/sql-explain-visualizer');
  await expect(page).toHaveTitle(/EXPLAIN Visualizer/);
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByText(/Text plan with ANALYZE · executed in 125\.0 ms/)).toBeVisible();
  const tree = page.getByRole('region', { name: 'Plan tree' });
  await expect(tree).toContainText('Seq Scan on orders');
  await expect(tree).toContainText('rows 50× off');
  await expect(page.getByText(/Sort takes 50% of the time on its own/)).toBeVisible();
  await expect(page.getByText(/Sort spilled to disk/)).toBeVisible();

  await page.getByLabel('EXPLAIN output').fill('[{"Plan":{"Node Type":"Seq Scan","Relation Name":"t","Total Cost":1,"Plan Rows":5}}]');
  await expect(tree).toContainText('Seq Scan on t');
  await expect(page.getByText('This plan has estimates only.')).toBeVisible();

  await page.getByLabel('EXPLAIN output').fill('  ->  Seq Scan on t');
  await expect(page.getByText(/Couldn’t read the plan/)).toBeVisible();

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('EXPLAIN Visualizer has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/sql-explain-visualizer');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Plan tree' })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
