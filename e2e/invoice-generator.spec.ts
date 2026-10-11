import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

test('Invoice Generator builds a PDF and keeps the draft', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    const local = r.url().startsWith(origin) || r.url().startsWith('blob:') || r.url().startsWith('data:');
    if (!local || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/invoice-generator');
  await expect(page).toHaveTitle(/Invoice Generator/);
  await page.evaluate(() => localStorage.removeItem('zykit-invoice'));
  await page.reload();

  const seller = page.getByRole('region', { name: 'From (your business)' });
  await seller.getByLabel('Name').fill('Acme Ltd');
  await page.getByRole('region', { name: 'Bill to (client)' }).getByLabel('Name').fill('Globex GmbH');
  await page.getByLabel('Invoice number').fill('INV/2025 7');
  await page.getByLabel('Description 1').fill('Consulting');
  await page.getByLabel('Quantity 1').fill('2');
  await page.getByLabel('Unit price 1').fill('19.99');
  await page.getByLabel('Tax % 1').fill('20');
  await page.getByRole('button', { name: 'Add line' }).click();
  await page.getByLabel('Unit price 2').fill('0.10');
  await page.getByLabel('Discount % 2').fill('50');

  // 2 x 19.99 = 39.98 (+20% = 8.00 rounded) ; 0.10 - 50% = 0.05 ; total 48.03
  await expect(page.getByTestId('grand-total')).toHaveText('$48.03');
  await expect(page.getByRole('region', { name: 'Totals' })).toContainText('Tax 20%');

  await page.getByLabel('Unit price 2').fill('1.234');
  await expect(page.getByRole('alert')).toContainText('at most 2 decimals');
  await page.getByLabel('Unit price 2').fill('0.10');

  await page.getByLabel('Notes', { exact: true }).fill('Thanks Ω');
  await expect(page.getByText(/can't draw "Ω"/)).toBeVisible();

  // The draft survives a reload.
  await page.waitForTimeout(600);
  await page.reload();
  await expect(page.getByLabel('Invoice number')).toHaveValue('INV/2025 7');
  await expect(page.getByTestId('grand-total')).toHaveText('$48.03');

  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PDF' }).click()]);
  expect(dl.suggestedFilename()).toBe('INV-2025-7.pdf');
  const bytes = readFileSync(await dl.path());
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);

  const [json] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export JSON' }).click()]);
  expect(json.suggestedFilename()).toBe('invoice-draft.json');
  expect(JSON.parse(readFileSync(await json.path(), 'utf8')).seller.name).toBe('Acme Ltd');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Invoice Generator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/invoice-generator');
  await page.getByLabel('Description 1').fill('A very long description '.repeat(10));
  await page.getByLabel('Unit price 1').fill('100');
  await expect(page.getByRole('region', { name: 'Print preview' })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
