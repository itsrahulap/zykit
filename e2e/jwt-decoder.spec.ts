import { expect, test } from '@playwright/test';

test('decodes the example token and verifies its signature', async ({ page }) => {
  const offOrigin: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(new URL(test.info().project.use.baseURL!).origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });

  await page.goto('/tools/jwt-decoder');
  await expect(page.getByRole('heading', { name: /look inside your token/i })).toBeVisible();

  await page.getByRole('button', { name: 'Load example' }).click();
  await expect(page.getByRole('heading', { name: 'Header' })).toBeVisible();
  await expect(page.getByText('"Ada Lovelace"')).toBeVisible();
  await expect(page.getByText('Valid', { exact: true })).toBeVisible();

  const secret = page.getByLabel(/Secret \(HS256\)/);
  await secret.fill('wrong');
  await expect(page.getByText('Invalid signature')).toBeVisible();
  await secret.fill('your-256-bit-secret');
  await expect(page.getByText('Signature verified')).toBeVisible();

  expect(offOrigin).toEqual([]);
});

test('explains malformed and encrypted tokens', async ({ page }) => {
  await page.goto('/tools/jwt-decoder');
  const input = page.getByRole('textbox', { name: /encoded token/i });

  await input.fill('abc.def');
  await expect(page.getByText(/three segments/)).toBeVisible();
  await input.fill('a.b.c.d.e');
  await expect(page.getByText(/encrypted token/)).toBeVisible();
  await input.fill('eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0.');
  await expect(page.getByText(/This token is unsigned/).first()).toBeVisible();
});

test('long tokens wrap on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/tools/jwt-decoder');
  await page.getByRole('button', { name: 'Load example' }).click();
  await expect(page.getByRole('list', { name: 'Colour legend' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
