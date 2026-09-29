import { expect, test } from '@playwright/test';

test('formats and minifies SQL with dialect and case options', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/sql-formatter');
  await expect(page).toHaveTitle(/^SQL Formatter: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('Input SQL').fill("select id, name from users where active = true and name <> 'a  b'");
  const output = page.getByRole('region', { name: 'Output' });
  await expect(output.locator('pre')).toHaveText("SELECT\n  id,\n  name\nFROM\n  users\nWHERE\n  active = TRUE\n  AND name <> 'a  b'");

  await page.getByRole('group', { name: 'Indent' }).getByRole('button', { name: '4 spaces' }).click();
  await expect(output.locator('pre')).toContainText('\n    id,');

  await page.getByRole('combobox', { name: 'Keywords' }).click();
  await page.getByRole('option', { name: 'lower' }).click();
  await expect(output.locator('pre')).toContainText('select\n    id,');

  await page.getByRole('group', { name: 'Line break around AND / OR' }).getByRole('button', { name: 'Break after' }).click();
  await expect(output.locator('pre')).toContainText('active = true and\n');

  await page.getByRole('group', { name: 'Action' }).getByRole('button', { name: 'Minify' }).click();
  await expect(output.locator('pre')).toHaveText("select id,name from users where active=true and name<>'a  b'");

  await output.getByRole('button', { name: 'Copy' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("select id,name from users where active=true and name<>'a  b'");

  const downloadPromise = page.waitForEvent('download');
  await output.getByRole('button', { name: 'Download .sql' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('minified.sql');

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('minify can strip comments without touching strings', async ({ page }) => {
  await page.goto('/tools/sql-formatter');
  await page.getByRole('group', { name: 'Action' }).getByRole('button', { name: 'Minify' }).click();
  await page.getByLabel('Input SQL').fill("SELECT '-- keep' -- drop\nFROM t /* drop */");
  const pre = page.getByRole('region', { name: 'Output' }).locator('pre');
  await expect(pre).toHaveText("SELECT '-- keep' -- drop\nFROM t /* drop */");
  await page.getByLabel(/Remove comments/).check();
  await expect(pre).toHaveText("SELECT '-- keep' FROM t");
});

test('shows parse errors with a position and lets you switch dialect', async ({ page }) => {
  await page.goto('/tools/sql-formatter');
  await page.getByLabel('Input SQL').fill('SELECT a FROM b WHERE )');
  await expect(page.getByText('Parse error at token: )', { exact: true })).toBeVisible();
  await expect(page.getByText('Line 1, column 23', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Input SQL')).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'Jump to error in input' }).click();
  await expect(page.getByLabel('Input SQL')).toBeFocused();

  await page.getByLabel('Input SQL').fill('SELECT [my col] FROM t');
  await page.getByRole('combobox', { name: 'Dialect' }).click();
  await page.getByRole('option', { name: 'SQL Server (T-SQL)' }).click();
  await expect(page.getByRole('region', { name: 'Output' }).locator('pre')).toHaveText('SELECT\n  [my col]\nFROM\n  t');
});

test('loads the example and has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/sql-formatter');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Output' }).locator('pre')).toContainText('DATE_TRUNC');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
