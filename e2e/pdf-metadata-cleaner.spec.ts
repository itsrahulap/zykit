import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { PDFDocument, PDFName } from 'pdf-lib';

async function makePdf(author: string, opts: { encrypted?: boolean } = {}): Promise<Buffer> {
  const doc = await PDFDocument.create({ updateMetadata: false });
  doc.addPage([300, 400]);
  doc.setTitle('Quarterly Report');
  doc.setAuthor(author);
  doc.setCreator('Microsoft Word');
  doc.setProducer('Acme Print 3.1');
  doc.setCreationDate(new Date('2024-01-31T12:00:00Z'));
  const xmp = `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmp:CreatorTool="ChatGPT Plugin"/></rdf:RDF></x:xmpmeta>`;
  doc.catalog.set(PDFName.of('Metadata'), doc.context.register(doc.context.stream(xmp, { Type: 'Metadata', Subtype: 'XML' })));
  if (opts.encrypted) doc.context.trailerInfo.Encrypt = doc.context.register(doc.context.obj({ Filter: 'Standard', V: 1, R: 2 }));
  return Buffer.from(await doc.save());
}

async function download(page: Page, click: () => Promise<void>) {
  const [dl] = await Promise.all([page.waitForEvent('download'), click()]);
  return { name: dl.suggestedFilename(), bytes: readFileSync(await dl.path()) };
}

test('PDF Metadata Cleaner shows, removes and verifies metadata', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/pdf-metadata-cleaner');
  await expect(page).toHaveTitle(/PDF Metadata Cleaner/);

  await page.getByTestId('file-input').setInputFiles([
    { name: 'report.pdf', mimeType: 'application/pdf', buffer: await makePdf('Jane Roe') },
    { name: 'locked.pdf', mimeType: 'application/pdf', buffer: await makePdf('Locked', { encrypted: true }) },
  ]);
  const files = page.getByRole('list', { name: 'PDF files' });
  await expect(files.getByText('Jane Roe').first()).toBeVisible();
  await expect(files.getByText('Microsoft Word').first()).toBeVisible();
  await expect(files.getByText('Names an AI tool: ChatGPT Plugin')).toBeVisible();
  await expect(files).toContainText('Encrypted PDF');
  await page.getByRole('button', { name: 'Remove locked.pdf' }).click();

  await page.getByRole('button', { name: 'Clean 1 PDF' }).click();
  await expect(files.getByText('Verified clean')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Metadata before and after cleaning' })).toBeVisible();

  const out = await download(page, () => page.getByRole('button', { name: /Download report-clean\.pdf/ }).click());
  expect(out.name).toBe('report-clean.pdf');
  const clean = await PDFDocument.load(out.bytes, { updateMetadata: false });
  expect(clean.getPageCount()).toBe(1);
  expect(clean.getAuthor()).toBeUndefined();
  expect(clean.getProducer()).toBeUndefined();
  expect(clean.catalog.has(PDFName.of('Metadata'))).toBe(false);
  expect(out.bytes.toString('latin1')).not.toContain('Jane Roe');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('PDF Metadata Cleaner batches into a ZIP', async ({ page }) => {
  await page.goto('/tools/pdf-metadata-cleaner');
  await page.getByTestId('file-input').setInputFiles([
    { name: 'a.pdf', mimeType: 'application/pdf', buffer: await makePdf('A') },
    { name: 'b.pdf', mimeType: 'application/pdf', buffer: await makePdf('B') },
  ]);
  await page.getByRole('button', { name: 'Clean 2 PDFs' }).click();
  const zip = await download(page, () => page.getByRole('button', { name: 'Download all as ZIP' }).click());
  expect(zip.name).toBe('cleaned-pdfs.zip');
  expect(zip.bytes.toString('latin1')).toContain('a-clean.pdf');
  expect(zip.bytes.toString('latin1')).toContain('b-clean.pdf');
});

test('PDF Metadata Cleaner has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/pdf-metadata-cleaner');
  await page.getByTestId('file-input').setInputFiles({ name: 'a-very-long-document-name-for-testing.pdf', mimeType: 'application/pdf', buffer: await makePdf('Jane Roe') });
  await expect(page.getByText('Jane Roe').first()).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
