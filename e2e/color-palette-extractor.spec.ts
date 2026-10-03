import { expect, test } from '@playwright/test';
import { canvasImage, expectNoSideScroll, watch } from './image-helpers';

test('Color Palette Extractor finds colours, exports them and opens the converter', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const w = watch(page);
  await page.goto('/tools/color-palette-extractor');
  await expect(page).toHaveTitle(/Color Palette Extractor/);
  await page.locator('input[type=file]').first().setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: await canvasImage(page, 'image/png') });

  const palette = page.getByRole('list', { name: 'Palette', exact: true });
  await expect(palette.getByRole('listitem').first()).toBeVisible();
  expect(await palette.locator('> li').count()).toBe(6);
  await expect(page.getByText(/White text \d+\.\d\d:1/).first()).toBeVisible();

  await page.getByRole('slider', { name: 'Colours' }).fill('4');
  expect(await palette.locator('> li').count()).toBe(4);
  await page.getByRole('group', { name: 'Method' }).getByRole('button', { name: 'Median cut' }).click();
  expect(await palette.locator('> li').count()).toBe(4);

  const exportRegion = page.getByRole('region', { name: 'Export palette' });
  await expect(exportRegion).toContainText(':root {');
  await exportRegion.getByRole('button', { name: 'Tailwind theme' }).click();
  await expect(exportRegion).toContainText('@theme {');
  await exportRegion.getByRole('button', { name: 'Copy', exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('--color-palette-1');

  await palette.getByRole('button', { name: /^Copy HEX #/ }).first().click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^#[0-9a-f]{6}$/);

  await palette.getByRole('button', { name: /^Open #[0-9a-f]{6} in Color Converter$/ }).first().click();
  await expect(page).toHaveURL(/\/tools\/color-converter#s=/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  w.check();
});

test('Color Palette Extractor has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/color-palette-extractor');
  await expectNoSideScroll(page);
  await page.locator('input[type=file]').first().setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: await canvasImage(page, 'image/png') });
  await expect(page.getByRole('list', { name: 'Palette', exact: true })).toBeVisible();
  await expectNoSideScroll(page);
});
