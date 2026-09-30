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

test('TOTP Generator computes RFC 6238 codes, verifies them and reads otpauth URIs', async ({ page }) => {
  const { offOrigin, errors } = watch(page);
  await page.clock.setFixedTime(new Date(59_000));
  await page.goto('/tools/totp-generator');
  await expect(page).toHaveTitle(/TOTP Generator/);
  await expect(page.getByText('Secrets stay in this tab.')).toBeVisible();

  const secret = page.getByLabel('Secret (Base32) or otpauth:// URI');
  await secret.fill('gezd gnbv gy3t qojq gezd gnbv gy3t qojq');
  await page.getByRole('group', { name: 'Digits' }).getByRole('button', { name: '8 digits' }).click();
  await expect(page.getByTestId('current-code')).toHaveText('9428 7082');

  await page.getByLabel('Code to check').fill('94287082');
  await expect(page.getByText('Valid: matches the current time step.')).toBeVisible();
  await page.getByLabel('Code to check').fill('12345678');
  await expect(page.getByText(/No match within ±1 step/)).toBeVisible();

  await secret.fill('otpauth://hotp/ACME:alice@example.com?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&issuer=ACME&counter=1&digits=6');
  await expect(page.getByTestId('current-code')).toHaveText('287 082');
  await expect(page.getByLabel('Issuer')).toHaveValue('ACME');
  await page.getByRole('button', { name: 'Next counter' }).click();
  await expect(page.getByTestId('current-code')).toHaveText('359 152');
  await expect(page.getByText('otpauth://hotp/ACME:alice%40example.com?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&issuer=ACME&algorithm=SHA1&digits=6&counter=2')).toBeVisible();

  await page.getByRole('button', { name: 'New secret' }).click();
  await expect(secret).toHaveValue(/^[A-Z2-7]{32}$/);
  // Secrets are never put in the URL.
  expect(page.url()).not.toContain('#');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('TOTP Generator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/totp-generator');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByTestId('current-code')).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
