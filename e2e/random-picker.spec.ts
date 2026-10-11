import { expect, test } from '@playwright/test';

test('Random Picker works locally', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/random-picker');
  await expect(page).toHaveTitle(/Random Picker/);
  const mode = page.getByRole('group', { name: 'Mode' });
  const lines = page.getByTestId('result').getByRole('listitem');

  // Winners: heavy weight, no repeats.
  await page.getByRole('button', { name: 'Pick', exact: true }).click();
  await expect(page.getByText('Add at least one name')).toBeVisible();
  await page.getByLabel('Names (one per line)').fill('Ana*1000\nBen\nana\nCleo');
  await page.getByLabel('Weights: name*3 is three times as likely').check();
  await page.getByLabel('Remove duplicates (ignores case)').check();
  await expect(page.getByText('3 entries · 1 duplicate removed')).toBeVisible();
  await page.getByRole('spinbutton', { name: 'How many winners' }).fill('3');
  await page.getByRole('button', { name: 'Pick', exact: true }).click();
  await expect(lines).toHaveCount(3);
  expect(new Set(await lines.allTextContents()).size).toBe(3);
  await page.getByRole('button', { name: 'Copy result' }).click();
  expect((await page.evaluate(() => navigator.clipboard.readText())).split('\n')).toHaveLength(3);

  // Teams of 2 from 3 names -> 2 teams.
  await mode.getByRole('button', { name: 'Teams' }).click();
  await page.getByRole('group', { name: 'Split by' }).getByRole('button', { name: 'Team size' }).click();
  await page.getByRole('spinbutton', { name: 'People per team' }).fill('2');
  await page.getByRole('button', { name: 'Make teams' }).click();
  await expect(lines).toHaveCount(2);

  // Coin history.
  await mode.getByRole('button', { name: 'Coin' }).click();
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Flip' }).click();
  await expect(page.getByTestId('coin-stats')).toContainText(/Heads \d+ · Tails \d+/);
  const t = (await page.getByTestId('coin-stats').textContent()) ?? '';
  const [, h, tl] = /Heads (\d+) · Tails (\d+)/.exec(t)!;
  expect(Number(h) + Number(tl)).toBe(4);

  // Dice.
  await mode.getByRole('button', { name: 'Dice' }).click();
  await page.getByRole('button', { name: 'Roll' }).click();
  await expect(page.getByTestId('result')).toContainText(/2d6\+3: \d \+ \d \+ 3 = \d+/);
  await page.getByLabel('Dice (like 2d6+3)').fill('nonsense');
  await page.getByRole('button', { name: 'Roll' }).click();
  await expect(page.getByText('Use dice notation')).toBeVisible();

  // Number.
  await mode.getByRole('button', { name: 'Number' }).click();
  await page.getByRole('spinbutton', { name: 'Minimum' }).fill('7');
  await page.getByRole('spinbutton', { name: 'Maximum' }).fill('7');
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByTestId('result')).toHaveText('7');

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Random Picker has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/random-picker');
  await page.getByLabel('Names (one per line)').fill('A very long name that goes on and on and on and on and on');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
