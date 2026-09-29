import { expect, test } from '@playwright/test';
import { canvasImage, downloaded, expectNoSideScroll, watch } from './image-helpers';

test('encodes an image to Base64 and decodes it back', async ({ page }) => {
  const w = watch(page);
  await page.goto('/tools/image-base64');
  await expect(page).toHaveTitle(/Image to Base64/);
  const png = await canvasImage(page, 'image/png', 32, 32);
  await page.locator('input[type=file]').first().setInputFiles({ name: 'icon.png', mimeType: 'image/png', buffer: png });

  const output = page.getByRole('region', { name: 'Output' });
  const dataUri = `data:image/png;base64,${png.toString('base64')}`;
  await expect(output.locator('pre')).toHaveText(dataUri);
  await expect(page.getByRole('img', { name: 'Preview of icon.png' })).toBeVisible();
  await expect(page.getByText(/^\+3\d\.\d%$/)).toBeVisible();
  await page.getByRole('button', { name: 'CSS' }).click();
  await expect(output.locator('pre')).toHaveText(`background-image: url("${dataUri}");`);
  await page.getByRole('button', { name: 'HTML' }).click();
  await expect(output.locator('pre')).toHaveText(`<img src="${dataUri}" alt="icon">`);

  await page.getByRole('tab', { name: 'Base64 → Image' }).click();
  const input = page.getByLabel('Base64 or data URI');
  await input.fill('not*base64');
  await expect(page.getByRole('alert')).toContainText('Invalid Base64 character "*"');

  await input.fill(`<img src="data:image/jpeg;base64,${png.toString('base64')}">`);
  await expect(page.getByRole('img', { name: 'Decoded image preview' })).toBeVisible();
  await expect(page.getByText('says image/jpeg, but the bytes are PNG')).toBeVisible();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /download image\.png/i }).click()]);
  expect(Buffer.from(await downloaded(dl)).equals(png)).toBe(true);
  w.check();
});

test('Image to Base64 has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/image-base64');
  await page.locator('input[type=file]').first().setInputFiles({ name: 'i.png', mimeType: 'image/png', buffer: await canvasImage(page, 'image/png') });
  await expect(page.getByRole('region', { name: 'Output' })).toBeVisible();
  await expectNoSideScroll(page);
});
