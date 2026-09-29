import { expect, test } from '@playwright/test';

test('converts CSV to JSON and JSON to CSV', async ({ page }) => {
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/csv-json');
  await expect(page).toHaveTitle(/CSV ↔ JSON.* · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('Input CSV').fill('id;name;name\n1;"Ann; ""A""";x\n2;Bob;');
  const output = page.getByRole('region', { name: 'Output' });
  await page.getByRole('group', { name: 'JSON indent' }).getByRole('button', { name: 'Minified' }).click();
  await expect(output.locator('pre')).toHaveText('[{"id":1,"name":"Ann; \\"A\\"","name_2":"x"},{"id":2,"name":"Bob","name_2":""}]');
  await expect(page.getByText('JSON ready · 2 rows · 3 columns · semicolon-separated')).toBeVisible();

  await page.getByLabel('Empty cells as null').check();
  await page.getByRole('group', { name: 'Output' }).getByRole('button', { name: 'Arrays' }).click();
  await expect(output.locator('pre')).toHaveText('[["id","name","name_2"],[1,"Ann; \\"A\\"","x"],[2,"Bob",null]]');

  await page.getByRole('group', { name: 'Direction' }).getByRole('button', { name: 'JSON → CSV' }).click();
  await page.getByLabel('Input JSON').fill('[{"a":1,"n":{"b":"x,y"}},{"c":true}]');
  await expect(output.locator('pre')).toHaveText('a,n.b,c\n1,"x,y",\n,,true');
  await page.getByLabel('Flatten nested objects (a.b)').uncheck();
  await expect(output.locator('pre')).toHaveText('a,n,c\n1,"{""b"":""x,y""}",\n,,true');

  const downloadPromise = page.waitForEvent('download');
  await output.getByRole('button', { name: 'Download .csv' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('converted.csv');

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('opens a file and reports JSON errors', async ({ page }) => {
  await page.goto('/tools/csv-json');
  await page.getByTestId('file-input').setInputFiles({ name: 'people.tsv', mimeType: 'text/tab-separated-values', buffer: Buffer.from('﻿name\tage\r\nAnn\t30\r\n') });
  await expect(page.getByRole('region', { name: 'Output' }).locator('pre')).toHaveText('[\n  {\n    "name": "Ann",\n    "age": 30\n  }\n]');
  await expect(page.getByText('people.tsv')).toBeVisible();

  await page.getByRole('group', { name: 'Direction' }).getByRole('button', { name: 'JSON → CSV' }).click();
  await page.getByLabel('Input JSON').fill('[{"a":1},\n]');
  await expect(page.getByText('Line 2, column 1', { exact: true })).toBeVisible();
  await page.getByLabel('Input JSON').fill('42');
  await expect(page.getByText(/Expected a JSON array/).first()).toBeVisible();
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/csv-json');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Output' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
