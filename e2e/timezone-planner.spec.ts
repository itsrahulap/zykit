import { expect, test } from '@playwright/test';

test('Time Zone Meeting Planner works locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/timezone-planner');
  await expect(page).toHaveTitle(/Time Zone Meeting Planner/);
  await page.getByLabel('Date', { exact: false }).first().fill('2023-10-03');

  const cities = page.getByRole('list', { name: 'Cities' });
  await expect(cities).toContainText('New York');
  await expect(cities).toContainText('London');

  await page.getByLabel('Add a city or time zone').fill('Tokyo');
  await page.getByRole('button', { name: /^Add Tokyo/ }).first().click();
  await expect(cities).toContainText('Tokyo');
  await page.getByRole('button', { name: 'Remove Tokyo' }).click();
  await expect(cities).not.toContainText('Tokyo');

  // Make New York the base so the grid is predictable: 10:00 EDT is 15:00 BST.
  await page.getByRole('button', { name: 'Make New York the base' }).click();
  const cell = page.getByRole('button', { name: /^London, Tue 3 15:00, working hours/ });
  await cell.focus();
  await cell.press('Enter');
  const selected = page.getByRole('list', { name: 'Selected time in each city' });
  await expect(selected).toContainText('Tue 3 Oct, 15:00');
  await expect(selected).toContainText('Tue 3 Oct, 10:00');
  await expect(page.getByLabel('Text to share')).toContainText('Tue 3 Oct, 10:00 New York / 15:00 London');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download \.ics/ }).click();
  expect((await download).suggestedFilename()).toBe('meeting.ics');

  // arrow key moves focus to the next slot
  await cell.focus();
  await cell.press('ArrowRight');
  await expect(page.getByRole('button', { name: /^London, Tue 3 16:00/ })).toBeFocused();

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Time Zone Meeting Planner has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/timezone-planner');
  await expect(page.getByRole('region', { name: 'Time grid scroll area' })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
