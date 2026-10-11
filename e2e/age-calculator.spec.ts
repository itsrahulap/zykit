import { expect, test } from '@playwright/test';

test('Age Calculator works locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/age-calculator');
  await expect(page).toHaveTitle(/Age Calculator/);
  await page.getByLabel('Age at').fill('2026-10-10');
  await page.getByLabel('Date of birth').fill('1990-05-15');
  await expect(page.getByText('36 years, 4 months, 25 days')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Next birthday' })).toContainText('2027-05-15');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Age Calculator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/age-calculator');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
