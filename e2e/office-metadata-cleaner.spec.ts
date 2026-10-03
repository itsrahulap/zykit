import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { createZip } from '../src/shared/lib/zip';
import { openZip, readText } from '../src/tools/office-metadata-cleaner/features/zip-archive';

const enc = (s: string) => new TextEncoder().encode(s);

function makeDocx(): Buffer {
  const files: Record<string, string> = {
    '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="jpeg" ContentType="image/jpeg"/></Types>',
    '_rels/.rels':
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail" Target="docProps/thumbnail.jpeg"/></Relationships>',
    'docProps/core.xml':
      '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator>Jane Roe</dc:creator><cp:lastModifiedBy>John Doe</cp:lastModifiedBy></cp:coreProperties>',
    'docProps/app.xml': '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Office Word</Application><Company>ACME Corp</Company></Properties>',
    'docProps/thumbnail.jpeg': 'JPEGDATA',
    'word/document.xml': '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:ins w:id="1" w:author="Jane Roe"><w:r><w:t>Hello</w:t></w:r></w:ins></w:p></w:body></w:document>',
  };
  return Buffer.from(createZip(Object.entries(files).map(([name, text]) => ({ name, data: enc(text) }))));
}

async function download(page: Page, click: () => Promise<void>) {
  const [dl] = await Promise.all([page.waitForEvent('download'), click()]);
  return { name: dl.suggestedFilename(), bytes: readFileSync(await dl.path()) };
}

const MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

test('Office Metadata Cleaner shows, blanks and verifies metadata', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/office-metadata-cleaner');
  await expect(page).toHaveTitle(/Office Metadata Cleaner/);

  await page.getByTestId('file-input').setInputFiles([
    { name: 'plan.docx', mimeType: MIME, buffer: makeDocx() },
    { name: 'old.doc', mimeType: 'application/msword', buffer: Buffer.from('x') },
  ]);
  const files = page.getByRole('list', { name: 'Documents' });
  await expect(files.getByText('Jane Roe').first()).toBeVisible();
  await expect(files.getByText('ACME Corp')).toBeVisible();
  await expect(files.getByText('Thumbnail preview')).toBeVisible();
  await expect(files.getByText(/1 tracked change/)).toBeVisible();
  await expect(page.getByRole('alert').first()).toContainText('old.doc');

  await page.getByRole('button', { name: 'Clean 1 document' }).click();
  await expect(files.getByText('Verified clean')).toBeVisible();

  const out = await download(page, () => page.getByRole('button', { name: /Download plan-clean\.docx/ }).click());
  expect(out.name).toBe('plan-clean.docx');
  const zip = openZip(new Uint8Array(out.bytes));
  expect(zip.entries.map((e) => e.name)).not.toContain('docProps/thumbnail.jpeg');
  const core = (await readText(zip, 'docProps/core.xml'))!;
  expect(core).not.toMatch(/Jane Roe|John Doe/);
  expect(await readText(zip, 'docProps/app.xml')).not.toContain('ACME');
  expect(await readText(zip, 'word/document.xml')).toContain('<w:t>Hello</w:t>');
  expect(await readText(zip, '_rels/.rels')).not.toContain('thumbnail');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Office Metadata Cleaner has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/office-metadata-cleaner');
  await page.getByTestId('file-input').setInputFiles({ name: 'a-very-long-document-name-for-testing.docx', mimeType: MIME, buffer: makeDocx() });
  await expect(page.getByText('Jane Roe').first()).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
