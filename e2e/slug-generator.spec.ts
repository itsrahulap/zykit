import { expect, test } from '@playwright/test';

test('turns lines of text into slugs with options', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/slug-generator');
  await expect(page).toHaveTitle(/^Slug Generator: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('Text').fill('Crème Brûlée & Straße\nThe Lord of the Rings');
  const out = page.getByRole('region', { name: 'Slugs' });
  await expect(out.locator('pre')).toHaveText('creme-brulee-and-strasse\nthe-lord-of-the-rings');
  await expect(page.getByText('2 slugs generated')).toBeVisible();

  await page.getByRole('group', { name: 'Separator' }).getByRole('button', { name: 'Underscore _' }).click();
  await page.getByLabel('Remove stop words').check();
  await expect(out.locator('pre')).toHaveText('creme_brulee_strasse\nlord_rings');

  await page.getByLabel('Max length').fill('12');
  await expect(out.locator('pre')).toHaveText('creme_brulee\nlord_rings');

  await out.getByRole('button', { name: 'Copy all' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('creme_brulee\nlord_rings');

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/slug-generator');
  await page.getByRole('button', { name: 'Try an example' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
