import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createZip } from '../src/shared/lib/zip';

const NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
const enc = (s: string) => new TextEncoder().encode(s);
const workbook = createZip([
  { name: 'xl/workbook.xml', data: enc(`<workbook ${NS} xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="People" sheetId="1" r:id="rId1"/></sheets></workbook>`) },
  { name: 'xl/_rels/workbook.xml.rels', data: enc('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>') },
  {
    name: 'xl/worksheets/sheet1.xml',
    data: enc(`<worksheet ${NS}><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Name</t></is></c><c r="B1" t="inlineStr"><is><t>Age</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>Ada, L</t></is></c><c r="B2"><v>36</v></c></row></sheetData></worksheet>`),
  },
]);

test('Excel to CSV converts a workbook locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/excel-to-csv');
  await expect(page).toHaveTitle(/Excel to CSV/);
  await page.locator('input[type=file]').setInputFiles({ name: 'people.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from(workbook) });
  await expect(page.getByRole('region', { name: 'Preview of People' })).toContainText('Ada, L');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download People' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('people-People.csv');
  expect(await readFile((await file.path())!, 'utf8')).toBe('Name,Age\r\n"Ada, L",36');

  expect(offOrigin.filter((u) => !u.includes('blob:'))).toEqual([]);
  expect(errors).toEqual([]);
});

test('Excel to CSV has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/excel-to-csv');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
