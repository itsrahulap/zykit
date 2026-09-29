import { expect, test } from '@playwright/test';

test('encodes, swaps and decodes Unicode text locally', async ({ page }) => {
  const offOrigin: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://localhost:4173') || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });

  await page.goto('/tools/encode-decode');
  await expect(page.getByRole('heading', { name: /encode and decode/i })).toBeVisible();

  const input = page.getByRole('textbox', { name: /^Input/ });
  const output = page.getByRole('textbox', { name: /^Output/ });

  await input.fill('héllo 👋');
  await expect(output).toHaveValue('aMOpbGxvIPCfkYs=');

  await page.getByRole('button', { name: /^Swap/ }).click();
  await expect(input).toHaveValue('aMOpbGxvIPCfkYs=');
  await expect(page.getByRole('button', { name: 'Decode', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(output).toHaveValue('héllo 👋');

  await page.getByRole('button', { name: 'Hex', exact: true }).click();
  await input.fill('0x68 0x69');
  await expect(output).toHaveValue('hi');

  await input.fill('abc');
  await expect(page.getByText(/odd number of digits/)).toBeVisible();
  await expect(input).toHaveAttribute('aria-invalid', 'true');

  await page.getByRole('button', { name: 'Base64', exact: true }).click();
  await input.fill('not*base64');
  await expect(page.getByText(/Invalid Base64 character/)).toBeVisible();

  await page.getByRole('button', { name: 'HTML entities', exact: true }).click();
  await input.fill('&lt;b&gt; &amp; &#x1F44B;');
  await expect(output).toHaveValue('<b> & 👋');

  expect(offOrigin).toEqual([]);
});

test('has no horizontal scroll on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/tools/encode-decode');
  await page.getByRole('textbox', { name: /^Input/ }).fill('x'.repeat(2000));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
