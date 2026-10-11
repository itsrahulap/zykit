import { expect, test } from '@playwright/test';

test('Aspect Ratio Calculator works locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/aspect-ratio-calculator');
  await expect(page).toHaveTitle(/Aspect Ratio Calculator/);
  await page.getByLabel('Width').fill('1920');
  await page.getByLabel('Height').fill('1080');
  await expect(page.getByTestId('ratio')).toHaveText('16:9');
  await expect(page.getByText('aspect-ratio: 16 / 9;')).toBeVisible();
  await expect(page.getByTestId('scaled')).toHaveText('960 × 540');

  await page.getByRole('button', { name: '4:3', exact: true }).click();
  await expect(page.getByLabel('Height')).toHaveValue('1440');
  await page.getByLabel('Width').fill('800');
  await expect(page.getByLabel('Height')).toHaveValue('600');
  await expect(page.getByTestId('ratio')).toHaveText('4:3');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Aspect Ratio Calculator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/aspect-ratio-calculator');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
