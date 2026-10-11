import { expect, test } from '@playwright/test';

test('Loan / EMI Calculator works locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/loan-calculator');
  await expect(page).toHaveTitle(/Loan \/ EMI Calculator/);
  await page.getByLabel('Loan amount').fill('1000000');
  await page.getByLabel('Annual interest rate (%)').fill('8.5');
  await page.getByLabel('Tenure (years)').fill('20');
  await expect(page.getByText('₹8,678.23').first()).toBeVisible();
  await expect(page.getByText('₹10,00,000').first()).toBeVisible();

  await page.getByLabel('Extra amount with every payment').fill('1000');
  await expect(page.getByText(/Interest saved by prepayments/)).toBeVisible();

  await page.getByLabel('Compare with a second loan').check();
  await expect(page.getByRole('region', { name: 'Loan B', exact: true })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Loan A against Loan B' })).toBeVisible();

  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download CSV' }).click()]);
  expect(dl.suggestedFilename()).toBe('loan-schedule.csv');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Loan / EMI Calculator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/loan-calculator');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
