import { expect, test, type Page } from '@playwright/test';

function watch(page: Page) {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    const url = r.url();
    const local = url.startsWith(origin) || url.startsWith('blob:') || url.startsWith('data:');
    if (!local || r.method() !== 'GET') offOrigin.push(`${r.method()} ${url}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return { offOrigin, errors };
}

test('Number Base Converter works locally', async ({ page }) => {
  const { offOrigin, errors } = watch(page);
  await page.goto('/tools/number-base-converter');
  await expect(page).toHaveTitle(/Number Base Converter/);
  const input = page.getByLabel('Number', { exact: true });
  await input.fill('0xff');
  await expect(page.getByTestId('out-Binary')).toHaveText('1111 1111');
  await expect(page.getByTestId('out-Decimal')).toHaveText('255');
  await input.fill('123456789012345678901234567890');
  await expect(page.getByTestId('out-Hex')).toHaveText('1 8EE9 0FF6 C373 E0EE 4E3F 0AD2');
  await input.fill('-1');
  await expect(page.getByText('FFFFFFFFFFFFFFFF')).toBeVisible();

  await page.getByLabel('Decimal value').fill('0.1');
  await expect(page.getByTestId('float-exact')).toHaveText('0.1000000000000000055511151231257827021181583404541015625');
  await page.getByRole('group', { name: 'Precision' }).getByRole('button', { name: 'float32' }).click();
  await expect(page.getByTestId('float-exact')).toHaveText('0.100000001490116119384765625');

  await page.getByLabel('A', { exact: true }).fill('0b1100');
  await page.getByLabel('B', { exact: true }).fill('0b1010');
  await expect(page.getByTestId('out-Unsigned')).toHaveText('8');

  await page.getByLabel('Codes → text').fill('72 105');
  await expect(page.getByTestId('codes-text')).toHaveText('Hi');
  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Number Base Converter has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/number-base-converter');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
