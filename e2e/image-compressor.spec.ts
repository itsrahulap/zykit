import { expect, test } from '@playwright/test';
import { canvasImage, downloaded, expectNoSideScroll, readZip, watch } from './image-helpers';
import { readImageSize, sniffImageType } from '../src/shared/lib/image';

test('compresses a batch, compares, and downloads one file and a ZIP', async ({ page }) => {
  const w = watch(page);
  await page.goto('/tools/image-compressor');
  await expect(page).toHaveTitle(/Image Compressor/);
  await expect(page.getByRole('heading', { name: /make your images lighter/i })).toBeVisible();
  await expect(page.getByText(/removes metadata such as EXIF and GPS/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Clean Image' })).toHaveAttribute('href', '/tools/clean-image');

  const png = await canvasImage(page, 'image/png', 400, 200);
  const jpeg = await canvasImage(page, 'image/jpeg', 300, 300);
  await page.locator('input[type=file]').first().setInputFiles([
    { name: 'banner.png', mimeType: 'image/png', buffer: png },
    { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: jpeg },
  ]);
  const files = page.getByRole('list', { name: 'Files' });
  await expect(files.getByRole('listitem')).toHaveCount(2);
  await expect(page.getByText(/^Done\./)).toBeVisible();
  await expect(files.getByText('400 × 200 → 400 × 200 px')).toBeVisible();

  // Before/after comparison of the first file, both modes.
  await expect(page.getByRole('img', { name: /^Original banner\.png/ })).toBeVisible();
  await page.getByRole('button', { name: 'Side by side' }).click();
  await expect(page.getByRole('img', { name: /^Compressed banner-compressed\.webp/ })).toBeVisible();

  // PNG is converted to WebP by "Auto".
  const [single] = await Promise.all([page.waitForEvent('download'), files.getByRole('link', { name: /banner-compressed\.webp/ }).click()]);
  expect(single.suggestedFilename()).toBe('banner-compressed.webp');
  expect(sniffImageType(await downloaded(single))?.mime).toBe('image/webp');

  // Max width re-encodes everything.
  await page.getByLabel('Max width').fill('100');
  await expect(files.getByText('400 × 200 → 100 × 50 px')).toBeVisible();
  await expect(files.getByText('300 × 300 → 100 × 100 px')).toBeVisible();
  await expect(page.getByText(/^Done\./)).toBeVisible();

  const [zipDl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /download all \(zip\)/i }).click()]);
  expect(zipDl.suggestedFilename()).toBe('compressed-images.zip');
  const entries = readZip(await downloaded(zipDl));
  expect(entries.map((e) => e.name)).toEqual(['banner-compressed.webp', 'photo-compressed.jpg']);
  expect(readImageSize(entries[1].data)).toEqual({ width: 100, height: 100 });

  await page.getByRole('button', { name: 'Remove photo.jpg' }).click();
  await expect(files.getByRole('listitem')).toHaveCount(1);
  w.check();
});

test('pasting an image adds it', async ({ page }) => {
  const w = watch(page);
  await page.goto('/tools/image-compressor');
  const png = await canvasImage(page, 'image/png');
  await page.evaluate((bytes) => {
    const dt = new DataTransfer();
    dt.items.add(new File([new Uint8Array(bytes)], 'pasted.png', { type: 'image/png' }));
    window.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt }));
  }, Array.from(png));
  await expect(page.getByText('pasted.png')).toBeVisible();
  await expect(page.getByText(/^Done\./)).toBeVisible();
  w.check();
});

test('Image Compressor has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/image-compressor');
  await expectNoSideScroll(page);
  await page.locator('input[type=file]').first().setInputFiles({ name: 'a-very-long-file-name-that-should-truncate-nicely.png', mimeType: 'image/png', buffer: await canvasImage(page, 'image/png') });
  await expect(page.getByText(/^Done\./)).toBeVisible();
  await expectNoSideScroll(page);
});
