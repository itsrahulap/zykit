import { expect, test } from '@playwright/test';
import { canvasImage, downloaded, expectNoSideScroll, readZip, watch } from './image-helpers';
import { readIcoDirectory } from '../src/tools/favicon-generator/features/favicon';
import { readImageSize, sniffImageType } from '../src/shared/lib/image';

test('generates favicons from text and downloads a complete ZIP', async ({ page }) => {
  const w = watch(page);
  await page.goto('/tools/favicon-generator');
  await expect(page).toHaveTitle(/Favicon Generator/);
  await expect(page.getByText('7 files ready.')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Browser tab preview, light' })).toBeVisible();
  await page.getByLabel('Site name').fill('Acme');
  await page.getByLabel('Text', { exact: true }).fill('A');
  await expect(page.getByRole('region', { name: 'Manifest' })).toContainText('"name": "Acme"');
  await expect(page.getByRole('region', { name: 'HTML' })).toContainText('<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">');

  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /download all \(zip\)/i }).click()]);
  const entries = readZip(await downloaded(dl));
  expect(entries.map((e) => e.name)).toEqual([
    'favicon.ico',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'apple-touch-icon.png',
    'android-chrome-192x192.png',
    'android-chrome-512x512.png',
    'site.webmanifest',
    'favicon-tags.html',
  ]);
  const ico = entries[0].data;
  const dir = readIcoDirectory(ico);
  expect(dir.map((e) => e.width)).toEqual([16, 32, 48]);
  for (const e of dir) {
    const png = ico.subarray(e.offset, e.offset + e.size);
    expect(sniffImageType(png)?.mime).toBe('image/png');
    expect(readImageSize(png)).toEqual({ width: e.width, height: e.height });
  }
  expect(readImageSize(entries[3].data)).toEqual({ width: 180, height: 180 });
  expect(readImageSize(entries[5].data)).toEqual({ width: 512, height: 512 });
  expect(JSON.parse(new TextDecoder().decode(entries[6].data)).name).toBe('Acme');
  w.check();
});

test('generates favicons from an uploaded image', async ({ page }) => {
  const w = watch(page);
  await page.goto('/tools/favicon-generator');
  await page.getByRole('button', { name: 'Image', exact: true }).click();
  await expect(page.getByText('Choose an image to start.')).toBeVisible();
  await page.locator('input[type=file]').first().setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: await canvasImage(page, 'image/png', 600, 400) });
  await expect(page.getByText('logo.png')).toBeVisible();
  await expect(page.getByText('7 files ready.')).toBeVisible();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: 'Download favicon.ico' }).click()]);
  expect(readIcoDirectory(await downloaded(dl))).toHaveLength(3);
  w.check();
});

test('Favicon Generator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/favicon-generator');
  await expect(page.getByText('7 files ready.')).toBeVisible();
  await expectNoSideScroll(page);
});
