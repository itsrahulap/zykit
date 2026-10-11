import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('Placeholder Image works locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/placeholder-image');
  await expect(page).toHaveTitle(/Placeholder Image/);
  await page.getByLabel('Width (px)').fill('300');
  await page.getByLabel('Height (px)').fill('200');
  await expect(page.getByText('300×200 PNG')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Placeholder image 300×200' })).toBeVisible();
  await expect(page.locator('pre')).toContainText('300×200');

  await page.getByLabel('Text colour', { exact: true }).fill('#cccccc');
  await page.getByLabel('Background colour', { exact: true }).fill('#ffffff');
  await expect(page.getByText(/Low contrast/)).toBeVisible();
  await page.getByLabel('Text colour', { exact: true }).fill('#000000');

  const png = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PNG' }).click();
  const d = await png;
  expect(d.suggestedFilename()).toBe('placeholder-300x200.png');
  const bytes = readFileSync(await d.path());
  expect(bytes.subarray(1, 4).toString()).toBe('PNG');
  expect(bytes.readUInt32BE(16)).toBe(300);
  expect(bytes.readUInt32BE(20)).toBe(200);

  const zip = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download ZIP \(3\)/ }).click();
  const z = await zip;
  expect(z.suggestedFilename()).toBe('placeholders.zip');
  expect(readFileSync(await z.path()).subarray(0, 2).toString()).toBe('PK');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Placeholder Image has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/placeholder-image');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
