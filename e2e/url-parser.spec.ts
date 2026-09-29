import { expect, test } from '@playwright/test';

test('parses a URL, masks the password and edits query parameters', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/url-parser');
  await expect(page).toHaveTitle(/^URL Parser: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('URL', { exact: true }).fill('https://bob:hunter2@münchen.de/a/b%20c?q=1&q=2#top');
  await expect(page.getByText('Valid HTTPS URL · 2 query parameters')).toBeVisible();
  await expect(page.getByText('xn--mnchen-3ya.de', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('münchen.de', { exact: true })).toBeVisible();
  await expect(page.getByText('(default)')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Path segments' }).getByRole('listitem')).toHaveText(['1a', '2b c']);

  const pw = page.getByTestId('password');
  await expect(pw).toHaveText('••••••••');
  await page.getByRole('button', { name: 'Show' }).click();
  await expect(pw).toHaveText('hunter2');

  await expect(page.getByLabel('Key 2')).toHaveValue('q');
  await page.getByLabel('Value 2').fill('two words');
  await page.getByRole('button', { name: 'Remove parameter 1' }).click();
  await page.getByRole('button', { name: '+ Add parameter' }).click();
  await page.getByLabel('Key 2').fill('lang');
  await page.getByLabel('Value 2').fill('de');
  const rebuilt = page.getByTestId('rebuilt-url');
  await expect(rebuilt).toHaveText('https://bob:hunter2@xn--mnchen-3ya.de/a/b%20c?q=two+words&lang=de#top');

  await page.getByRole('region', { name: 'Query parameters' }).getByRole('button', { name: 'Copy' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://bob:hunter2@xn--mnchen-3ya.de/a/b%20c?q=two+words&lang=de#top');

  await page.getByRole('button', { name: 'Use as input' }).click();
  await expect(page.getByLabel('URL', { exact: true })).toHaveValue('https://bob:hunter2@xn--mnchen-3ya.de/a/b%20c?q=two+words&lang=de#top');

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('explains invalid and relative URLs', async ({ page }) => {
  await page.goto('/tools/url-parser');
  await page.getByLabel('URL', { exact: true }).fill('../img/logo.png');
  await expect(page.getByRole('alert')).toContainText('relative URL');
  await page.getByLabel(/Base URL/).fill('https://example.com/docs/guide/');
  await expect(page.getByText('Valid HTTPS URL (resolved against the base) · 0 query parameters')).toBeVisible();
  await expect(page.getByText('https://example.com/docs/img/logo.png').first()).toBeVisible();
  await page.getByLabel('URL', { exact: true }).fill('https://[::1');
  await page.getByLabel(/Base URL/).fill('');
  await expect(page.getByRole('alert')).toContainText('not a valid URL');
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/url-parser');
  await page.getByRole('button', { name: 'Try an example' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
