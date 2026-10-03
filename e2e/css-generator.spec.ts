import { expect, test } from '@playwright/test';

test('CSS Generator builds gradients, shadows, clamp and easing locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/css-generator');
  await expect(page).toHaveTitle(/CSS Generator/);
  await expect(page.getByRole('group', { name: 'CSS', exact: true }).first()).toContainText('linear-gradient(135deg, #2f5f4b 0%, #93b7a0 100%)');
  await page.getByRole('button', { name: 'Radial' }).click();
  await expect(page.getByRole('group', { name: 'CSS', exact: true }).first()).toContainText('radial-gradient(circle at 50% 50%');
  await page.getByRole('button', { name: 'Add stop' }).click();
  await expect(page.getByLabel('Stop 3 position')).toBeVisible();

  await page.getByRole('button', { name: 'Box shadow' }).click();
  await page.getByLabel('Layer 1 Y').fill('20');
  await expect(page.getByRole('group', { name: 'CSS', exact: true }).first()).toContainText('0px 20px 25px -5px rgba(0, 0, 0, 0.25)');
  await page.getByRole('button', { name: 'Add layer' }).click();
  await expect(page.getByLabel('Layer 2 blur')).toBeVisible();

  await page.getByRole('button', { name: 'Border radius' }).click();
  await page.getByLabel('Top left vertical').fill('50');
  await expect(page.getByRole('group', { name: 'CSS', exact: true }).first()).toContainText('/');

  await page.getByRole('button', { name: 'clamp()' }).click();
  await expect(page.getByText('clamp(1rem, 0.8333rem + 0.8333vw, 1.5rem)').first()).toBeVisible();
  await expect(page.getByText('slope = (24 - 16) / (1280 - 320)')).toBeVisible();

  await page.getByRole('button', { name: 'Easing' }).click();
  const handle = page.getByRole('slider', { name: 'Control point 1' });
  await handle.focus();
  await page.keyboard.press('ArrowRight');
  await expect(handle).toHaveAttribute('aria-valuetext', 'x 0.26, y 0.1');
  await page.getByRole('button', { name: 'ease-out-expo' }).click();
  await expect(page.getByLabel('Timing function')).toHaveValue('cubic-bezier(0.16, 1, 0.3, 1)');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('CSS Generator pauses the easing preview for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/tools/css-generator');
  await page.getByRole('button', { name: 'Easing' }).click();
  await expect(page.getByText(/paused because your system prefers reduced motion/)).toBeVisible();
});

test('CSS Generator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  for (const tab of ['Gradient', 'Box shadow', 'Text shadow', 'Border radius', 'clamp()', 'Easing']) {
    await page.goto('/tools/css-generator');
    await page.getByRole('button', { name: tab, exact: true }).click();
    const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
    expect(sw, tab).toBeLessThanOrEqual(vw);
  }
});
