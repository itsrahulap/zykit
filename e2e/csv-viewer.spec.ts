import { expect, test } from '@playwright/test';

test('shows, sorts, filters and exports a CSV table', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/csv-viewer');
  await expect(page).toHaveTitle(/CSV Viewer.* · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('CSV input').fill('name,age\nAnn,30\nbob,9\nCara,100\nDan,');
  const table = page.getByRole('region', { name: 'Table' });
  await expect(page.getByText('4 rows · 2 columns · comma-separated')).toBeVisible();
  const firstCol = () => table.locator('tbody tr:not([aria-hidden]) td:nth-child(3)').allTextContents();
  expect(await firstCol()).toEqual(['Ann', 'bob', 'Cara', 'Dan']);

  await table.getByRole('button', { name: 'age' }).click();
  await expect.poll(firstCol).toEqual(['bob', 'Ann', 'Cara', 'Dan']);
  await table.getByRole('button', { name: 'age' }).click();
  await expect.poll(firstCol).toEqual(['Cara', 'Ann', 'bob', 'Dan']);
  await expect(table.locator('th[aria-sort="descending"]')).toHaveCount(1);

  await page.getByPlaceholder('Search all columns…').fill('a');
  await table.getByLabel('Filter age').fill('0');
  await expect.poll(firstCol).toEqual(['Cara', 'Ann']);
  await expect(page.getByText('2 of 4 rows · 2 columns · comma-separated')).toBeVisible();

  await table.getByRole('button', { name: 'Copy row 2' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Ann,30');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export view' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('table-filtered.csv');
  const fs = await import('node:fs/promises');
  expect(await fs.readFile((await download.path()) as string, 'utf8')).toBe('name,age\nCara,100\nAnn,30');

  await page.getByText(/Columns \(2 of 2 shown\)/).click();
  await page.getByRole('checkbox', { name: 'name' }).uncheck();
  await expect(table.getByRole('button', { name: 'name' })).toHaveCount(0);

  const stats = page.getByRole('region', { name: 'Column stats' });
  await expect(page.getByText('Stats cover every row')).toBeVisible();
  await page.getByRole('combobox', { name: 'Column' }).click();
  await page.getByRole('option', { name: 'age' }).click();
  await expect(page.locator('dd', { hasText: /^46\.3333$/ })).toBeVisible();
  void stats;

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('handles 100k rows from a file without rendering them all', async ({ page }) => {
  await page.goto('/tools/csv-viewer');
  const lines = ['id,value,label'];
  for (let i = 0; i < 100_000; i++) lines.push(`${i},${(i * 7919) % 100000},"item ${i}"`);
  await page.getByTestId('file-input').setInputFiles({ name: 'big.csv', mimeType: 'text/csv', buffer: Buffer.from(lines.join('\n')) });
  await expect(page.getByText('100,000 rows · 3 columns · comma-separated')).toBeVisible({ timeout: 15_000 });
  const table = page.getByRole('region', { name: 'Table' });
  expect(await table.locator('tbody tr:not([aria-hidden])').count()).toBeLessThan(100);

  await table.getByRole('button', { name: 'value' }).click();
  await table.getByRole('button', { name: 'value' }).click();
  await expect(table.locator('tbody tr:not([aria-hidden]) td:nth-child(4)').first()).toHaveText('99999');

  await table.evaluate((el) => (el.scrollTop = 36 * 50_000));
  await expect(table.locator('tbody tr:not([aria-hidden])').first()).not.toContainText('99999');
  expect(await table.locator('tbody tr:not([aria-hidden])').count()).toBeLessThan(100);
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/csv-viewer');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Table' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
