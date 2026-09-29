import { expect, test } from '@playwright/test';

test('counts words, characters and frequent words live', async ({ page }) => {
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/word-counter');
  await expect(page).toHaveTitle(/^Word Counter: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('Your text').fill('The cat sat on the mat. The cat napped! 👍🏽\n\nSecond paragraph.');
  await expect(page.getByTestId('stat-words')).toHaveText('11');
  await expect(page.getByTestId('stat-sentences')).toHaveText('3');
  await expect(page.getByText('11 words · ', { exact: false })).toBeVisible();

  const details = page.getByRole('region', { name: 'Details' }).or(page.locator('section', { hasText: 'Characters (no spaces)' }));
  await expect(details.getByText('Paragraphs').locator('..')).toContainText('2');
  await expect(details.getByText('Longest word').locator('..')).toContainText('paragraph');

  const top = page.getByRole('list', { name: 'Top words' });
  await expect(top.getByRole('listitem').first()).toContainText('cat');
  await expect(top.getByRole('listitem').first()).toContainText('2');
  await page.getByLabel(/Ignore common words/).uncheck();
  await expect(top.getByRole('listitem').first()).toContainText('the');
  await expect(top.getByRole('listitem').first()).toContainText('3');

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('stays responsive on a 1 MB input', async ({ page }) => {
  await page.goto('/tools/word-counter');
  const text = 'lorem ipsum dolor sit amet. '.repeat(40_000);
  await page.getByLabel('Your text').fill(text);
  await expect(page.getByTestId('stat-words')).toHaveText('200,000', { timeout: 15_000 });
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/word-counter');
  await page.getByLabel('Your text').fill('Pneumonoultramicroscopicsilicovolcanoconiosisandevenlongerwordsthatneverend '.repeat(20));
  await expect(page.getByTestId('stat-words')).toHaveText('20');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
