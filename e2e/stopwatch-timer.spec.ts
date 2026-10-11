import { expect, test } from '@playwright/test';

test('Stopwatch & Timer works locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.clock.install();
  await page.goto('/tools/stopwatch-timer');
  await expect(page).toHaveTitle(/Stopwatch & Timer/);

  // Stopwatch: keyboard start, lap, stop, reset.
  const sw = page.getByTestId('stopwatch-time');
  await page.getByRole('heading', { level: 1 }).click();
  await page.keyboard.press('Space');
  await page.clock.runFor(65_000);
  await expect(sw).toContainText('01:05');
  await page.keyboard.press('l');
  await page.clock.runFor(5_000);
  await page.keyboard.press('l');
  await page.keyboard.press('Space');
  const laps = page.getByRole('region', { name: 'Laps' });
  await expect(laps.getByRole('row')).toHaveCount(3);
  await expect(laps).toContainText('fastest');
  await expect(laps).toContainText('slowest');
  await page.clock.runFor(10_000);
  await expect(sw).toContainText('01:10');
  await page.keyboard.press('r');
  await expect(sw).toHaveText('00:00.00');

  // Timer: finishes, announces, updates the tab title while running.
  const mode = page.getByRole('group', { name: 'Mode' });
  await mode.getByRole('button', { name: 'Timer' }).click();
  await page.getByLabel('Minutes').fill('0');
  await page.getByLabel('Seconds').fill('3');
  await page.getByRole('button', { name: 'Start timer' }).click();
  await page.clock.runFor(1_000);
  await expect(page).toHaveTitle(/^00:0[12] · /);
  await page.clock.runFor(3_000);
  await expect(page.getByTestId('timer-time')).toHaveText('00:00');
  await expect(page.getByText('Finished', { exact: true })).toBeVisible();
  await expect(page.getByText('Timer 1 finished.')).toBeVisible();
  await expect(page).toHaveTitle(/Stopwatch & Timer/);

  // Pomodoro: one focus session moves on to a short break.
  await mode.getByRole('button', { name: 'Pomodoro' }).click();
  await page.getByLabel('Focus (min)').fill('1');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.clock.runFor(61_000);
  await expect(page.getByTestId('pomodoro-phase')).toHaveText('Short break');
  await expect(page.getByTestId('pomodoro-sessions')).toContainText('1');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Stopwatch & Timer has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/stopwatch-timer');
  for (const name of ['Stopwatch', 'Timer', 'Pomodoro']) {
    await page.getByRole('group', { name: 'Mode' }).getByRole('button', { name }).click();
    const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
    expect(sw).toBeLessThanOrEqual(vw);
  }
});
