import { expect, test } from '@playwright/test';

test.use({ timezoneId: 'America/New_York' });

test('converts timestamps both ways across time zones', async ({ page }) => {
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/timestamp-converter');
  await expect(page).toHaveTitle(/^Timestamp Converter: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  const nowS = Number(await page.getByTestId('Now · seconds').textContent());
  expect(Math.abs(nowS - Date.now() / 1000)).toBeLessThan(120);

  const input = page.getByLabel('Unix timestamp');
  await input.fill('1700000000000');
  await expect(page.getByText('Read as milliseconds (detected) · 2023-11-14T22:13:20.000Z')).toBeVisible();
  await expect(page.getByText('2023-11-14 17:13:20.000 (UTC-05:00)').first()).toBeVisible();
  await expect(page.getByText('Tuesday')).toBeVisible();
  await expect(page.getByText('W46 of 2023')).toBeVisible();

  await page.getByRole('group', { name: 'Unit' }).getByRole('button', { name: 's', exact: true }).click();
  await expect(page.getByText(/^Read as seconds · /)).toBeVisible();
  await input.fill('100000000000000');
  await expect(page.getByRole('alert').filter({ hasText: 'Out of range' })).toBeVisible();
  await input.fill('1700000000000');
  await page.getByRole('group', { name: 'Unit' }).getByRole('button', { name: 'Auto' }).click();

  const zone = page.getByRole('combobox', { name: 'Time zone', exact: true });
  await zone.click();
  await page.getByRole('option', { name: 'Asia/Tokyo', exact: true }).click();
  await expect(zone).toHaveText('Asia/Tokyo');
  await expect(page.getByText('2023-11-15 07:13:20.000 (UTC+09:00)')).toBeVisible();
  await expect(page.getByText('Wed, 15 Nov 2023 07:13:20 +0900')).toBeVisible();

  await input.fill('hello');
  await expect(page.getByRole('alert').filter({ hasText: 'Not a number' })).toBeVisible();

  const reverse = page.locator('section', { hasText: 'Date to timestamp' });
  await page.getByLabel('Date and time').fill('2023-11-14T17:13:20');
  await expect(reverse.getByText('1700000000', { exact: true })).toBeVisible();
  await expect(reverse.getByText('1700000000000', { exact: true })).toBeVisible();

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/timestamp-converter');
  await page.getByLabel('Unix timestamp').fill('1700000000');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
