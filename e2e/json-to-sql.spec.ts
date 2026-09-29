import { expect, test } from '@playwright/test';

test('converts JSON rows into CREATE TABLE and INSERT statements', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/json-to-sql');
  await expect(page).toHaveTitle(/^JSON to SQL: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('Table name').fill('people');
  await page.getByLabel('Input JSON').fill('[{"id":1,"name":"O\'Neil","ok":true},{"id":2,"name":"a\\\\b"}]');
  const output = page.getByRole('region', { name: 'SQL output' });
  await expect(output.locator('pre')).toHaveText(
    'CREATE TABLE "people" (\n  "id" INTEGER NOT NULL,\n  "name" VARCHAR(16) NOT NULL,\n  "ok" BOOLEAN\n);\n\n' +
      'INSERT INTO "people" ("id", "name", "ok") VALUES\n  (1, \'O\'\'Neil\', TRUE),\n  (2, \'a\\b\', NULL);\n',
  );
  await expect(page.getByText('2 rows · 3 columns · 2 statements')).toBeVisible();

  await page.getByRole('combobox', { name: 'Dialect' }).click();
  await page.getByRole('option', { name: 'MySQL' }).click();
  await expect(output.locator('pre')).toContainText("(1, 'O\\'Neil', TRUE),\n  (2, 'a\\\\b', NULL);");

  await page.getByRole('combobox', { name: 'Primary key' }).click();
  await page.getByRole('option', { name: 'id' }).click();
  await expect(output.locator('pre')).toContainText('`id` INT PRIMARY KEY');

  await page.getByLabel('Include CREATE TABLE').uncheck();
  await page.getByLabel('Rows per INSERT').fill('1');
  await expect(output.locator('pre')).toHaveText(
    "INSERT INTO `people` (`id`, `name`, `ok`) VALUES (1, 'O\\'Neil', TRUE);\n\nINSERT INTO `people` (`id`, `name`, `ok`) VALUES (2, 'a\\\\b', NULL);\n",
  );

  await output.getByRole('button', { name: 'Copy' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('INSERT INTO `people`');

  const downloadPromise = page.waitForEvent('download');
  await output.getByRole('button', { name: 'Download .sql' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('people.sql');

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('explains inputs that are not rows', async ({ page }) => {
  await page.goto('/tools/json-to-sql');
  await page.getByLabel('Input JSON').fill('[{"a":1}, 5]');
  await expect(page.getByText('Item 2 is a number, not an object.').first()).toBeVisible();
  await page.getByLabel('Input JSON').fill('[{"a":1,}]');
  await expect(page.getByText(/Invalid JSON: .*\(line 1, column 9\)/)).toBeVisible();
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/json-to-sql');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'SQL output' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
