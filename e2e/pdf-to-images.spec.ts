import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PDFDocument, rgb } from 'pdf-lib';

async function twoPagePdf() {
  const doc = await PDFDocument.create();
  for (const color of [rgb(0.2, 0.5, 0.3), rgb(0.8, 0.3, 0.2)]) doc.addPage([300, 200]).drawRectangle({ x: 20, y: 20, width: 260, height: 160, color });
  return Buffer.from(await doc.save());
}

test('PDF to Images converts pages locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith(origin) && !u.startsWith('blob:') && !u.startsWith('data:')) offOrigin.push(`${r.method()} ${u}`);
    else if (r.method() !== 'GET') offOrigin.push(`${r.method()} ${u}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/pdf-to-images');
  await expect(page).toHaveTitle(/PDF to Images/);
  await page.locator('input[type=file]').setInputFiles({ name: 'deck.pdf', mimeType: 'application/pdf', buffer: await twoPagePdf() });
  await expect(page.getByText('deck.pdf: 2 pages')).toBeVisible();
  await page.getByRole('button', { name: 'Convert to PNG' }).click();
  await expect(page.getByRole('list', { name: 'Images' }).getByRole('listitem')).toHaveCount(2);

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download all \(2\)/ }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('deck-images.zip');
  const zip = await readFile((await file.path())!);
  expect(zip.includes(Buffer.from('deck-page-1.png'))).toBe(true);
  expect(zip.includes(Buffer.from('deck-page-2.png'))).toBe(true);

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('PDF to Images has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/pdf-to-images');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
