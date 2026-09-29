import { expect, test } from '@playwright/test';

test('strips tracking params, unwraps redirects and copies all', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/url-cleaner');
  await expect(page).toHaveTitle(/^URL Cleaner: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('URLs').fill('https://example.com/a?id=1&utm_source=x&fbclid=y#top\nhttps://www.google.com/url?q=https://shop.example.org/?gclid%3Dz&sa=D\nhttps://t.co/abc');
  const out = page.getByRole('region', { name: 'Output' });
  await expect(out.locator('pre')).toHaveText('https://example.com/a?id=1#top\nhttps://shop.example.org/\nhttps://t.co/abc');
  await expect(page.getByText('2 links cleaned of 3 · 3 parameters removed')).toBeVisible();
  await expect(page.getByText('unwrapped www.google.com redirect')).toBeVisible();
  await expect(page.getByText(/can't be unwrapped offline/)).toBeVisible();

  await out.getByRole('button', { name: 'Copy all' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://example.com/a?id=1#top\nhttps://shop.example.org/\nhttps://t.co/abc');

  await page.getByLabel('UTM campaign tags').uncheck();
  await expect(out.locator('pre')).toContainText('https://example.com/a?id=1&utm_source=x#top');

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('cleans links inside text', async ({ page }) => {
  await page.goto('/tools/url-cleaner');
  await page.getByRole('group', { name: 'Input type' }).getByRole('button', { name: 'Find links in text' }).click();
  await page.getByLabel('Text with links').fill('Look: https://ex.com/?utm_medium=a&x=1, thanks!');
  await expect(page.getByRole('region', { name: 'Output' }).locator('pre')).toHaveText('Look: https://ex.com/?x=1, thanks!');
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/url-cleaner');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Changes' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
