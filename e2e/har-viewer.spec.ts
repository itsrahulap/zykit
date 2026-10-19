import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const entry = (url: string, status: number, time: number, at: number, extra = {}) => ({
  startedDateTime: new Date(Date.parse('2025-01-01T00:00:00Z') + at).toISOString(),
  time,
  request: { method: 'GET', url, headers: [{ name: 'X-Req', value: 'abc' }], queryString: [{ name: 'q', value: '1' }] },
  response: { status, headers: [{ name: 'X-Res', value: 'def' }], content: { size: 10, mimeType: 'application/json', text: '{"hello":"world"}' }, bodySize: 10 },
  timings: { wait: time },
  ...extra,
});
const HAR = JSON.stringify({ log: { entries: [entry('https://a.test/one?q=1', 200, 50, 0), entry('https://b.test/slow', 500, 900, 10), entry('https://a.test/two', 200, 120, 20)] } });

test('opens a HAR, filters, sorts and shows detail', async ({ page }) => {
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(e.message));

  await page.goto('/tools/har-viewer');
  await expect(page).toHaveTitle(/HAR Viewer.* · Zykit$/);
  const origin = new URL(page.url()).origin;
  await expect(page.getByText(/cookies, authorization headers, tokens/).first()).toBeVisible();

  await page.getByTestId('file-input').setInputFiles({ name: 't.har', mimeType: 'application/json', buffer: Buffer.from(HAR) });
  await expect(page.getByText(/3 requests/).first()).toBeVisible();
  const table = page.getByRole('region', { name: 'Requests' });
  const urls = () => table.locator('tbody tr:not([aria-hidden]) td:nth-child(3)').allTextContents();
  expect(await urls()).toEqual(['https://a.test/one?q=1', 'https://b.test/slow', 'https://a.test/two']);
  await expect(table.getByRole('img').first()).toBeVisible();

  await table.getByRole('button', { name: 'Time' }).click();
  await table.getByRole('button', { name: 'Time' }).click();
  await expect.poll(urls).toEqual(['https://b.test/slow', 'https://a.test/two', 'https://a.test/one?q=1']);
  await page.getByLabel('Filter requests').fill('a.test');
  await expect.poll(urls).toEqual(['https://a.test/two', 'https://a.test/one?q=1']);

  await table.getByRole('button', { name: 'https://a.test/one?q=1' }).click();
  const detail = page.getByRole('region', { name: 'Requests' }).locator('xpath=following::section[1]');
  await expect(detail).toContainText('X-Req');
  await expect(detail).toContainText('{"hello":"world"}');
  await expect(page.getByRole('heading', { name: 'Slowest 10' })).toBeVisible();

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('hides secrets until revealed and downloads a redacted HAR', async ({ page }) => {
  const secret = entry('https://a.test/cb?access_token=SECRET1&page=2', 200, 40, 0, {
    request: {
      method: 'POST',
      url: 'https://a.test/cb?access_token=SECRET1&page=2',
      headers: [{ name: 'Authorization', value: 'Bearer SECRET2' }, { name: 'Accept', value: 'text/html' }],
      queryString: [{ name: 'access_token', value: 'SECRET1' }],
      postData: { mimeType: 'application/json', text: '{"password":"SECRET3"}' },
    },
  });
  await page.goto('/tools/har-viewer');
  await page.getByTestId('file-input').setInputFiles({ name: 'cap.har', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ log: { entries: [secret] } })) });
  const table = page.getByRole('region', { name: 'Requests' });
  await expect(table).toContainText('access_token=[REDACTED]&page=2');
  await table.getByRole('button', { name: /a\.test\/cb/ }).click();
  const detail = page.getByRole('region', { name: 'Requests' }).locator('xpath=following::section[1]');
  await expect(detail).toContainText('text/html');
  await expect(page.locator('body')).not.toContainText(/SECRET[123]/);

  await page.getByRole('button', { name: 'Reveal Request headers: Authorization' }).click();
  await expect(detail).toContainText('Bearer SECRET2');
  await expect(page.locator('body')).not.toContainText('SECRET3');
  await page.getByLabel('Show sensitive values').check();
  await expect(page.locator('body')).toContainText('SECRET3');
  await expect(table).toContainText('access_token=SECRET1');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download redacted HAR' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('cap-redacted.har');
  const text = await readFile((await file.path())!, 'utf8');
  expect(text).not.toMatch(/SECRET[123]/);
  expect(text).not.toContain('{\\"hello\\":\\"world\\"}');
  expect(JSON.parse(text).log.entries).toHaveLength(1);
});

test('rejects non-HAR JSON', async ({ page }) => {
  await page.goto('/tools/har-viewer');
  await page.getByTestId('file-input').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"a":1}') });
  await expect(page.getByText(/not a HAR file/)).toBeVisible();
});

test('HAR Viewer has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/har-viewer');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Requests' })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
