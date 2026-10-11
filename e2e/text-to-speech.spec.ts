import { expect, test } from '@playwright/test';

function track(page: import('@playwright/test').Page) {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return { offOrigin, errors };
}

test('Text to Speech shows its controls and the privacy note', async ({ page }) => {
  const seen = track(page);
  await page.goto('/tools/text-to-speech');
  await expect(page).toHaveTitle(/Text to Speech/);
  await expect(page.getByLabel('Text', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Voice', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Stop' })).toBeDisabled();
  await expect(page.getByText(/may send the text to its vendor/)).toBeVisible();
  expect(seen.offOrigin).toEqual([]);
  expect(seen.errors).toEqual([]);
});

test('Text to Speech explains when speech synthesis is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });
  });
  await page.goto('/tools/text-to-speech');
  await expect(page.getByRole('alert')).toContainText("doesn’t support the Web Speech API");
  await expect(page.getByRole('button', { name: 'Play' })).toBeDisabled();
});

test('Text to Speech has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/text-to-speech');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
