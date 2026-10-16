import { expect, test, type Page } from '@playwright/test';

async function loadSample(page: Page, name: RegExp) {
  await page.getByRole('combobox', { name: 'Sample' }).click();
  await page.getByRole('option', { name }).click();
}

test('builds queries and schema SQL from a sample, locally', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('dialog', (d) => d.accept());

  await page.goto('/tools/postgres-query-builder');
  await expect(page).toHaveTitle(/^PostgreSQL Query Builder: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;
  await expect(page.getByText('No schema yet')).toBeVisible();

  await loadSample(page, /E-commerce/);
  const sql = page.locator('#panel-query pre');
  await expect(sql).toHaveText(
    'SELECT\n    u.name,\n    COUNT(o.id) AS order_count\nFROM users AS u\nLEFT JOIN orders AS o\n    ON o.user_id = u.id\nGROUP BY\n    u.id\nORDER BY\n    order_count DESC\nLIMIT 10;',
  );
  await expect(page.getByText('What this query does')).toBeVisible();

  // Add a WHERE filter.
  const where = page.getByRole('group', { name: 'WHERE conditions' });
  await where.getByRole('button', { name: '+ Condition' }).click();
  await where.getByLabel('Column').selectOption({ label: 'u.email' });
  await where.getByLabel('Operator').selectOption('ILIKE');
  await where.getByLabel('Value').fill('%@example.com');
  await expect(sql).toContainText("WHERE u.email ILIKE '%@example.com'\nGROUP BY");

  // Invalid configuration shows problems instead of SQL.
  await page.getByLabel('LIMIT').fill('-1');
  await expect(page.getByText('Fix these to generate SQL')).toBeVisible();
  await expect(sql).toHaveCount(0);
  await page.getByLabel('LIMIT').fill('5');
  await expect(sql).toContainText('LIMIT 5;');

  // Re-join orders: the suggestion comes from the relationship and must be confirmed.
  await page.getByRole('button', { name: 'Remove orders from the query' }).click();
  await page.getByLabel('Join another table').selectOption({ label: 'orders' });
  const suggestion = page.getByRole('region', { name: 'Join suggestion' });
  await expect(suggestion).toContainText('u.id = orders.user_id');
  await suggestion.getByRole('button', { name: 'Use this join' }).click();
  await expect(sql).toContainText('INNER JOIN orders\n    ON orders.user_id = u.id');

  await page.getByRole('button', { name: 'Copy SQL' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('INNER JOIN orders');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download query.sql' }).click();
  expect((await download).suggestedFilename()).toBe('query.sql');

  // Schema DDL, then add a table with a relationship.
  await page.getByRole('tab', { name: 'Schema Designer' }).click();
  const ddl = page.locator('#panel-schema pre');
  await expect(ddl).toContainText('CREATE TABLE users (\n    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,');
  await expect(ddl).toContainText('CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE');

  await page.getByRole('button', { name: '+ Add table' }).click();
  await page.getByLabel('Table name', { exact: true }).fill('reviews');
  await page.getByRole('button', { name: '+ Add column' }).click();
  await page.getByLabel('Column name').last().fill('product_id');
  await page.getByLabel('Type').last().selectOption('BIGINT');
  await page.getByLabel('Child table').selectOption({ label: 'reviews' });
  await page.getByLabel('Foreign key column').selectOption({ label: 'product_id (bigint)' });
  await page.getByLabel('Parent table').selectOption({ label: 'products' });
  await page.getByRole('button', { name: 'Add relationship' }).click();
  await expect(ddl).toContainText('CREATE TABLE reviews (');
  await expect(ddl).toContainText('CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES products (id)');
  await expect(ddl).toContainText('CREATE INDEX reviews_product_id_idx ON reviews (product_id);');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(ddl).not.toContainText('reviews_product_id_fkey');
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(ddl).toContainText('reviews_product_id_fkey');

  // The project survives a reload.
  await page.reload();
  await page.getByRole('tab', { name: 'Schema Designer' }).click();
  await expect(page.locator('#panel-schema pre')).toContainText('reviews_product_id_fkey');

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/postgres-query-builder');
  await loadSample(page, /Blog/);
  await expect(page.locator('#panel-query pre')).toContainText('FROM posts AS p');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.getByRole('tab', { name: 'Schema Designer' }).click();
  await expect(page.getByRole('region', { name: 'Schema canvas' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
