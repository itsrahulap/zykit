import { expect, test } from '@playwright/test';

test('converts XML to JSON and back', async ({ page }) => {
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/xml-json');
  await expect(page).toHaveTitle(/XML ↔ JSON.* · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('Input XML').fill('<r a="1"><i>x &amp; y</i><i>2</i><!-- c --></r>');
  const output = page.getByRole('region', { name: 'Output' });
  await page.getByRole('group', { name: 'JSON indent' }).getByRole('button', { name: 'Minified' }).click();
  await expect(output.locator('pre')).toHaveText('{"r":{"@a":"1","i":["x & y","2"]}}');

  await page.getByLabel('Numbers and booleans').check();
  await page.getByLabel('Keep comments').check();
  await expect(output.locator('pre')).toHaveText('{"r":{"@a":1,"#comment":" c ","i":["x & y",2]}}');

  await page.getByRole('button', { name: 'Swap' }).click();
  await page.getByRole('group', { name: 'XML indent' }).getByRole('button', { name: 'Compact' }).click();
  await expect(output.locator('pre')).toHaveText('<?xml version="1.0" encoding="UTF-8"?><r a="1"><!-- c --><i>x &amp; y</i><i>2</i></r>');

  const downloadPromise = page.waitForEvent('download');
  await output.getByRole('button', { name: 'Download .xml' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('converted.xml');

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('reports errors with line and column and refuses entity expansion', async ({ page }) => {
  await page.goto('/tools/xml-json');
  await page.getByLabel('Input XML').fill('<a>\n  <b></c>\n</a>');
  await expect(page.getByText('Invalid XML: Expected </b> but found </c>. (line 2, column 6)')).toBeVisible();
  await page.getByRole('button', { name: 'Jump to error in input' }).click();
  await expect(page.getByLabel('Input XML')).toBeFocused();

  await page.getByLabel('Input XML').fill('<!DOCTYPE x [<!ENTITY a "aaaa">]>\n<x>&a;</x>');
  await expect(page.getByText(/Unknown entity &a;/).first()).toBeVisible();

  await page.getByLabel('Input XML').fill('<!DOCTYPE x [<!ENTITY a "aaaa">]>\n<x>ok</x>');
  await expect(page.getByText(/never expanded/).first()).toBeVisible();
  await expect(page.getByRole('region', { name: 'Output' }).locator('pre')).toContainText('"x": "ok"');
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/xml-json');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Output' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
