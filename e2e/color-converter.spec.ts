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

test('Color Converter works locally', async ({ page }) => {
  const { offOrigin, errors } = watch(page);
  await page.goto('/tools/color-converter');
  await expect(page).toHaveTitle(/Color Converter/);
  const input = page.getByLabel('Colour', { exact: true });
  await input.fill('rgb(255 136 0)');
  await expect(page.locator('[data-format="hex"]')).toHaveText('#ff8800');
  await expect(page.locator('[data-format="hsl"]')).toHaveText('hsl(32 100% 50%)');
  await input.fill('color(display-p3 1 0 0)');
  await expect(page.getByText(/outside the sRGB gamut but inside Display P3/)).toBeVisible();
  await input.fill('blurple');
  await expect(page.getByText(/isn't a colour this tool recognises/).first()).toBeVisible();
  await input.fill('#10b981');

  // Contrast checker with a nearest passing suggestion.
  await page.getByLabel('Text colour', { exact: true }).fill('#777777');
  await page.getByLabel('Background colour', { exact: true }).fill('#ffffff');
  await expect(page.getByTestId('contrast-ratio')).toHaveText('4.47:1');
  await page.getByRole('button', { name: 'Use #767676' }).click();
  await expect(page.getByTestId('contrast-ratio')).toHaveText('4.54:1');

  // Palette swatches set the colour; inline swatch styles must not trip the CSP.
  await page.getByRole('group', { name: 'Harmony' }).getByRole('button', { name: 'Triadic' }).click();
  await page.getByRole('button', { name: /^Use harmony colour #/ }).nth(1).click();
  await expect(page.locator('[data-format="hex"]')).not.toHaveText('#10b981');
  await expect(page.getByText('Deuteranopia').first()).toBeVisible();
  expect(errors.filter((e) => /Content Security Policy/i.test(e))).toEqual([]);
  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Color Converter has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/color-converter');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
