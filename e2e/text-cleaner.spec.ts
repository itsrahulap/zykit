import { expect, test } from '@playwright/test';

test('cleans text through the step pipeline with stats, copy and download', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/text-cleaner');
  await expect(page).toHaveTitle(/^Text Cleaner: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('Input text').fill('  b \n\na\nB\na\n');
  const output = page.getByRole('region', { name: 'Output' });
  // Default steps: trim, remove empty, dedupe (case-sensitive).
  await expect(output.locator('pre')).toHaveText('b\na\nB\n');
  await expect(page.getByText('5 lines → 3 lines · 2 removed')).toBeVisible();

  const steps = page.getByRole('region', { name: 'Cleaning steps' });
  await steps.getByLabel('Ignore case').check();
  await expect(output.locator('pre')).toHaveText('b\na\n');

  await steps.getByRole('checkbox', { name: 'Sort lines' }).check();
  await expect(output.locator('pre')).toHaveText('a\nb\n');
  await steps.getByRole('combobox', { name: 'Order' }).click();
  await page.getByRole('option', { name: 'Z → A' }).click();
  await expect(output.locator('pre')).toHaveText('b\na\n');

  await steps.getByRole('checkbox', { name: 'Number lines' }).check();
  await expect(output.locator('pre')).toHaveText('1. b\n2. a\n');
  // Move "Number lines" above "Sort lines": numbering now happens before sorting.
  await steps.getByRole('button', { name: 'Move “Number lines” up' }).click();
  await steps.getByRole('button', { name: 'Move “Number lines” up' }).click();
  await steps.getByRole('button', { name: 'Move “Number lines” up' }).click();
  await expect(output.locator('pre')).toHaveText('2. a\n1. b\n');

  await output.getByRole('button', { name: 'Copy' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('2. a\n1. b\n');
  const downloadPromise = page.waitForEvent('download');
  await output.getByRole('button', { name: 'Download .txt' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('cleaned.txt');

  await page.getByRole('button', { name: 'Reset steps' }).click();
  await page.getByLabel('Input text').fill('a​b\r\nc');
  await steps.getByRole('checkbox', { name: 'Strip non-printable and zero-width characters' }).check();
  await steps.getByRole('checkbox', { name: 'Normalise line endings' }).check();
  await output.getByRole('button', { name: 'Copy' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('ab\nc');

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/text-cleaner');
  await page.getByRole('button', { name: 'Try an example' }).click();
  const steps = page.getByRole('region', { name: 'Cleaning steps' });
  for (const label of ['Sort lines', 'Keep or remove lines containing text', 'Number lines', 'Add prefix / suffix', 'Convert tabs ↔ spaces']) await steps.getByRole('checkbox', { name: label }).check();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
