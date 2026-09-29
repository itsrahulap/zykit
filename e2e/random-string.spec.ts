import { expect, test } from '@playwright/test';

test('generates random strings with presets, prefix and formats', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/random-string');
  await expect(page).toHaveTitle(/Random String Generator/);
  const origin = new URL(page.url()).origin;
  const output = page.getByRole('region', { name: 'Output' });

  await page.getByRole('spinbutton', { name: /Length/ }).fill('16');
  await page.getByRole('spinbutton', { name: /How many/ }).fill('3');
  await page.getByLabel('Prefix').fill('sk_');
  await expect(output.locator('pre')).toHaveText(/^(sk_[0-9a-f]{16}\n){2}sk_[0-9a-f]{16}$/);
  await expect(page.getByText('3 strings · 64 bits of entropy each')).toBeVisible();

  await page.getByRole('combobox', { name: 'Characters' }).click();
  await page.getByRole('option', { name: 'Custom' }).click();
  await page.getByLabel('Custom characters').fill('aabb');
  await expect(page.getByText(/^2 unique characters/)).toBeVisible();
  await page.getByRole('group', { name: 'Output format' }).getByRole('button', { name: 'JSON array' }).click();
  const json = JSON.parse((await output.locator('pre').textContent()) ?? '');
  expect(json).toHaveLength(3);
  for (const s of json) expect(s).toMatch(/^sk_[ab]{16}$/);

  await output.getByRole('button', { name: 'Copy' }).click();
  expect(JSON.parse(await page.evaluate(() => navigator.clipboard.readText()))).toEqual(json);

  const downloadPromise = page.waitForEvent('download');
  await output.getByRole('button', { name: 'Download' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('random-strings.json');

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/random-string');
  await page.getByRole('spinbutton', { name: /Length/ }).fill('4096');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
