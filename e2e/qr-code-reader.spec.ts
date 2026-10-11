import { expect, test, type Page } from '@playwright/test';
import { expectNoSideScroll, watch } from './image-helpers';
import { encodeQr } from '../src/tools/qr-code-generator/features/qr';

/** A PNG of the symbol drawn by the browser's canvas, 6 px per module with a quiet zone. */
async function qrPng(page: Page, text: string): Promise<Buffer> {
  const { modules } = encodeQr(text, { ecc: 'M' });
  const data = await page.evaluate(async (m) => {
    const px = 6;
    const q = 4;
    const c = document.createElement('canvas');
    c.width = c.height = (m.length + q * 2) * px;
    const g = c.getContext('2d')!;
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#000';
    m.forEach((row, y) => row.forEach((d, x) => d && g.fillRect((x + q) * px, (y + q) * px, px, px)));
    const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/png'));
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  }, modules);
  return Buffer.from(data);
}

const load = async (page: Page, text: string) =>
  page.getByTestId('image-input').setInputFiles({ name: 'code.png', mimeType: 'image/png', buffer: await qrPng(page, text) });

test('QR Code Reader reads codes locally and treats links and Wi-Fi safely', async ({ page }) => {
  const w = watch(page);
  await page.goto('/tools/qr-code-reader');
  await expect(page).toHaveTitle(/QR Code Reader/);

  await load(page, 'https://xn--pple-43d.example/login');
  await expect(page.getByTestId('raw-content')).toHaveText('https://xn--pple-43d.example/login');
  await expect(page.getByRole('heading', { name: 'Link' })).toBeVisible();
  await expect(page.getByText(/international characters/)).toBeVisible();
  await expect(page.locator('a[href*="xn--"]')).toHaveCount(0); // shown as text, never a link to follow
  await expect(page.locator('p[aria-live="polite"]')).toContainText('Decoded with');

  await load(page, 'WIFI:T:WPA;S:Home Net;P:hunter2pass;;');
  await expect(page.getByText('Home Net')).toBeVisible();
  await expect(page.getByText('hunter2pass')).toHaveCount(0);
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(page.getByText('hunter2pass').first()).toBeVisible();
  await page.getByRole('button', { name: 'Hide password' }).click();
  await expect(page.getByText('hunter2pass')).toHaveCount(0);

  await load(page, 'Plain text ünïcode ✓');
  await expect(page.getByTestId('raw-content')).toHaveText('Plain text ünïcode ✓');

  // an image without a code reports an error instead of a result
  await page.getByTestId('image-input').setInputFiles({
    name: 'blank.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'),
  });
  await expect(page.getByRole('alert')).toContainText(/No QR code/);
  w.check();
});

test('QR Code Reader has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/qr-code-reader');
  await load(page, 'WIFI:T:WPA;S:A-very-long-network-name-with-no-spaces-at-all-0123456789;P:averylongpasswordwithoutanyspaces0123456789;;');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expectNoSideScroll(page);
});
