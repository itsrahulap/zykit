import { expect, test } from '@playwright/test';

test('converts TOML to JSON and back, with errors located', async ({ page }) => {
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(e.message));

  await page.goto('/tools/toml-json');
  await expect(page).toHaveTitle(/TOML.* · Zykit$/);
  const origin = new URL(page.url()).origin;

  await page.getByLabel('Input TOML').fill('title = "x"\nport = 0x1F90\nwhen = 1979-05-27T07:32:00Z\n[[s]]\nn = 1\n[[s]]\nn = 2\n');
  await expect(page.getByText('Converted TOML to JSON')).toBeVisible();
  const out = page.getByRole('region', { name: 'Output' });
  await expect(out).toContainText('"port": 8080');
  await expect(out).toContainText('"when": "1979-05-27T07:32:00Z"');

  await page.getByRole('button', { name: 'Swap' }).click();
  await expect(page.getByLabel('Input JSON')).toHaveValue(/"port": 8080/);
  await expect(out).toContainText('[[s]]');

  await page.getByRole('button', { name: 'Swap' }).click();
  await page.getByLabel('Input TOML').fill('a = 1\na = 2');
  await expect(page.getByText('Invalid TOML: Duplicate key "a" (line 2, column 1)')).toBeVisible();
  await expect(page.getByText('Line 2, column 1', { exact: true })).toBeVisible();

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('TOML ↔ JSON has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/toml-json');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByText('Converted TOML to JSON')).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
