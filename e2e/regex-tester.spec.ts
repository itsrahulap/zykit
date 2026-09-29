import { expect, test } from '@playwright/test';

test('highlights matches, lists groups and previews replacements', async ({ page }) => {
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/regex-tester');
  await expect(page).toHaveTitle(/^Regex Tester: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('Pattern', { exact: true }).fill('(?<y>\\d{4})-(\\d{2})');
  await page.getByLabel('Test text').fill('a 2024-01 b <img src=x onerror=alert(1)> 1999-12');
  await expect(page.getByText('2 matches', { exact: true })).toBeVisible();
  const marks = page.getByLabel('Highlighted matches').locator('mark');
  await expect(marks).toHaveText(['2024-01', '1999-12']);
  await expect(page.getByLabel('Highlighted matches')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('img[src="x"]')).toHaveCount(0);

  const table = page.getByRole('region', { name: 'Match table' });
  await expect(table.getByRole('row')).toHaveCount(3);
  await expect(table.getByText('"2024"').first()).toBeVisible();
  await expect(table.getByText('<y>').first()).toBeVisible();

  await page.getByLabel('Replacement').fill('$2/$<y>');
  await expect(page.locator('section', { hasText: 'Replacement' }).locator('pre')).toHaveText('a 01/2024 b <img src=x onerror=alert(1)> 12/1999');

  await page.getByLabel('g — global').uncheck();
  await expect(page.getByText('1 match', { exact: true })).toBeVisible();

  const tokens = page.getByRole('list', { name: 'Pattern tokens' });
  await expect(tokens).toContainText('Start of capture group 1 named “y”');
  await expect(tokens).toContainText('Exactly 4 times');

  await page.getByLabel('Pattern', { exact: true }).fill('(');
  await expect(page.getByText(/^Invalid pattern:/)).toBeVisible();

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('stops catastrophic backtracking and keeps working', async ({ page }) => {
  await page.goto('/tools/regex-tester');
  await page.getByLabel('Test text').fill('a'.repeat(40) + '!');
  await page.getByLabel('Pattern', { exact: true }).fill('^(a+)+$');
  await expect(page.getByText('Stopped after 1 s — the pattern may backtrack catastrophically').first()).toBeVisible({ timeout: 5000 });
  // The page is still responsive and a fresh worker handles the next pattern.
  await page.getByLabel('Pattern', { exact: true }).fill('a+');
  await expect(page.getByText('1 match', { exact: true })).toBeVisible();
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/regex-tester');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByText('3 matches', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
