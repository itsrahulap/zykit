import { expect, test, type Page } from '@playwright/test';

function watch(page: Page) {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    const u = r.url();
    if (!(u.startsWith(origin) || u.startsWith('blob:') || u.startsWith('data:')) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${u}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return { offOrigin, errors };
}

// 1×1 transparent PNG.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

test('QR Code Generator encodes content and downloads PNG and SVG', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const { offOrigin, errors } = watch(page);
  await page.goto('/tools/qr-code-generator');
  await expect(page).toHaveTitle(/QR Code Generator/);
  await expect(page.getByText('Version 2 (25×25) · level M · byte mode', { exact: false })).toBeVisible();
  await expect(page.getByTestId('qr-preview')).toBeVisible();

  await page.getByLabel('Text or URL').fill('HELLO WORLD');
  await expect(page.getByText(/Version 1 \(21×21\) · level M · alphanumeric mode/)).toBeVisible();
  await page.getByRole('group', { name: 'Error correction' }).getByRole('button', { name: 'H 30%' }).click();
  await expect(page.getByText(/level H/).first()).toBeVisible();

  const svgDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'SVG', exact: true }).click();
  expect((await svgDownload).suggestedFilename()).toBe('qr-code.svg');
  const pngDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNG', exact: true }).click();
  expect((await pngDownload).suggestedFilename()).toBe('qr-code.png');

  await page.getByRole('button', { name: 'Copy SVG' }).click();
  const svg = await page.evaluate(() => navigator.clipboard.readText());
  expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 33 33"/); // 2-H once the level is H
  expect(svg.match(/<path/g)).toHaveLength(1);

  await page.getByRole('group', { name: 'Content type' }).getByRole('button', { name: 'Wi-Fi' }).click();
  await expect(page.getByText('Enter the network name (SSID).').first()).toBeVisible();
  await page.getByLabel('Network name (SSID)').fill('Home;Net');
  await page.getByLabel('Password').fill('secret');
  await page.getByText('Encoded text').first().click();
  await expect(page.getByText(String.raw`WIFI:T:WPA;S:Home\;Net;P:••••••;;`)).toBeVisible();

  await page.getByTestId('logo-input').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.getByText('A logo covers the centre, so error correction is fixed at H.')).toBeVisible();
  await expect(page.getByTestId('qr-preview').locator('image')).toHaveCount(1);

  await page.getByRole('button', { name: 'Remove logo' }).click();
  await page.getByLabel('Foreground').fill('#dddddd');
  await expect(page.getByText(/Low contrast/)).toBeVisible();

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('QR Code Generator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/qr-code-generator');
  await expect(page.getByTestId('qr-preview')).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
