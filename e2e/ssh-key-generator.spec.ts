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

async function noSideScroll(page: Page, path: string) {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(path);
  await expect(page.locator('h1')).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
}

test('generates a key pair with fingerprints, downloads and an authorized_keys line', async ({ page, baseURL }) => {
  const bad = watch(page, baseURL);
  await page.goto('/tools/ssh-key-generator');
  await expect(page).toHaveTitle(/SSH Key Generator/);
  await expect(page.getByText('Your keys never leave this browser.')).toBeVisible();
  await page.getByLabel('Comment').fill('me@laptop');
  await page.getByRole('button', { name: 'Generate', exact: true }).click();

  const pub = page.locator('pre', { hasText: 'me@laptop' }).first();
  await expect(pub).toHaveText(/^(ssh-ed25519|ecdsa-sha2-nistp256) AAAA[A-Za-z0-9+/=]+ me@laptop$/, { timeout: 20_000 });
  await expect(page.getByText(/^SHA256:[A-Za-z0-9+/]{43}$/)).toBeVisible();
  await expect(page.getByText(/^MD5:([0-9a-f]{2}:){15}[0-9a-f]{2}$/)).toBeVisible();
  await expect(page.locator('pre', { hasText: 'BEGIN OPENSSH PRIVATE KEY' })).toBeVisible();
  await expect(page.getByText(/ssh-keygen -p -f/).first()).toBeVisible();

  await page.getByRole('group', { name: 'Private key format' }).getByRole('button', { name: 'PKCS#8 PEM' }).click();
  await expect(page.locator('pre', { hasText: 'BEGIN PRIVATE KEY' })).toBeVisible();

  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: /^Download id_\w+\.pub$/ }).click();
  expect((await dl).suggestedFilename()).toMatch(/^id_(ed25519|ecdsa)\.pub$/);

  await page.getByLabel('no-pty').check();
  await page.getByLabel('from= (hosts)').fill('10.0.0.0/8');
  await expect(page.getByLabel('authorized_keys line', { exact: true }).locator('pre')).toHaveText(/^from="10\.0\.0\.0\/8",no-pty (ssh-ed25519|ecdsa-sha2-nistp256) /);
  expect(bad).toEqual([]);
});

test('generates RSA 2048', async ({ page, baseURL }) => {
  const bad = watch(page, baseURL);
  await page.goto('/tools/ssh-key-generator');
  await page.getByRole('combobox', { name: 'Key type' }).click();
  await page.getByRole('option', { name: 'RSA 2048' }).click();
  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await expect(page.locator('pre', { hasText: /^ssh-rsa AAAA/ }).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('ssh-rsa (2048 bits)')).toBeVisible();
  expect(bad).toEqual([]);
});

test('has no sideways scrolling on a phone', async ({ page }) => {
  await noSideScroll(page, '/tools/ssh-key-generator');
  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await expect(page.locator('pre', { hasText: 'BEGIN OPENSSH PRIVATE KEY' })).toBeVisible({ timeout: 20_000 });
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
