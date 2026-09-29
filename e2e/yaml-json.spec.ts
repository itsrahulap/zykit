import { expect, test } from '@playwright/test';

test('converts YAML to JSON and back, with options and swap', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/yaml-json');
  await expect(page).toHaveTitle(/YAML ↔ JSON.* · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('Input YAML').fill('base: &b\n  x: 1\ncopy: *b\nlist: [a, 2]\n');
  const output = page.getByRole('region', { name: 'Output' });
  await expect(output.locator('pre')).toHaveText('{\n  "base": {\n    "x": 1\n  },\n  "copy": {\n    "x": 1\n  },\n  "list": [\n    "a",\n    2\n  ]\n}');
  await expect(page.getByText('Converted 1 document to JSON · 1 alias resolved')).toBeVisible();

  await page.getByRole('group', { name: 'JSON indent' }).getByRole('button', { name: 'Minified' }).click();
  await expect(output.locator('pre')).toHaveText('{"base":{"x":1},"copy":{"x":1},"list":["a",2]}');

  await output.getByRole('button', { name: 'Copy' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('{"base":{"x":1},"copy":{"x":1},"list":["a",2]}');

  const downloadPromise = page.waitForEvent('download');
  await output.getByRole('button', { name: 'Download .json' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('converted.json');

  await page.getByRole('button', { name: 'Swap' }).click();
  await expect(page.getByLabel('Input JSON')).toHaveValue('{"base":{"x":1},"copy":{"x":1},"list":["a",2]}');
  await expect(output.locator('pre')).toHaveText('base:\n  x: 1\ncopy:\n  x: 1\nlist:\n  - a\n  - 2\n');

  await page.getByRole('combobox', { name: 'Strings' }).click();
  await page.getByRole('option', { name: '"Double quoted"' }).click();
  await expect(output.locator('pre')).toContainText('- "a"');

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('shows errors with position and warnings for non-JSON features', async ({ page }) => {
  await page.goto('/tools/yaml-json');
  await page.getByLabel('Input YAML').fill('a: 1\na: 2\n');
  await expect(page.getByText('Line 2, column 1', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Input YAML')).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'Jump to error in input' }).click();
  await expect(page.getByLabel('Input YAML')).toBeFocused();

  await page.getByLabel('Input YAML').fill('200: ok\nv: !custom x\n---\nb: 2\n');
  await expect(page.getByText(/1 non-string key became JSON strings/)).toBeVisible();
  await expect(page.getByText(/Custom tags .* !custom/)).toBeVisible();
  await expect(page.getByRole('region', { name: 'Output' }).locator('pre')).toContainText('"b": 2');
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/yaml-json');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Output' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
