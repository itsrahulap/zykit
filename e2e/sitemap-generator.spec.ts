import { expect, test } from '@playwright/test';

test('generates an escaped sitemap.xml and downloads it', async ({ page }) => {
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/sitemap-generator');
  await expect(page).toHaveTitle(/^Sitemap Generator: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByText('4 URLs · 1 sitemap file')).toBeVisible();
  await expect(page.getByText(/1 duplicate URL removed/)).toBeVisible();
  await expect(page.getByText(/Line 6: Must be an absolute/)).toBeVisible();

  const out = page.getByRole('region', { name: 'Output' });
  await expect(out.locator('pre')).toContainText('<loc>https://example.com/blog?tag=news&amp;page=2</loc>');
  await expect(out.locator('pre')).toContainText('<lastmod>2026-01-15</lastmod>');

  await page.getByRole('combobox', { name: 'changefreq' }).click();
  await page.getByRole('option', { name: 'weekly' }).click();
  await page.getByRole('button', { name: 'Today' }).click();
  await expect(out.locator('pre')).toContainText('<changefreq>weekly</changefreq>');

  const downloadPromise = page.waitForEvent('download');
  await out.getByRole('button', { name: 'Download .xml' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('sitemap.xml');

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('validates a pasted sitemap', async ({ page }) => {
  await page.goto('/tools/sitemap-generator');
  await page.getByRole('group', { name: 'Mode' }).getByRole('button', { name: 'Validate a sitemap' }).click();
  await page.getByLabel('Sitemap XML').fill('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://a.com/</loc></url><url><loc>https://a.com/</loc></url></urlset>');
  await expect(page.getByText('<urlset> · 2 entries · 0 errors')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Validation' })).toContainText('Duplicate URL');
  await page.getByLabel('Sitemap XML').fill('<urlset><url></urlset>');
  await expect(page.getByRole('region', { name: 'Validation' })).toContainText('Not well-formed XML');
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/sitemap-generator');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Output' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
