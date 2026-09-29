import { expect, test } from '@playwright/test';

test('finds, highlights, navigates and replaces with rules in sequence', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/find-replace');
  await expect(page).toHaveTitle(/^Find & Replace: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('Text', { exact: true }).fill('cat Cat concat <b>cat</b>');
  await page.getByLabel('Find (rule 1)').fill('cat');
  const matches = page.getByRole('region', { name: 'Matches' });
  await expect(matches.locator('mark')).toHaveCount(4);
  await expect(page.getByTestId('match-position')).toHaveText('1 of 4');
  // Rendered as text, not HTML.
  await expect(page.getByTestId('highlighted')).toContainText('<b>');
  await matches.getByRole('button', { name: 'Next match' }).click();
  await expect(page.getByTestId('match-position')).toHaveText('2 of 4');
  await expect(matches.locator('mark[aria-current="true"]')).toHaveText('Cat');
  await matches.getByRole('button', { name: 'Previous match' }).click();
  await matches.getByRole('button', { name: 'Previous match' }).click();
  await expect(page.getByTestId('match-position')).toHaveText('4 of 4');

  await page.getByLabel('Whole word').check();
  await page.getByLabel('Case sensitive').check();
  await expect(matches.locator('mark')).toHaveCount(2);
  await page.getByLabel('Replace with (rule 1)').fill('$dog');
  const output = page.getByRole('region', { name: 'Output' });
  await expect(output.locator('pre')).toHaveText('$dog Cat concat <b>$dog</b>');

  await page.getByRole('group', { name: 'Replace' }).getByRole('button', { name: 'Replace first' }).click();
  await expect(output.locator('pre')).toHaveText('$dog Cat concat <b>cat</b>');
  await page.getByRole('group', { name: 'Replace' }).getByRole('button', { name: 'Replace all' }).click();

  // Regex mode with groups, and a second rule working on the first rule's output.
  await page.getByLabel('Whole word').uncheck();
  await page.getByLabel('Regular expression').check();
  await page.getByLabel('Find (rule 1)').fill('<(?<tag>\\w+)>(.*?)</\\k<tag>>');
  await page.getByLabel('Replace with (rule 1)').fill('[$<tag>:$2:$&]');
  await expect(output.locator('pre')).toHaveText('cat Cat concat [b:cat:<b>cat</b>]');
  await page.getByRole('button', { name: '+ Add rule' }).click();
  await page.getByLabel('Find (rule 2)').fill('^cat');
  await page.getByLabel('Replace with (rule 2)').fill('dog');
  await expect(output.locator('pre')).toHaveText('dog Cat concat [b:cat:<b>cat</b>]');
  await expect(matches.locator('mark')).toHaveCount(1);

  await output.getByRole('button', { name: 'Copy' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('dog Cat concat [b:cat:<b>cat</b>]');
  await page.getByRole('button', { name: 'Remove rule 2' }).click();
  await expect(page.getByLabel('Find (rule 2)')).toHaveCount(0);

  await page.getByLabel('Find (rule 1)').fill('(');
  await expect(page.getByText(/Unterminated group/)).toBeVisible();

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('stops a catastrophic pattern without freezing the page', async ({ page }) => {
  await page.goto('/tools/find-replace');
  await page.getByLabel('Regular expression').check();
  await page.getByLabel('Text', { exact: true }).fill(`${'a'.repeat(40)}!`);
  await page.getByLabel('Find (rule 1)').fill('(a+)+$');
  await expect(page.getByText(/took longer than 1 second/)).toBeVisible({ timeout: 5000 });
  // The page still responds, and a fresh worker handles the next pattern.
  await page.getByLabel('Find (rule 1)').fill('a+!');
  await expect(page.getByRole('region', { name: 'Matches' }).locator('mark')).toHaveCount(1);
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/find-replace');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Output' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
