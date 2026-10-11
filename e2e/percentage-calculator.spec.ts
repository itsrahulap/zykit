import { expect, test } from '@playwright/test';

test('Percentage Calculator works locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/percentage-calculator');
  await expect(page).toHaveTitle(/Percentage Calculator/);

  const of = page.getByRole('region', { name: 'X% of Y' });
  await of.getByLabel('Percent X (%)').fill('25');
  await of.getByLabel('Value Y').fill('80');
  await expect(of.getByText('25% of 80 = 20')).toBeVisible();

  const disc = page.getByRole('region', { name: 'Discount' });
  await disc.getByLabel('Price').fill('1000');
  await expect(disc.getByText(/Final price 720, you save 280/)).toBeVisible();

  const gst = page.getByRole('region', { name: 'GST / VAT' });
  await gst.getByRole('button', { name: 'Including tax' }).click();
  await gst.getByLabel('Amount', { exact: true }).fill('1180');
  await gst.getByRole('button', { name: '18%' }).click();
  await gst.getByRole('button', { name: 'CGST + SGST' }).click();
  await expect(gst.getByText(/Net 1,000 \+ tax 180 = gross 1,180 \(CGST 90 \+ SGST 90\)/)).toBeVisible();

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Percentage Calculator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/percentage-calculator');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
