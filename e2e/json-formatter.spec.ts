import { expect, test } from '@playwright/test';

test('formats, minifies and sorts JSON, keeping big numbers exact', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/json-formatter');
  await expect(page).toHaveTitle(/^JSON Formatter: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('Input JSON').fill('{"b":1,"a":{"id":12345678901234567890}}');
  const output = page.getByRole('region', { name: 'Output' });
  await expect(output.locator('pre')).toHaveText('{\n  "b": 1,\n  "a": {\n    "id": 12345678901234567890\n  }\n}');
  await expect(page.getByText(/1 number has more digits than JavaScript can store exactly/)).toBeVisible();
  await expect(page.getByText('Valid JSON · 3 keys · depth 2')).toBeVisible();

  await page.getByRole('group', { name: 'Indent' }).getByRole('button', { name: '4 spaces' }).click();
  await expect.poll(() => output.locator('pre').textContent()).toContain('\n    "b": 1');

  await page.getByLabel('Sort keys (recursively)').check();
  await page.getByRole('group', { name: 'Action' }).getByRole('button', { name: 'Minify' }).click();
  await expect(output.locator('pre')).toHaveText('{"a":{"id":12345678901234567890},"b":1}');

  await output.getByRole('button', { name: 'Copy' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('{"a":{"id":12345678901234567890},"b":1}');

  const downloadPromise = page.waitForEvent('download');
  await output.getByRole('button', { name: 'Download .json' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('minified.json');

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('points at syntax errors with line and column', async ({ page }) => {
  await page.goto('/tools/json-formatter');
  await page.getByLabel('Input JSON').fill('{\n  "a": 1,\n}');
  await expect(page.getByText("Invalid JSON: Unexpected '}' — trailing comma? (line 3, column 1)")).toBeVisible();
  await expect(page.getByText('Line 3, column 1', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Input JSON')).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'Jump to error in input' }).click();
  await expect(page.getByLabel('Input JSON')).toBeFocused();
});

test('validate mode confirms valid JSON without output', async ({ page }) => {
  await page.goto('/tools/json-formatter');
  await page.getByRole('group', { name: 'Action' }).getByRole('button', { name: 'Validate' }).click();
  await page.getByLabel('Input JSON').fill('[1, 2, 3]');
  await expect(page.getByText('This is valid JSON.')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Output' })).toHaveCount(0);
});
