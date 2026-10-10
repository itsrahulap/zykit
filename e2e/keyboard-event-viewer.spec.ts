import { expect, test } from '@playwright/test';

test('Keyboard Event Viewer shows keys, modifiers and history', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const bad: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    const u = r.url();
    if (u.startsWith('blob:') || u.startsWith('data:')) return;
    if (!u.startsWith(origin) || r.method() !== 'GET') bad.push(`${r.method()} ${u}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/keyboard-event-viewer');
  await expect(page).toHaveTitle(/Keyboard Event Viewer/);
  await page.getByRole('group', { name: /Key capture area/ }).focus();
  await page.keyboard.press('a');
  const latest = page.getByRole('region', { name: 'Latest event' });
  await expect(latest).toContainText('KeyA');
  await page.keyboard.press('Shift+ArrowLeft');
  await expect(latest).toContainText('ShiftLeft'); // last event is the Shift keyup
  const rows = page.getByRole('region', { name: 'History' }).locator('tbody tr');
  await expect(rows.filter({ hasText: 'ArrowLeft' }).filter({ hasText: 'Shift' })).toHaveCount(2); // keydown and keyup both carry Shift
  await expect(rows).toHaveCount(6); // keydown+keyup for a, then Shift down, ArrowLeft down/up, Shift up
  await expect(page.locator('p[aria-live=polite]')).toBeAttached();

  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(rows).toHaveCount(0);
  await page.getByLabel('Capture keys anywhere on the page').check();
  await page.locator('h1').click();
  await page.keyboard.press('F2');
  await expect(rows.first()).toContainText('F2');

  expect(bad).toEqual([]);
  expect(errors).toEqual([]);
});

test('Keyboard Event Viewer has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/keyboard-event-viewer');
  await page.getByRole('group', { name: /Key capture area/ }).focus();
  await page.keyboard.press('Control+Shift+a');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
