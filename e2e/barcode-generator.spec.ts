import { expect, test } from '@playwright/test';
import { downloaded, expectNoSideScroll, watch } from './image-helpers';

test('Barcode Generator encodes, validates and downloads PNG and SVG', async ({ page }) => {
  const w = watch(page);
  await page.goto('/tools/barcode-generator');
  await expect(page).toHaveTitle(/Barcode Generator/);
  await expect(page.getByTestId('barcode-preview')).toBeVisible();
  await expect(page.locator('p[aria-live="polite"]')).toContainText('Code 128');

  const type = page.getByRole('group', { name: 'Barcode type' });
  await type.getByRole('button', { name: 'EAN-13' }).click();
  await expect(page.getByLabel('Text or number')).toHaveValue('590123412345');
  await expect(page.locator('p[aria-live="polite"]')).toContainText('5901234123457');
  await expect(page.getByTestId('barcode-preview').locator('text').first()).toHaveText('901234');

  await page.getByLabel('Text or number').fill('5901234123450');
  await expect(page.getByRole('alert')).toContainText('should be 7');
  await expect(page.getByRole('button', { name: 'PNG', exact: true })).toBeDisabled();

  await type.getByRole('button', { name: 'Code 39' }).click();
  await page.getByLabel('Add mod-43 check character').check();
  await page.getByLabel('Text or number').fill('CODE39');
  await expect(page.locator('p[aria-live="polite"]')).toContainText('CODE39W');

  await type.getByRole('button', { name: 'Code 128' }).click();
  await page.getByLabel('Text or number').fill('Hello 12345678');
  const svgDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'SVG', exact: true }).click();
  const svgFile = await svgDownload;
  expect(svgFile.suggestedFilename()).toBe('code128-Hello_12345678.svg');
  expect(Buffer.from(await downloaded(svgFile)).toString()).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);

  const pngDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNG', exact: true }).click();
  const png = await downloaded(await pngDownload);
  expect(Array.from(png.slice(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47]);

  w.check();
});

test('Barcode Generator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/barcode-generator');
  await page.getByLabel('Text or number').fill('A very long Code 128 text that makes a wide barcode 0123456789');
  await expectNoSideScroll(page);
});
