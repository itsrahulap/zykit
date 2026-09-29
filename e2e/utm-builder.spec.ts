import { expect, test } from '@playwright/test';

test('builds a tagged URL, keeps params and fragment, and remembers history', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/utm-builder');
  await expect(page).toHaveTitle(/^UTM Builder: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('Website URL').fill('https://example.com/p?plan=pro#faq');
  await page.getByRole('combobox', { name: 'Preset' }).click();
  await page.getByRole('option', { name: 'Newsletter' }).click();
  await page.getByLabel('Campaign (utm_campaign)').fill('Spring Sale');
  const out = page.getByRole('region', { name: 'Tagged URL' });
  await expect(out.locator('pre')).toHaveText('https://example.com/p?plan=pro&utm_source=newsletter&utm_medium=email&utm_campaign=spring-sale#faq');

  await page.getByRole('group', { name: 'Spaces' }).getByRole('button', { name: '%20' }).click();
  await page.getByLabel('Lowercase values').uncheck();
  await expect(out.locator('pre')).toContainText('utm_campaign=Spring%20Sale#faq');
  await expect(page.getByText(/Mixed case in utm_campaign/)).toBeVisible();

  await out.getByRole('button', { name: 'Copy' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('utm_campaign=Spring%20Sale');
  const history = page.getByRole('region', { name: 'History' });
  await expect(history.getByText('utm_campaign=Spring%20Sale#faq')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('region', { name: 'History' }).getByText('utm_campaign=Spring%20Sale#faq')).toBeVisible();
  await page.getByRole('button', { name: 'Clear history' }).click();
  await expect(page.getByText(/Links you copy or save are kept here/)).toBeVisible();

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('bulk mode tags each line', async ({ page }) => {
  await page.goto('/tools/utm-builder');
  await page.getByRole('group', { name: 'Mode' }).getByRole('button', { name: 'Bulk' }).click();
  await page.getByLabel('Base URLs').fill('https://a.com/\nb.com/x\nnot a url');
  await page.getByLabel('Source (utm_source)').fill('x');
  await page.getByLabel('Medium (utm_medium)').fill('social');
  await page.getByLabel('Campaign (utm_campaign)').fill('c');
  const out = page.getByRole('region', { name: 'Tagged URL' });
  await expect(out.locator('pre')).toHaveCount(2);
  await expect(out.getByText(/Line 3: Not a valid/)).toBeVisible();
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/utm-builder');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Tagged URL' }).locator('pre')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
