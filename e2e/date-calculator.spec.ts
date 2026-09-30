import { expect, test, type Page } from '@playwright/test';

test.use({ timezoneId: 'America/New_York' });

function watch(page: Page) {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    const u = r.url();
    if (!(u.startsWith(origin) || u.startsWith('blob:') || u.startsWith('data:')) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${u}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return { offOrigin, errors };
}

test('Date Calculator finds differences, adds durations and counts business days', async ({ page }) => {
  const { offOrigin, errors } = watch(page);
  await page.goto('/tools/date-calculator');
  await expect(page).toHaveTitle(/Date Calculator/);
  await expect(page.getByRole('combobox', { name: 'Time zone' })).toContainText('America/New York');

  await page.getByLabel('Start', { exact: true }).fill('2024-03-09T12:00');
  await page.getByLabel('End', { exact: true }).fill('2024-03-10T12:00');
  await expect(page.getByTestId('diff-result')).toHaveText('1 day');
  await expect(page.getByText(/A daylight-saving change falls in this range/)).toBeVisible();
  await expect(page.getByText('23', { exact: true })).toBeVisible(); // total hours

  await page.getByRole('group', { name: 'Calculation' }).getByRole('button', { name: 'Add / subtract' }).click();
  await page.getByLabel('Start', { exact: true }).fill('2024-01-31T09:00');
  await expect(page.getByTestId('add-result')).toContainText('2024-02-29 09:00:00');
  await expect(page.getByText(/February 2024 has no day 31/)).toBeVisible();

  await page.getByRole('group', { name: 'Calculation' }).getByRole('button', { name: 'Business days' }).click();
  await page.getByLabel('Start date', { exact: true }).fill('2024-01-01');
  await page.getByLabel('End date', { exact: true }).fill('2024-01-14');
  await expect(page.getByTestId('business-result')).toHaveText('10 business days');
  await page.getByLabel(/^Holidays/).fill('2024-01-01 New Year\nnope');
  await expect(page.getByTestId('business-result')).toHaveText('9 business days');
  await expect(page.getByText('Not a valid date, ignored: nope')).toBeVisible();
  await page.getByLabel(/^Working days after the start date/).fill('10');
  await expect(page.getByTestId('workday-result')).toHaveText('2024-01-15 (Monday)');
  await page.getByRole('group', { name: 'Weekend' }).getByRole('button', { name: 'Fri–Sat' }).click();
  await expect(page.getByTestId('business-result')).toHaveText('9 business days');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Date Calculator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/date-calculator');
  for (const mode of ['Difference', 'Add / subtract', 'Business days']) {
    await page.getByRole('group', { name: 'Calculation' }).getByRole('button', { name: mode }).click();
    const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
    expect(sw, mode).toBeLessThanOrEqual(vw);
  }
});
