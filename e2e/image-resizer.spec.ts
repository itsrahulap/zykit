import { expect, test } from '@playwright/test';

test('Image Resizer works locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/image-resizer');
  await expect(page).toHaveTitle(/Image Resizer/);
  await page.getByLabel('Input').fill('abc');
  await expect(page.getByText('abc').last()).toBeVisible();

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Image Resizer has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/image-resizer');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
