import { expect, test } from '@playwright/test';

test('Morse Code works locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/morse-code');
  await expect(page).toHaveTitle(/Morse Code/);
  await page.getByLabel('Text', { exact: true }).fill('SOS hi');
  await expect(page.getByLabel('Morse', { exact: true })).toHaveValue('... --- ...   .... ..');
  await page.getByLabel('Morse', { exact: true }).fill('.- / -...');
  await expect(page.getByLabel('Text', { exact: true })).toHaveValue('A B');

  await page.getByRole('button', { name: 'Play' }).click();
  await expect(page.getByTestId('indicator')).toContainText('Playing');
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByTestId('indicator')).toHaveText('Stopped');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Morse Code has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/morse-code');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
