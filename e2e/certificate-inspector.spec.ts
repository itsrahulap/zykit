import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

const fixtures = join(dirname(fileURLToPath(import.meta.url)), '../tests/tools/certificate-inspector/fixtures');

function watch(page: Page, baseURL: string | undefined) {
  const origin = new URL(baseURL!).origin;
  const bad: string[] = [];
  page.on('request', (r) => {
    const url = r.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return;
    if (!url.startsWith(`${origin}/`) || r.method() !== 'GET') bad.push(`${r.method()} ${url}`);
  });
  page.on('console', (m) => m.type() === 'error' && bad.push(`console: ${m.text()}`));
  page.on('pageerror', (e) => bad.push(`pageerror: ${e.message}`));
  return bad;
}

test('decodes the sample chain, orders it and verifies signatures', async ({ page, baseURL }) => {
  const bad = watch(page, baseURL);
  await page.goto('/tools/certificate-inspector');
  await expect(page.getByRole('heading', { name: /inspect a certificate/i })).toBeVisible();
  await page.getByRole('button', { name: 'Load sample chain' }).click();
  await expect(page.getByText('Decoded 3 blocks (3 certificates).')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'leaf.example.test' })).toBeVisible();
  await expect(page.getByText('Signature verified')).toHaveCount(3);
  await expect(page.getByText('Self-signed (root)')).toBeVisible();
  await expect(page.getByText('http://ocsp.example.test')).toBeVisible();
  await expect(page.getByText('SHA-256 fingerprint').first()).toBeVisible();
  expect(bad).toEqual([]);
});

test('opens a DER file and warns about private keys without showing them', async ({ page, baseURL }) => {
  const bad = watch(page, baseURL);
  await page.goto('/tools/certificate-inspector');
  await page.getByTestId('file-input').setInputFiles(join(fixtures, 'rsa-selfsigned.der'));
  await expect(page.getByRole('heading', { name: 'rsa.example.test' })).toBeVisible();
  await expect(page.getByText('IP: 2001:db8::1')).toBeVisible();
  await expect(page.getByText('8E:79:40:14:18:EE:CC:6A:C4:FC:2F:6C:CD:00:17:50:0C:18:0A:33:7C:3A:29:0D:8D:DB:01:B8:E3:18:BC:4C')).toBeVisible();

  const key = readFileSync(join(fixtures, 'rsa-private-pkcs1.pem'), 'utf8');
  await page.getByRole('textbox', { name: /PEM input/ }).fill(key);
  await expect(page.getByRole('alert')).toContainText('private key');
  await expect(page.getByText('RSA 2048-bit')).toBeVisible();
  const bodyLine = key.split('\n')[1];
  await expect(page.getByRole('region', { name: 'Block 1' })).toContainText('PKCS#1 RSA');
  await expect(page.getByRole('region', { name: 'Block 1' })).not.toContainText(bodyLine.slice(0, 20));
  expect(bad).toEqual([]);
});

test('no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/certificate-inspector');
  await page.getByRole('button', { name: 'Load sample chain' }).click();
  await expect(page.getByText('Signature verified').first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
