import { expect, test } from '@playwright/test';
import { canvasImage, downloaded, expectNoSideScroll, readZip, watch } from './image-helpers';
import { readImageSize, sniffImageType } from '../src/shared/lib/image';

test('resizes by pixels with the aspect ratio locked, by percentage and to a preset box', async ({ page }) => {
  const w = watch(page);
  await page.goto('/tools/image-resizer');
  await expect(page).toHaveTitle(/Image Resizer/);
  await page.locator('input[type=file]').first().setInputFiles([
    { name: 'cat.jpg', mimeType: 'image/jpeg', buffer: await canvasImage(page, 'image/jpeg', 400, 300) },
    { name: 'dog.png', mimeType: 'image/png', buffer: await canvasImage(page, 'image/png', 200, 400) },
  ]);
  const files = page.getByRole('list', { name: 'Files' });

  await page.getByLabel('Width').fill('200');
  await expect(files.getByText('400 × 300 → 200 × 150 px')).toBeVisible();
  await expect(files.getByText('200 × 400 → 200 × 400 px')).toBeVisible();
  await expect(page.getByLabel('Height')).toHaveValue('150'); // follows the first image

  const [dl] = await Promise.all([page.waitForEvent('download'), files.getByRole('link', { name: /cat-200x150\.jpg/ }).click()]);
  const bytes = await downloaded(dl);
  expect(sniffImageType(bytes)?.mime).toBe('image/jpeg');
  expect(readImageSize(bytes)).toEqual({ width: 200, height: 150 });

  await page.getByRole('button', { name: 'Percentage' }).click();
  await expect(files.getByText('400 × 300 → 200 × 150 px')).toBeVisible(); // 50 %
  await expect(files.getByText('200 × 400 → 100 × 200 px')).toBeVisible();

  await page.getByRole('combobox', { name: 'Preset' }).click();
  await page.getByRole('option', { name: /Instagram square/ }).click();
  await expect(files.getByText('400 × 300 → 1,080 × 1,080 px')).toBeVisible();
  await page.getByRole('button', { name: 'Fit inside' }).click();
  await expect(files.getByText('200 × 400 → 540 × 1,080 px')).toBeVisible();
  await expect(page.getByText(/^Done\./)).toBeVisible();

  const [zipDl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /download all \(zip\)/i }).click()]);
  const entries = readZip(await downloaded(zipDl));
  expect(entries.map((e) => e.name)).toEqual(['cat-1080x810.jpg', 'dog-540x1080.png']);
  expect(readImageSize(entries[1].data)).toEqual({ width: 540, height: 1080 });
  w.check();
});

test('Image Resizer has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/image-resizer');
  await expectNoSideScroll(page);
  await page.locator('input[type=file]').first().setInputFiles({ name: 'x.png', mimeType: 'image/png', buffer: await canvasImage(page, 'image/png') });
  await expect(page.getByText(/^Done\./)).toBeVisible();
  await expectNoSideScroll(page);
});
