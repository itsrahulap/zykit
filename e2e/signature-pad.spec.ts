import { expect, test } from '@playwright/test';
import { downloaded, expectNoSideScroll, watch } from './image-helpers';

test('Signature Pad draws, undoes, types and exports transparent files', async ({ page }) => {
  const w = watch(page);
  await page.goto('/tools/signature-pad');
  await expect(page).toHaveTitle(/Signature Pad/);
  await expect(page.getByRole('button', { name: 'PNG', exact: true })).toBeDisabled();

  const canvas = page.getByTestId('signature-canvas');
  const box = (await canvas.boundingBox())!;
  const stroke = async (dy: number) => {
    await page.mouse.move(box.x + 40, box.y + 60 + dy);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(box.x + 40 + i * 20, box.y + 60 + dy + Math.sin(i) * 25, { steps: 2 });
    await page.mouse.up();
  };
  await stroke(0);
  await stroke(40);
  await expect(page.locator('p[aria-live="polite"]')).toContainText('2 strokes');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('p[aria-live="polite"]')).toContainText('1 stroke ');

  const svgDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'SVG', exact: true }).click();
  const svg = Buffer.from(await downloaded(await svgDownload)).toString();
  expect(svg).toMatch(/<path d="M/);
  expect(svg).not.toContain('<rect');

  const pngDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNG', exact: true }).click();
  const png = await downloaded(await pngDownload);
  expect(Array.from(png.slice(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47]);
  expect(png[25]).toBe(6); // colour type RGBA, so the background can be transparent

  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(page.getByRole('button', { name: 'PNG', exact: true })).toBeDisabled();

  // typed mode works from the keyboard alone
  await page.getByRole('group', { name: 'Mode' }).getByRole('button', { name: 'Type' }).click();
  await page.getByLabel('Your name').fill('Ada Lovelace');
  await expect(page.getByTestId('typed-preview')).toHaveText('Ada Lovelace');
  await expect(page.locator('p[aria-live="polite"]')).toContainText('Typed signature');
  const typedSvg = page.waitForEvent('download');
  await page.getByRole('button', { name: 'SVG', exact: true }).click();
  expect(Buffer.from(await downloaded(await typedSvg)).toString()).toContain('>Ada Lovelace</text>');

  w.check();
});

test('Signature Pad has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/signature-pad');
  await expectNoSideScroll(page);
  await page.getByRole('group', { name: 'Mode' }).getByRole('button', { name: 'Type' }).click();
  await page.getByLabel('Your name').fill('A very long signature name to test overflow');
  await expectNoSideScroll(page);
});
