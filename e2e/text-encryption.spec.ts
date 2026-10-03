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

test('encrypts and decrypts text, and reports a wrong passphrase', async ({ page, baseURL }) => {
  const bad = watch(page, baseURL);
  await page.goto('/tools/text-encryption');
  await expect(page).toHaveTitle(/Encrypt \/ Decrypt Text/);
  const input = page.locator('section[aria-label="Input"]');
  await page.getByLabel('Passphrase', { exact: true }).fill('correct horse battery staple');
  await expect(page.getByText(/~\d+ bits/)).toBeVisible();
  await page.getByLabel('Text to encrypt').fill('hello secret 🌍');
  await input.getByRole('button', { name: 'Encrypt', exact: true }).click();
  const out = page.locator('pre', { hasText: 'zykit:v1:' });
  await expect(out).toBeVisible({ timeout: 20_000 });
  const cipher = await out.innerText();

  await page.getByRole('group', { name: 'Mode' }).getByRole('button', { name: 'Decrypt' }).click();
  await page.getByLabel('Encrypted text').fill(cipher);
  await input.getByRole('button', { name: 'Decrypt', exact: true }).click();
  await expect(page.locator('pre', { hasText: 'hello secret 🌍' })).toBeVisible({ timeout: 20_000 });

  await page.getByLabel('Passphrase', { exact: true }).fill('wrong one');
  await input.getByRole('button', { name: 'Decrypt', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Wrong passphrase', { timeout: 20_000 });
  await page.getByLabel('Encrypted text').fill('not encrypted');
  await input.getByRole('button', { name: 'Decrypt', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Unknown format');
  expect(bad).toEqual([]);
});

test('encrypts a file to .zyk', async ({ page, baseURL }) => {
  const bad = watch(page, baseURL);
  await page.goto('/tools/text-encryption');
  await page.getByRole('group', { name: 'Input type' }).getByRole('button', { name: 'File' }).click();
  await page.getByLabel('Passphrase', { exact: true }).fill('a long file passphrase');
  await page.locator('input[type=file]').setInputFiles({ name: 'note.txt', mimeType: 'text/plain', buffer: Buffer.from('file body') });
  await expect(page.getByText('note.txt (')).toBeVisible();
  await page.locator('section[aria-label="Input"]').getByRole('button', { name: 'Encrypt', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .zyk' }).click({ timeout: 20_000 });
  expect((await download).suggestedFilename()).toBe('note.txt.zyk');
  expect(bad).toEqual([]);
});

test('has no sideways scrolling on a phone', async ({ page }) => {
  await noSideScroll(page, '/tools/text-encryption');
});
