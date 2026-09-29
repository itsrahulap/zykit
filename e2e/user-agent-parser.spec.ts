import { expect, test } from '@playwright/test';

test('parses the current browser by default and sample user agents', async ({ page }) => {
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/user-agent-parser');
  await expect(page).toHaveTitle(/^User-Agent Parser: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  const ua = await page.evaluate(() => navigator.userAgent);
  await expect(page.getByLabel('User-Agent')).toHaveValue(ua);
  await expect(page.getByText('Client Hints (this browser)')).toBeVisible();

  await page.getByRole('combobox', { name: 'Samples' }).click();
  await page.getByRole('option', { name: 'Safari on iPhone' }).click();
  await expect(page.getByText('Safari 17 on iOS 17.6.1 · Mobile')).toBeVisible();

  await page.getByLabel('User-Agent').fill('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0');
  const parsed = page.getByRole('region', { name: 'Parsed' });
  await expect(parsed).toContainText('Microsoft Edge 129.0.0.0');
  await expect(parsed).toContainText('Blink 129');
  await expect(parsed).toContainText('Windows 10 or 11');
  await expect(page.getByText(/Windows 10 and 11 both send/)).toBeVisible();

  await page.getByLabel('User-Agent').fill('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)');
  await expect(page.getByRole('region', { name: 'Bot' })).toContainText('ClaudeBot 1.0');
  await expect(page.getByRole('region', { name: 'Bot' })).toContainText('AI crawler / assistant · Anthropic');

  await page.getByRole('button', { name: 'Use my browser' }).click();
  await expect(page.getByLabel('User-Agent')).toHaveValue(ua);

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/user-agent-parser');
  await page.getByRole('combobox', { name: 'Samples' }).click();
  await page.getByRole('option', { name: 'Instagram in-app' }).click();
  await expect(page.getByRole('region', { name: 'Parsed' })).toContainText('Instagram');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
