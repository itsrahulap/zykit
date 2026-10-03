import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

/** Draws a coloured rectangle in the page and returns it encoded (real browser encoders). */
async function makeImage(page: Page, type: string, w: number, h: number, color: string): Promise<Buffer> {
  const b64 = await page.evaluate(
    async ([t, w, h, c]) => {
      const canvas = document.createElement('canvas');
      canvas.width = w as number;
      canvas.height = h as number;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = c as string;
      ctx.fillRect(0, 0, w as number, h as number);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, t as string, 0.9));
      const buf = new Uint8Array(await blob!.arrayBuffer());
      let s = '';
      for (const x of buf) s += String.fromCharCode(x);
      return btoa(s);
    },
    [type, w, h, color],
  );
  return Buffer.from(b64, 'base64');
}

test('Images to PDF builds a PDF from JPEG, PNG and WebP', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    // blob: URLs are the in-page previews of the user's own files.
    if (!r.url().startsWith('blob:') && (!r.url().startsWith(origin) || r.method() !== 'GET')) offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/images-to-pdf');
  await expect(page).toHaveTitle(/Images to PDF/);

  await page.getByTestId('file-input').setInputFiles([
    { name: 'one.jpg', mimeType: 'image/jpeg', buffer: await makeImage(page, 'image/jpeg', 200, 100, '#d33') },
    { name: 'two.png', mimeType: 'image/png', buffer: await makeImage(page, 'image/png', 100, 200, '#3a3') },
    { name: 'three.webp', mimeType: 'image/webp', buffer: await makeImage(page, 'image/webp', 120, 120, '#33d') },
    { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image at all, just text') },
  ]);
  const pages = page.getByRole('list', { name: 'Page order' }).getByRole('listitem');
  await expect(pages).toHaveCount(3);
  await expect(page.getByRole('alert')).toContainText('notes.txt');

  // Reorder: move the first image later, rotate the second one.
  await page.getByRole('button', { name: 'Move one.jpg later' }).click();
  await expect(pages.first()).toContainText('two.png');
  await page.getByRole('button', { name: 'Rotate two.png right' }).click();

  await page.getByRole('button', { name: 'Letter', exact: true }).click();
  await page.getByLabel('File name').fill('my scans');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Create PDF' }).click()]);
  expect(dl.suggestedFilename()).toBe('my scans.pdf');
  const bytes = readFileSync(await dl.path());
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  expect(doc.getPageCount()).toBe(3);
  expect(doc.getPage(0).getSize()).toEqual({ width: 792, height: 612 }) // two.png, rotated to landscape;
  expect(doc.getProducer()).toBeUndefined();
  expect(doc.getCreator()).toBeUndefined();
  expect(bytes.toString('latin1')).not.toMatch(/pdf-lib/i);

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Images to PDF has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/images-to-pdf');
  await page.getByTestId('file-input').setInputFiles({ name: 'a-very-long-image-name-for-testing-layouts.png', mimeType: 'image/png', buffer: await makeImage(page, 'image/png', 50, 50, '#888') });
  await expect(page.getByRole('list', { name: 'Page order' }).getByRole('listitem')).toHaveCount(1);
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
