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

test('Unicode Inspector lists code points and flags hidden and look-alike characters', async ({ page }) => {
  const { offOrigin, errors } = watch(page);
  await page.goto('/tools/unicode-inspector');
  await expect(page).toHaveTitle(/Unicode Inspector/);

  const input = page.getByLabel('Text', { exact: true });
  await input.fill('pаypal​‮ é👍🏽');
  await expect(page.getByText(/^11 characters · 12 code points/)).toBeVisible();
  await expect(page.getByText(/Found .*bidirectional control/)).toBeVisible();
  const table = page.getByRole('region', { name: 'Code points' });
  await expect(table.getByText('CYRILLIC SMALL LETTER A')).toBeVisible();
  await expect(table.getByText('RIGHT-TO-LEFT OVERRIDE')).toBeVisible();
  await expect(table.getByText('EMOJI MODIFIER FITZPATRICK TYPE-4')).toBeVisible();
  await expect(page.getByText('mixes Latin + Cyrillic')).toBeVisible();

  await table.getByRole('button', { name: 'Details for U+202E' }).click();
  await expect(page.getByText('U+202E details')).toBeVisible();
  await expect(page.getByText('\\u202E', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Clean the input' }).click();
  await expect(input).toHaveValue('pаypal é👍🏽');
  await page.getByLabel('Replace look-alike letters').check();
  await page.getByRole('button', { name: 'Clean the input' }).click();
  await expect(input).toHaveValue('paypal é👍🏽');
  await expect(page.getByText('No invisible, bidi-control or look-alike characters found.')).toBeVisible();

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Unicode Inspector has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/unicode-inspector');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Code points' })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
