import { expect, test } from '@playwright/test';

test('generates v4 and v7 UUIDs, formats them and inspects one', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/uuid-generator');
  await expect(page).toHaveTitle(/^UUID Generator: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;
  const output = page.getByRole('region', { name: 'Generated UUIDs' }).locator('pre');

  await page.getByLabel('How many').fill('25');
  await page.getByRole('group', { name: 'Version' }).getByRole('button', { name: /v7/ }).click();
  await expect(page.getByText('25 UUIDs · version 7')).toBeVisible();
  const lines = (await output.textContent())!.split('\n');
  expect(lines).toHaveLength(25);
  for (const l of lines) expect(l).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect([...lines].sort()).toEqual(lines);

  await page.getByLabel('Uppercase').check();
  await page.getByLabel('Hyphens').uncheck();
  await page.getByLabel('Braces').check();
  await expect.poll(async () => (await output.textContent())!.split('\n')[0]).toMatch(/^\{[0-9A-F]{32}\}$/);

  await page.getByRole('button', { name: 'Copy all' }).click();
  expect((await page.evaluate(() => navigator.clipboard.readText())).split('\n')).toHaveLength(25);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .txt' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('uuids-v7.txt');

  await page.getByLabel('UUID to inspect').fill('017F22E2-79B0-7CC3-98C4-DC0C0C07398F');
  await expect(page.getByText('Unix time-ordered')).toBeVisible();
  await expect(page.getByText('2022-02-22T19:22:22.000Z')).toBeVisible();
  await page.getByLabel('UUID to inspect').fill('not-a-uuid');
  await expect(page.getByText(/Not a valid UUID/)).toBeVisible();

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/uuid-generator');
  await page.getByLabel('UUID to inspect').fill('c232ab00-9414-11ec-b3c8-9f6bdeced846');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
