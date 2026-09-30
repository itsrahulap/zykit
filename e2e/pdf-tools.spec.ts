import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

async function makePdf(pages: [number, number][], title: string): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (const size of pages) doc.addPage(size);
  doc.setTitle(title);
  doc.setAuthor('Test Author');
  return Buffer.from(await doc.save());
}

async function download(page: Page, click: () => Promise<void>) {
  const [dl] = await Promise.all([page.waitForEvent('download'), click()]);
  return { name: dl.suggestedFilename(), bytes: readFileSync(await dl.path()) };
}

test('PDF Merge & Split merges, splits to ZIP and rotates', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/pdf-tools');
  await expect(page).toHaveTitle(/PDF Merge & Split/);

  const a = await makePdf([
    [595, 842],
    [595, 842],
  ], 'Alpha');
  const b = await makePdf([
    [612, 792],
    [612, 792],
    [792, 612],
  ], 'Beta');
  await page.getByTestId('file-input').setInputFiles([
    { name: 'alpha.pdf', mimeType: 'application/pdf', buffer: a },
    { name: 'beta.pdf', mimeType: 'application/pdf', buffer: b },
    { name: 'broken.pdf', mimeType: 'application/pdf', buffer: Buffer.from('not really a pdf') },
  ]);
  const files = page.getByRole('list', { name: 'PDF files' });
  await expect(files).toContainText('2 pages');
  await expect(files).toContainText('3 pages');
  await expect(files).toContainText('Unreadable');
  await page.getByRole('button', { name: 'Remove broken.pdf' }).click();

  // Reorder by keyboard buttons: beta first.
  await page.getByRole('button', { name: 'Move beta.pdf up' }).click();
  await expect(files.locator('li').first()).toContainText('beta.pdf');

  const merged = await download(page, () => page.getByRole('button', { name: 'Merge into one PDF' }).click());
  expect(merged.name).toBe('beta-merged.pdf');
  const mergedDoc = await PDFDocument.load(merged.bytes);
  expect(mergedDoc.getPageCount()).toBe(5);
  expect(mergedDoc.getPage(0).getWidth()).toBe(612);
  expect(mergedDoc.getTitle()).toBe('Beta');

  // Split beta into single pages → ZIP.
  await page.getByRole('button', { name: 'Split', exact: true }).click();
  const zip = await download(page, () => page.getByRole('button', { name: 'Split to ZIP' }).click());
  expect(zip.name).toBe('beta-split.zip');
  expect(zip.bytes.subarray(0, 2).toString()).toBe('PK');
  const zipText = zip.bytes.toString('latin1');
  for (const n of [1, 2, 3]) expect(zipText).toContain(`beta-page-${n}.pdf`);

  // Custom ranges with validation.
  await page.getByRole('button', { name: 'Page ranges' }).click();
  const rangeInput = page.getByLabel('Ranges (one file each)');
  await rangeInput.fill('4');
  await expect(page.getByText("Page 4 doesn't exist")).toBeVisible();
  await rangeInput.fill('2-');
  const range = await download(page, () => page.getByRole('button', { name: 'Split', exact: true }).last().click());
  expect(range.name).toBe('beta-pages-2-3.pdf');
  expect((await PDFDocument.load(range.bytes)).getPageCount()).toBe(2);

  // Rotate page 1 of alpha, delete page 2, and save with metadata removed.
  await page.getByRole('button', { name: 'Pages', exact: true }).click();
  await page.getByRole('combobox', { name: 'File' }).click();
  await page.getByRole('option', { name: 'alpha.pdf' }).click();
  const grid = page.getByRole('list', { name: 'Pages of alpha.pdf' });
  await grid.getByRole('button', { name: /^Page 1,/ }).click();
  await page.getByRole('button', { name: 'Rotate right' }).click();
  await expect(grid.getByRole('button', { name: /^Page 1,.*rotated 90°/ })).toBeVisible();
  await page.getByRole('checkbox', { name: /Remove metadata/ }).check();
  const edited = await download(page, () => page.getByRole('button', { name: 'Save edited PDF' }).click());
  expect(edited.name).toBe('alpha-edited.pdf');
  const editedDoc = await PDFDocument.load(edited.bytes, { updateMetadata: false });
  expect(editedDoc.getPages().map((p) => p.getRotation().angle)).toEqual([90, 0]);
  expect(editedDoc.getTitle()).toBeUndefined();
  expect(editedDoc.getAuthor()).toBeUndefined();

  const extracted = await download(page, () => page.getByRole('button', { name: 'Extract 1 page' }).click());
  expect(extracted.name).toBe('alpha-pages-1.pdf');
  expect((await PDFDocument.load(extracted.bytes)).getPageCount()).toBe(1);

  await page.getByRole('button', { name: 'Delete selected' }).click();
  await expect(grid.locator('li')).toHaveCount(1);

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('PDF Merge & Split has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/pdf-tools');
  await page.getByTestId('file-input').setInputFiles([{ name: 'a-rather-long-file-name-for-a-small-phone.pdf', mimeType: 'application/pdf', buffer: await makePdf([[595, 842]], 'x') }]);
  await expect(page.getByRole('list', { name: 'PDF files' })).toContainText('1 page');
  await page.getByRole('button', { name: 'Pages', exact: true }).click();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
