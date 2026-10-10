import { expect, test } from '@playwright/test';

test('Protobuf Decoder works locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/protobuf-decoder');
  await expect(page).toHaveTitle(/Protobuf Decoder/);
  await page.getByLabel(/Input bytes/).fill('0a 07 74 65 73 74 69 6e 67 10 96 01 1a 05 08 01 12 01 78');
  const out = page.getByRole('region', { name: 'Decoded fields' });
  await expect(out).toContainText('"testing"');
  await expect(out).toContainText('150');
  await expect(out).toContainText('sint (zigzag): 75');
  await expect(out).toContainText('message, 2 fields');

  await page.getByLabel(/Input bytes/).fill('CJYB');
  await expect(out).toContainText('150');

  await page.getByLabel(/Input bytes/).fill('08 01 12 05 61');
  await expect(page.getByRole('alert')).toContainText('declares 5 bytes');
  await expect(out).toContainText('#1');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Protobuf Decoder has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/protobuf-decoder');
  await page.getByRole('button', { name: 'Try an example' }).click();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
