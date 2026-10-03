import { expect, test } from '@playwright/test';
import { canvasImage, downloaded, expectNoSideScroll, watch } from './image-helpers';
import { readImageSize, sniffImageType } from '../src/shared/lib/image';

const open = async (page: import('@playwright/test').Page, w = 240, h = 120) =>
  page.locator('input[type=file]').first().setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: await canvasImage(page, 'image/png', w, h) });

test('Image Editor crops, rotates, adjusts, undoes and exports', async ({ page }) => {
  const w = watch(page);
  await page.goto('/tools/image-editor');
  await expect(page).toHaveTitle(/Image Editor/);
  await open(page);
  await expect(page.getByText('240 × 120 → 240 × 120')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Edited image preview' })).toBeVisible();

  // Crop with numbers, then keep a 1:1 shape.
  await page.getByLabel('Width', { exact: true }).fill('100');
  await expect(page.getByText('→ 100 × 120 px')).toBeVisible();
  await page.getByRole('group', { name: 'Aspect ratio' }).getByRole('button', { name: '1:1' }).click();
  await expect(page.getByText(/→ (\d+) × \1 px/)).toBeVisible();

  // Keyboard nudging of the crop box.
  const box = page.getByRole('group', { name: /^Crop area/ });
  await box.focus();
  const before = await box.getAttribute('aria-label');
  await box.press('Shift+ArrowRight');
  expect(await box.getAttribute('aria-label')).not.toBe(before);

  // Rotate a quarter turn: the 100-pixel square stays square, the whole-image size would swap.
  await page.getByRole('group', { name: 'Editing tool' }).getByRole('button', { name: 'Rotate & resize' }).click();
  await page.getByRole('button', { name: 'Rotate right' }).click();
  await expect(page.getByText(/→ (\d+) × \1 px/)).toBeVisible();

  // Adjust, undo, redo.
  await page.getByRole('group', { name: 'Editing tool' }).getByRole('button', { name: 'Adjust' }).click();
  const brightness = page.getByRole('slider', { name: 'Brightness' });
  await brightness.fill('60');
  await expect(brightness).toHaveValue('60');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(brightness).toHaveValue('0');
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(brightness).toHaveValue('60');

  const toggle = page.getByRole('button', { name: /Show original|Showing original/ });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('img', { name: 'Original image' })).toBeVisible();
  await toggle.click();

  // Export as PNG, then as JPEG.
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: /^Download \d+ × \d+ PNG/ }).click();
  const d1 = await dl;
  expect(d1.suggestedFilename()).toBe('photo-edited.png');
  const bytes = await downloaded(d1);
  expect(sniffImageType(bytes)?.mime).toBe('image/png');
  const size = readImageSize(bytes)!;
  expect(size.width).toBe(size.height);

  await page.getByRole('combobox', { name: 'Format' }).click();
  await page.getByRole('option', { name: 'JPEG' }).click();
  const dl2 = page.waitForEvent('download');
  await page.getByRole('button', { name: /^Download .* JPEG/ }).click();
  const d2 = await dl2;
  expect(d2.suggestedFilename()).toBe('photo-edited.jpg');
  expect(sniffImageType(await downloaded(d2))?.mime).toBe('image/jpeg');
  await expect(page.getByText(/removes metadata|metadata/i).first()).toBeVisible();
  w.check();
});

test('Image Editor resizes with the aspect ratio locked', async ({ page }) => {
  const w = watch(page);
  await page.goto('/tools/image-editor');
  await open(page);
  await page.getByRole('group', { name: 'Editing tool' }).getByRole('button', { name: 'Rotate & resize' }).click();
  await page.getByLabel('Width', { exact: true }).fill('120');
  await expect(page.getByLabel('Height', { exact: true })).toHaveValue('60');
  await expect(page.getByText('→ 120 × 60 px')).toBeVisible();
  w.check();
});

test('Image Editor has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/image-editor');
  await expectNoSideScroll(page);
  await open(page, 640, 480);
  await expect(page.getByRole('img', { name: 'Edited image preview' })).toBeVisible();
  await expectNoSideScroll(page);
  for (const tab of ['Rotate & resize', 'Adjust', 'Effects']) {
    await page.getByRole('group', { name: 'Editing tool' }).getByRole('button', { name: tab }).click();
    await expectNoSideScroll(page);
  }
});
