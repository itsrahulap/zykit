import { expect, test } from '@playwright/test';

test('compares two texts with word highlights, views and a unified diff', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/diff-checker');
  await expect(page).toHaveTitle(/^Diff Checker: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('Original', { exact: true }).fill('alpha\nconst answer = 41;\ngamma\n');
  await page.getByLabel('Changed', { exact: true }).fill('alpha\r\nconst answer = 42;\r\ngamma\r\ndelta\r\n');

  await expect(page.getByText('+2 additions, −1 removal').first()).toBeVisible();
  const result = page.getByRole('region', { name: 'Differences' });
  await expect(result.getByRole('table')).toBeVisible();
  await expect(result.locator('del')).toHaveText('41');
  await expect(result.locator('ins').first()).toHaveText('42');
  // No line-ending note here: textarea values always use LF, so CRLF is only testable in unit tests.

  // Unified view
  await page.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Unified' }).click();
  await expect(page.getByRole('button', { name: 'Unified', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(result.getByText('Added:')).toHaveCount(2);
  await expect(result.getByText('Removed:')).toHaveCount(1);

  // Copy unified diff
  await result.getByRole('button', { name: 'Copy unified diff' }).click();
  await expect(result.getByRole('button', { name: 'Copied' })).toBeVisible();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toBe('--- original\n+++ changed\n@@ -1,3 +1,4 @@\n alpha\n-const answer = 41;\n+const answer = 42;\n gamma\n+delta\n');

  // Swap sides flips additions and removals
  await page.getByRole('button', { name: 'Swap sides' }).click();
  await expect(page.getByText('+1 addition, −2 removals').first()).toBeVisible();

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('ignore options produce a "No differences" state', async ({ page }) => {
  await page.goto('/tools/diff-checker');
  await page.getByLabel('Original', { exact: true }).fill('Hello World');
  await page.getByLabel('Changed', { exact: true }).fill('  hello   world ');
  await expect(page.getByText('+1 addition, −1 removal').first()).toBeVisible();
  await page.getByLabel('Ignore case').check();
  await page.getByLabel('Ignore all whitespace').check();
  await expect(page.getByText('No differences with the current options.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(page.getByLabel('Original', { exact: true })).toHaveValue('');
});

test('collapses long unchanged regions and expands them on request', async ({ page }) => {
  await page.goto('/tools/diff-checker');
  const lines = Array.from({ length: 40 }, (_, i) => `line ${i + 1}`);
  const changed = [...lines];
  changed[20] = 'line twenty-one';
  await page.getByLabel('Original', { exact: true }).fill(lines.join('\n'));
  await page.getByLabel('Changed', { exact: true }).fill(changed.join('\n'));
  const result = page.getByRole('region', { name: 'Differences' });
  // 3 lines of context either side of line 21: lines 1–17 and 25–40 are hidden.
  await expect(result.getByRole('button', { name: 'Show 17 hidden unchanged lines' })).toBeVisible();
  await expect(result.getByRole('button', { name: 'Show 16 hidden unchanged lines' })).toBeVisible();
  await expect(result.getByRole('cell', { name: 'line 1', exact: true })).toHaveCount(0);
  await result.getByRole('button', { name: 'Show 17 hidden unchanged lines' }).click();
  await expect(result.getByRole('button', { name: /hidden unchanged/ })).toHaveCount(1);
  await expect(result.getByRole('cell', { name: 'line 1', exact: true }).first()).toBeVisible();
});

test('phones get the unified view and no sideways page scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/tools/diff-checker');
  await page.getByRole('button', { name: 'Try an example' }).click();
  const result = page.getByRole('region', { name: 'Differences' });
  await expect(result.getByText('Added:').first()).toBeAttached();
  await expect(page.getByRole('group', { name: 'View' })).toHaveCount(0);
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
