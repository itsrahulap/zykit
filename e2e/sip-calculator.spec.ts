import { expect, test } from '@playwright/test';

test('SIP & Compound Interest Calculator works locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/sip-calculator');
  await expect(page).toHaveTitle(/SIP/);
  // Defaults: ₹10,000/month, 12%, 10 years, start of month ≈ ₹23,23,391.
  await expect(page.getByRole('region', { name: 'Result' })).toContainText('23,23,391');
  await expect(page.getByRole('region', { name: 'Year-by-year growth' }).getByRole('row')).toHaveCount(11);

  await page.getByRole('button', { name: 'Lump sum' }).click();
  await page.getByLabel('Investment amount').fill('100000');
  await page.getByLabel('Expected annual return (%)').fill('10');
  await page.getByLabel('Years').fill('1');
  await expect(page.getByRole('region', { name: 'Result' })).toContainText('1,10,000');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('SIP & Compound Interest Calculator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/sip-calculator');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
