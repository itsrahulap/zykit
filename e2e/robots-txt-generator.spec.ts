import { expect, test } from '@playwright/test';

test('builds robots.txt from presets, tests URLs and downloads', async ({ page }) => {
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/robots-txt-generator');
  await expect(page).toHaveTitle(/^Robots\.txt Generator: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByRole('combobox', { name: 'Preset' }).click();
  await page.getByRole('option', { name: 'Block AI crawlers' }).click();
  const file = page.getByRole('region', { name: 'robots.txt' });
  await expect(file.locator('pre')).toContainText('User-agent: GPTBot\nUser-agent: ChatGPT-User');
  await expect(file.locator('pre')).toContainText('User-agent: *\nAllow: /');

  const result = page.getByRole('status', { name: 'Test result' });
  await expect(result).toContainText('Allowed');
  await page.getByRole('button', { name: 'GPTBot', exact: true }).click();
  await expect(result).toContainText('Blocked');
  await expect(result).toContainText('Disallow: /');

  await page.getByLabel('Sitemaps').fill('https://example.com/sitemap.xml');
  await expect(file.locator('pre')).toContainText('Sitemap: https://example.com/sitemap.xml');

  const downloadPromise = page.waitForEvent('download');
  await file.getByRole('button', { name: 'Download robots.txt' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('robots.txt');

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('tests and lints a pasted robots.txt', async ({ page }) => {
  await page.goto('/tools/robots-txt-generator');
  await page.getByRole('group', { name: 'Test against' }).getByRole('button', { name: 'Paste a robots.txt' }).click();
  await page.getByLabel('Robots.txt to test').fill('Disallow: /x\nUser-agent: *\nDisallow: /shop/\nAllow: /shop/public\nFoo: bar');
  await page.getByLabel('URL or path').fill('https://example.com/shop/public/item');
  const result = page.getByRole('status', { name: 'Test result' });
  await expect(result).toContainText('Allowed');
  await expect(result).toContainText('Allow: /shop/public');
  await page.getByLabel('URL or path').fill('/shop/cart');
  await expect(result).toContainText('Blocked');
  const lint = page.getByRole('region', { name: 'Lint' });
  await expect(lint).toContainText('appears before any User-agent line');
  await expect(lint).toContainText('Unknown directive "Foo"');
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/robots-txt-generator');
  await page.getByRole('combobox', { name: 'Preset' }).click();
  await page.getByRole('option', { name: 'WordPress' }).click();
  await expect(page.getByRole('region', { name: 'robots.txt' }).locator('pre')).toContainText('/wp-admin/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
