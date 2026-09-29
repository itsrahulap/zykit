import { expect, test } from '@playwright/test';

test('looks up extensions, MIME types, file names and a local file', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/mime-lookup');
  await expect(page).toHaveTitle(/MIME Type Lookup/);
  const origin = new URL(page.url()).origin;

  const search = page.getByRole('searchbox');
  const results = page.getByRole('region', { name: 'Results' });

  await search.fill('.png');
  await expect(results.getByRole('listitem').first()).toContainText('image/png');

  await search.fill('report.final.pdf');
  await expect(results.getByRole('listitem')).toHaveCount(1);
  await expect(results).toContainText('application/pdf');
  await results.getByRole('button', { name: 'Copy MIME' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('application/pdf');

  await search.fill('image/');
  await expect(results.getByRole('listitem').first()).toContainText('image/');
  await expect(page.getByText(/matches for “image\/”/)).toBeVisible();

  await search.fill('woff2');
  await expect(results.getByRole('listitem').first()).toContainText('font/woff2');

  await page.getByLabel('Choose a file to check').setInputFiles({ name: 'photo.final.webp', mimeType: 'image/webp', buffer: Buffer.from('x') });
  await expect(page.getByText('.webp', { exact: true })).toBeVisible();
  await expect(page.getByText('image/webp', { exact: true })).toHaveCount(2);

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/mime-lookup');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
