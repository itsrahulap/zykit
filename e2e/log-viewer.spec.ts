import { expect, test } from '@playwright/test';

const LOGS = [
  '{"time":"2025-01-01T10:00:00Z","level":"info","msg":"start","user":{"id":1}}',
  '{"time":"2025-01-01T10:01:00Z","level":"error","msg":"boom","user":{"id":2}}',
  '2025-01-01T10:02:00Z WARN plain warning',
].join('\n');

test('filters logs, expands a row and exports NDJSON', async ({ page }) => {
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(e.message));

  await page.goto('/tools/log-viewer');
  await expect(page).toHaveTitle(/Log Viewer.* · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('Log input').fill(LOGS);
  await expect(page.getByText(/3 entries · \d+ fields? detected/)).toBeVisible();
  const list = page.getByRole('region', { name: 'Log entries' });
  await expect(list.getByRole('button')).toHaveCount(3);
  await expect(page.getByRole('group', { name: 'Levels' }).getByRole('button', { name: /^error 1$/ })).toBeVisible();

  await page.getByRole('button', { name: /^error 1$/ }).click();
  await expect(list.getByRole('button')).toHaveCount(1);
  await page.getByRole('button', { name: /^error 1$/ }).click();
  await page.getByLabel('Field filters', { exact: false }).fill('user.id=1');
  await expect(list.getByRole('button')).toHaveCount(1);
  await expect(list).toContainText('start');
  await page.getByLabel('Field filters', { exact: false }).fill('');
  await page.getByLabel('Contains text').fill('plain');
  await expect(list.getByRole('button')).toHaveCount(1);
  await page.getByLabel('Contains text').fill('boom');
  await list.getByRole('button').click();
  await expect(page.getByRole('region', { name: 'Entry' }).or(page.locator('#log-detail'))).toContainText('"msg": "boom"');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export filtered NDJSON' }).click();
  const d = await download;
  expect(d.suggestedFilename()).toBe('logs-filtered.ndjson');
  const fs = await import('node:fs/promises');
  expect(await fs.readFile((await d.path()) as string, 'utf8')).toBe(`${LOGS.split('\n')[1]}\n`);

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('Log Viewer has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/log-viewer');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Log entries' })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
