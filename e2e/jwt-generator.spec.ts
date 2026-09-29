import { expect, test, type Page } from '@playwright/test';

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


test('signs HS256 by default and hands an ES256 token to the decoder', async ({ page, baseURL }) => {
  const bad = watch(page, baseURL);
  await page.goto('/tools/jwt-generator');
  await expect(page.getByRole('heading', { name: /sign a test token/i })).toBeVisible();
  await expect(page.getByText(/Signed HS256 token/)).toBeVisible();

  await page.getByRole('combobox', { name: 'Algorithm' }).click();
  await page.getByRole('option', { name: /^ES256/ }).click();
  await expect(page.getByText(/Paste a private key/)).toBeVisible();
  await page.getByRole('button', { name: 'Generate P-256 key pair' }).click();
  await expect(page.getByText(/Signed ES256 token/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Public key (PEM)' })).toBeVisible();
  const publicPem = await page.locator('pre', { hasText: 'BEGIN PUBLIC KEY' }).innerText();

  await page.getByRole('button', { name: 'Random jti' }).click();
  await expect(page.getByRole('textbox', { name: 'Payload' })).toHaveValue(/"jti"/);

  await page.getByRole('link', { name: 'Open in JWT Decoder' }).click();
  await expect(page).toHaveURL(/\/tools\/jwt-decoder$/);
  await expect(page.getByText(/Decoded ES256 token/)).toBeVisible();
  await page.getByLabel(/Public key \(ES256\)/).fill(publicPem);
  await expect(page.getByText('Signature verified')).toBeVisible();
  expect(bad).toEqual([]);
});

test('explains invalid JSON and bad keys', async ({ page }) => {
  await page.goto('/tools/jwt-generator');
  await page.getByRole('textbox', { name: 'Payload' }).fill('{ nope');
  await expect(page.getByText(/Payload is not valid JSON/)).toBeVisible();
  await page.getByRole('textbox', { name: 'Payload' }).fill('{}');
  await page.getByRole('combobox', { name: 'Algorithm' }).click();
  await page.getByRole('option', { name: /^RS256/ }).click();
  await page.getByRole('textbox', { name: /Private key/ }).fill('-----BEGIN RSA PRIVATE KEY-----\nAAAA\n-----END RSA PRIVATE KEY-----');
  await expect(page.getByText(/Convert it to PKCS#8/)).toBeVisible();
});

test('no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/jwt-generator');
  await expect(page.getByText(/Signed HS256 token/)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
