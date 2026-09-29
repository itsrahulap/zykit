import { expect, test } from '@playwright/test';

test('explains an expression, lists next runs and edits via the builder', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));

  await page.goto('/tools/cron-builder');
  await expect(page).toHaveTitle(/^Cron Expression Builder: .+ · Zykit$/);
  const origin = new URL(page.url()).origin;

  const input = page.getByLabel('Cron expression');
  const description = page.getByTestId('cron-description');
  await expect(description).toHaveText('At 09:30 on Monday through Friday');

  // Time zone + next runs.
  await page.getByRole('combobox', { name: 'Time zone', exact: true }).click();
  await page.getByRole('option', { name: 'Asia/Tokyo', exact: true }).click();
  const runs = page.getByRole('region', { name: 'Next runs' }).locator('ol li');
  await expect(runs).toHaveCount(10);
  await expect(runs.first()).toContainText(/^1(Mon|Tue|Wed|Thu|Fri) \d{4}-\d{2}-\d{2} 09:30 GMT\+9$/);

  // Builder: day-of-week → Every.
  const builder = page.getByRole('region', { name: 'Builder' });
  await builder.getByRole('group', { name: 'Field' }).getByRole('button', { name: 'Day of week' }).click();
  await builder.getByRole('group', { name: 'Day of week mode' }).getByRole('button', { name: 'Every' }).click();
  await expect(input).toHaveValue('30 9 * * *');
  await expect(description).toHaveText('At 09:30');

  // Builder: minute → step every 15.
  await builder.getByRole('group', { name: 'Field' }).getByRole('button', { name: 'Minute' }).click();
  await builder.getByRole('group', { name: 'Minute mode' }).getByRole('button', { name: 'Specific' }).click();
  await builder.getByRole('group', { name: 'Minute values' }).getByRole('button', { name: '45', exact: true }).click();
  await expect(input).toHaveValue('30,45 9 * * *');
  await expect(description).toHaveText('At minutes 30 and 45 past hour 9');

  // Seconds toggle.
  await page.getByLabel('Include seconds (6 fields)').check();
  await expect(input).toHaveValue('0 30,45 9 * * *');
  await page.getByLabel('Include seconds (6 fields)').uncheck();

  // Presets and copy.
  await page.getByRole('combobox', { name: 'Presets' }).click();
  await page.getByRole('option', { name: 'Last day of the month' }).click();
  await expect(input).toHaveValue('0 0 L * *');
  await expect(description).toHaveText('At 00:00 on the last day of the month');
  await page.getByRole('region', { name: 'Expression' }).getByRole('button', { name: 'Copy' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('0 0 L * *');

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('blob:') || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('shows per-field errors, macros and impossible schedules', async ({ page }) => {
  await page.goto('/tools/cron-builder');
  const input = page.getByLabel('Cron expression');
  await input.fill('61 * * * MON-FOO');
  await expect(page.getByRole('alert')).toContainText('Minute: 61 is out of range (0–59)');
  await expect(page.getByRole('alert')).toContainText('Day of week:');
  await expect(input).toHaveAttribute('aria-invalid', 'true');

  await input.fill('@weekly');
  await expect(page.getByTestId('cron-description')).toHaveText('At 00:00 on Sunday');
  await input.fill('@reboot');
  await expect(page.getByText('@reboot has no run times.')).toBeVisible();
  await input.fill('0 0 30 2 *');
  await expect(page.getByText(/No runs in the next 8 years/)).toBeVisible();
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/cron-builder');
  await page.getByRole('region', { name: 'Builder' }).getByRole('group', { name: 'Minute mode' }).getByRole('button', { name: 'Specific' }).click();
  await expect(page.getByRole('region', { name: 'Next runs' }).locator('ol li')).toHaveCount(10);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
