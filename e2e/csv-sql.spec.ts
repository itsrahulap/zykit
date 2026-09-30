import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const CUSTOMERS = 'id,name,city\n1,Ana,Lisbon\n2,Ben,Berlin\n3,Chloé,Berlin\n4,Diego,Madrid\n';
const ORDERS = 'order_id,customer_id,amount\n10,1,5.5\n11,2,20\n12,2,1.25\n13,3,7\n14,9,100\n';

async function runSql(page: Page, sql: string) {
  const editor = page.getByLabel('SQL query');
  await editor.fill(sql);
  await editor.press('ControlOrMeta+Enter');
}

test('Query CSV with SQL loads files, runs GROUP BY and JOIN, and exports', async ({ page, request }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  const workers: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('worker', (w) => workers.push(w.url()));

  const res = await page.goto('/tools/csv-sql');
  await expect(page).toHaveTitle(/Query CSV with SQL/);
  // The page's policy never allows WebAssembly compilation; only the SQLite worker's does.
  const pageCsp = res!.headers()['content-security-policy'];
  expect(pageCsp).toContain("script-src 'self'");
  expect(pageCsp).not.toContain('wasm-unsafe-eval');

  await page.getByTestId('file-input').setInputFiles([
    { name: 'Customers.csv', mimeType: 'text/csv', buffer: Buffer.from(CUSTOMERS) },
    { name: 'orders.csv', mimeType: 'text/csv', buffer: Buffer.from(ORDERS) },
  ]);
  const tables = page.getByRole('list', { name: 'Loaded tables' });
  await expect(tables.getByRole('button', { name: 'customers', exact: true })).toBeVisible();
  await expect(tables.getByRole('button', { name: 'orders', exact: true })).toBeVisible();
  await expect(tables).toContainText('4 rows');
  await expect(tables).toContainText('INTEGER');
  await expect(tables).toContainText('REAL');

  const worker = workers.find((u) => /\/assets\/sql-worker-[^/]+\.js$/.test(u));
  expect(worker, `workers: ${workers.join(', ')}`).toBeTruthy();
  const workerCsp = (await request.get(worker!)).headers()['content-security-policy'];
  expect(workerCsp).toContain("script-src 'self' 'wasm-unsafe-eval'");

  const results = page.getByRole('region', { name: 'Query results' });
  await runSql(page, 'SELECT city, COUNT(*) AS n FROM customers GROUP BY city ORDER BY n DESC, city');
  await expect(page.getByRole('region', { name: 'Query results' }).locator('tbody tr').first()).toContainText('Berlin');
  await expect(results.locator('tbody tr').first()).toContainText('2');
  await expect(page.getByRole('region', { name: 'Results', exact: true })).toContainText('3 rows');

  await runSql(page, 'SELECT c.name, SUM(o.amount) AS total FROM orders o JOIN customers c ON c.id = o.customer_id GROUP BY c.name ORDER BY total DESC');
  await expect(results.locator('tbody tr')).toHaveCount(3);
  await expect(results.locator('tbody tr').first()).toContainText('Ben');
  await expect(results.locator('tbody tr').first()).toContainText('21.25');

  const [csv] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()]);
  expect(csv.suggestedFilename()).toBe('query-result.csv');
  expect(readFileSync(await csv.path()).toString().split(/\r?\n/).filter(Boolean)).toEqual(['name,total', 'Ben,21.25', 'Chloé,7', 'Ana,5.5']);
  const [json] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export JSON' }).click()]);
  expect(JSON.parse(readFileSync(await json.path()).toString())[0]).toEqual({ name: 'Ben', total: 21.25 });

  // SQLite errors are shown as they are.
  await runSql(page, 'SELECT * FROM nope');
  await expect(page.getByTestId('sql-error')).toContainText('no such table: nope');

  // Cancel stops a runaway query and reloads the tables.
  await runSql(page, 'WITH RECURSIVE r(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM r) SELECT COUNT(*) FROM r');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByTestId('sql-error')).toContainText('Query cancelled');
  await expect(tables.getByRole('button', { name: 'orders', exact: true })).toBeVisible();
  await runSql(page, 'SELECT COUNT(*) AS n FROM orders');
  await expect(results.locator('tbody tr').first()).toContainText('5');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Query CSV with SQL has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/csv-sql');
  await page.getByRole('button', { name: 'Load sample data' }).click();
  await expect(page.getByRole('list', { name: 'Loaded tables' })).toContainText('orders');
  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.getByRole('region', { name: 'Query results' })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
