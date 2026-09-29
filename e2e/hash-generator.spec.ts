import { expect, test } from '@playwright/test';

test('hashes text, switches format and computes HMACs', async ({ page }) => {
  const offOrigin: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://localhost:4173') || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });

  await page.goto('/tools/hash-generator');
  await expect(page.getByRole('heading', { name: /every input has a fingerprint/i })).toBeVisible();

  await page.getByRole('textbox', { name: /text to hash/i }).fill('abc');
  await expect(page.getByLabel('MD5 value')).toHaveText('900150983cd24fb0d6963f7d28e17f72');
  await expect(page.getByLabel('SHA-256 value')).toHaveText('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');

  await page.getByRole('button', { name: 'HEX', exact: true }).click();
  await expect(page.getByLabel('MD5 value')).toHaveText('900150983CD24FB0D6963F7D28E17F72');
  await page.getByRole('button', { name: 'Base64', exact: true }).click();
  await expect(page.getByLabel('MD5 value')).toHaveText('kAFQmDzST7DWlj99KOF/cg==');
  await page.getByRole('button', { name: 'hex', exact: true }).click();

  // RFC 4231 test case 2
  await page.getByRole('textbox', { name: /text to hash/i }).fill('what do ya want for nothing?');
  await page.getByLabel(/HMAC mode/).check();
  await expect(page.getByText(/Enter an HMAC key/)).toBeVisible();
  await page.getByLabel('HMAC key').fill('Jefe');
  await expect(page.getByLabel('HMAC-SHA-256 value')).toHaveText('5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843');
  await expect(page.getByLabel('MD5 value')).toHaveCount(0);

  expect(offOrigin).toEqual([]);
});

test('hashes a file', async ({ page }) => {
  await page.goto('/tools/hash-generator');
  await page.getByRole('button', { name: 'File', exact: true }).click();
  await page.getByLabel('File to hash').setInputFiles({ name: 'abc.txt', mimeType: 'text/plain', buffer: Buffer.from('abc') });
  await expect(page.getByLabel('SHA-1 value')).toHaveText('a9993e364706816aba3e25717850c26c9cd0d89d');
  await expect(page.getByText(/abc\.txt/).first()).toBeVisible();
});
