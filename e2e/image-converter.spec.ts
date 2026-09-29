import { expect, test } from '@playwright/test';
import { canvasImage, downloaded, expectNoSideScroll, readZip, watch } from './image-helpers';
import { sniffImageType } from '../src/shared/lib/image';

test('converts PNG to JPEG and WebP, flags files the browser cannot decode', async ({ page }) => {
  const w = watch(page);
  await page.goto('/tools/image-converter');
  await expect(page).toHaveTitle(/Image Converter/);
  await expect(page.getByText(/removes metadata such as EXIF and GPS/)).toBeVisible();

  const png = await canvasImage(page, 'image/png', 200, 100, true);
  await page.locator('input[type=file]').first().setInputFiles([
    { name: 'logo.png', mimeType: 'image/png', buffer: png },
    { name: 'broken.heic', mimeType: 'image/heic', buffer: Buffer.from('not really a heic file') },
  ]);
  const files = page.getByRole('list', { name: 'Files' });
  await expect(files.getByRole('alert')).toContainText("Your browser can't decode HEIC images");

  const [dl] = await Promise.all([page.waitForEvent('download'), files.getByRole('link', { name: /logo\.jpg/ }).click()]);
  const jpeg = await downloaded(dl);
  expect(sniffImageType(jpeg)?.mime).toBe('image/jpeg');

  await page.getByRole('button', { name: 'WebP', exact: true }).click();
  await expect(page.getByText(/converted to WebP/)).toBeVisible();
  const [dl2] = await Promise.all([page.waitForEvent('download'), files.getByRole('link', { name: /logo\.webp/ }).click()]);
  expect(sniffImageType(await downloaded(dl2))?.mime).toBe('image/webp');

  // A second good file makes the ZIP button appear.
  await page.getByRole('button', { name: 'PNG', exact: true }).click();
  await page.locator('input[type=file]').first().setInputFiles({ name: 'photo.jpg', mimeType: 'image/jpeg', buffer: await canvasImage(page, 'image/jpeg') });
  await expect(page.getByText(/2 of 3 converted to PNG/)).toBeVisible();
  const [zipDl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /download all \(zip\)/i }).click()]);
  expect(zipDl.suggestedFilename()).toBe('converted-png.zip');
  const entries = readZip(await downloaded(zipDl));
  expect(entries.map((e) => e.name)).toEqual(['logo.png', 'photo.png']);
  expect(entries.every((e) => sniffImageType(e.data)?.mime === 'image/png')).toBe(true);
  w.check();
});

test('Image Converter has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/image-converter');
  await expectNoSideScroll(page);
});

test('converts an SVG (decoded through an image element) to PNG', async ({ page }) => {
  const w = watch(page);
  await page.goto('/tools/image-converter');
  await page.getByRole('button', { name: 'PNG', exact: true }).click();
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32"><rect width="64" height="32" fill="#059669"/></svg>';
  await page.locator('input[type=file]').first().setInputFiles({ name: 'badge.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg) });
  const files = page.getByRole('list', { name: 'Files' });
  await expect(files.getByText('64 × 32 → 64 × 32 px')).toBeVisible();
  const [dl] = await Promise.all([page.waitForEvent('download'), files.getByRole('link', { name: /badge\.png/ }).click()]);
  expect(sniffImageType(await downloaded(dl))?.mime).toBe('image/png');
  w.check();
});
