import { expect, test } from '@playwright/test';
import { canvasImage, downloaded, expectNoSideScroll, watch } from './image-helpers';
import { readImageSize, sniffImageType } from '../src/shared/lib/image';

test('designs an image, previews cards, exports PNG and JPEG and writes meta tags', async ({ page }) => {
  const w = watch(page);
  await page.goto('/tools/og-image-generator');
  await expect(page).toHaveTitle(/Open Graph Image Generator/);
  await expect(page.getByRole('img', { name: 'Preview of the 1200 by 630 image' })).toBeVisible();
  await expect(page.getByText('Facebook', { exact: true })).toBeVisible();

  await page.getByLabel('Title', { exact: true }).fill('A very long title '.repeat(12));
  await page.getByLabel('Emoji').fill('🚀');
  await page.getByRole('button', { name: 'Midnight' }).click();
  await page.getByRole('button', { name: 'Centre' }).click();
  await page.getByRole('button', { name: 'Gradient' }).click();
  await page.getByRole('button', { name: 'Serif' }).click();

  await page.getByLabel('Image URL (where you will host it)').fill('https://cdn.example.com/og.png');
  const meta = page.locator('pre').filter({ hasText: 'og:title' });
  await expect(meta).toContainText('<meta property="og:image" content="https://cdn.example.com/og.png">');
  await expect(meta).toContainText('<meta property="og:image:width" content="1200">');
  await expect(meta).toContainText('<meta name="twitter:card" content="summary_large_image">');

  const [png] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PNG' }).click()]);
  expect(png.suggestedFilename()).toBe('og-image-1200x630.png');
  const pngBytes = await downloaded(png);
  expect(sniffImageType(pngBytes)?.mime).toBe('image/png');
  expect(readImageSize(pngBytes)).toEqual({ width: 1200, height: 630 });

  const [jpg] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download JPEG' }).click()]);
  expect(jpg.suggestedFilename()).toBe('og-image-1200x630.jpg');
  expect(sniffImageType(await downloaded(jpg))?.mime).toBe('image/jpeg');

  await page.getByRole('button', { name: '1080×1080' }).click();
  await expect(page.getByRole('img', { name: 'Preview of the 1080 by 1080 image' })).toBeVisible();
  await expect(meta).toContainText('<meta name="twitter:card" content="summary">');
  const [sq] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PNG' }).click()]);
  expect(readImageSize(await downloaded(sq))).toEqual({ width: 1080, height: 1080 });
  w.check();
});

test('takes a local logo without uploading it', async ({ page }) => {
  const w = watch(page);
  await page.goto('/tools/og-image-generator');
  const buffer = await canvasImage(page, 'image/png', 200, 80);
  await page.locator('input[type=file]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer });
  await expect(page.getByRole('button', { name: /Remove “logo.png”/ })).toBeVisible();
  await page.getByRole('button', { name: /Remove/ }).click();
  await expect(page.getByRole('button', { name: /Upload logo or image/ })).toBeVisible();
  w.check();
});

test('has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/og-image-generator');
  await expect(page.getByRole('img', { name: /Preview of the/ })).toBeVisible();
  await expectNoSideScroll(page);
});
