import { expect, test } from '@playwright/test';

test('generates TypeScript types from JSON', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/json-to-typescript');
  await expect(page).toHaveTitle(/^JSON to TypeScript: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('Input JSON').fill('{"users":[{"id":1,"email":"a@x"},{"id":2,"email":null,"at":"2024-01-01"}]}');
  const output = page.getByRole('region', { name: 'TypeScript output' });
  const expected =
    'export interface Root {\n  users: User[];\n}\n\nexport interface User {\n  id: number;\n  email: string | null;\n  at?: string;\n}\n';
  await expect(output.locator('pre')).toHaveText(expected);
  await expect(page.getByText(/typed as/)).toBeVisible();

  await page.getByRole('group', { name: 'Declaration style' }).getByRole('button', { name: 'type alias' }).click();
  await page.getByLabel('export').uncheck();
  await page.getByLabel('readonly').check();
  await page.getByLabel('Root name').fill('Payload');
  await expect(output.locator('pre')).toContainText('type Payload = {\n  readonly users: readonly User[];\n};');

  await output.getByRole('button', { name: 'Copy' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('type Payload = {');

  const downloadPromise = page.waitForEvent('download');
  await output.getByRole('button', { name: 'Download .ts' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('types.ts');

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('points at syntax errors', async ({ page }) => {
  await page.goto('/tools/json-to-typescript');
  await page.getByLabel('Input JSON').fill('{\n  "a": 1,\n}');
  await expect(page.getByText("Invalid JSON: Unexpected '}' — trailing comma? (line 3, column 1)")).toBeVisible();
  await page.getByRole('button', { name: 'Jump to error in input' }).click();
  await expect(page.getByLabel('Input JSON')).toBeFocused();
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/json-to-typescript');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'TypeScript output' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
