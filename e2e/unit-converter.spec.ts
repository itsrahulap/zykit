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

test('Unit Converter works locally', async ({ page }) => {
  const { offOrigin, errors } = watch(page);
  await page.goto('/tools/unit-converter');
  await expect(page).toHaveTitle(/Unit Converter/);
  await page.getByLabel('Terabyte (TB)').fill('1');
  await expect(page.getByLabel('Gibibyte (GiB)')).toHaveValue('931.3225746');
  await expect(page.getByLabel('Gigabyte (GB)')).toHaveValue('1000');

  await page.getByRole('group', { name: 'Category' }).getByRole('button', { name: 'Temperature' }).click();
  await page.getByLabel('Celsius (°C)').fill('100');
  await expect(page.getByLabel('Fahrenheit (°F)')).toHaveValue('212');
  await page.getByLabel('Fahrenheit (°F)').fill('-40');
  await expect(page.getByLabel('Celsius (°C)')).toHaveValue('-40');

  await page.getByRole('group', { name: 'Category' }).getByRole('button', { name: 'Length' }).click();
  await page.getByLabel('Metre (m)').fill('0.3');
  await expect(page.getByLabel('Centimetre (cm)')).toHaveValue('30');

  await page.getByLabel('Search units').fill('psi');
  await page.getByRole('button', { name: /Pound per square inch/ }).click();
  await page.getByLabel('Pound per square inch (psi)').fill('14.6959');
  await expect(page.getByLabel('Standard atmosphere (atm)')).toHaveValue('0.999996681');

  await page.getByRole('group', { name: 'Category' }).getByRole('button', { name: 'Fuel economy' }).click();
  await page.getByLabel('Litres per 100 km (L/100 km)').fill('5');
  await expect(page.getByLabel('Kilometres per litre (km/L)')).toHaveValue('20');
  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Unit Converter has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/unit-converter');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
