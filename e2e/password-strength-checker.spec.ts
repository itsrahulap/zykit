import { expect, test, type Page } from '@playwright/test';

function watch(page: Page, baseURL: string | undefined) {
  const origin = new URL(baseURL!).origin;
  const bad: string[] = [];
  page.on('request', (r) => {
    const url = r.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return;
    if (!url.startsWith(`${origin}/`) || r.method() !== 'GET') bad.push(`${r.method()} ${url}`);
  });
  page.on('console', (m) => m.type() === 'error' && bad.push(`console: ${m.text()}`));
  page.on('pageerror', (e) => bad.push(`pageerror: ${e.message}`));
  return bad;
}

test('rates passwords locally, masks input and uses own words', async ({ page, baseURL }) => {
  const bad = watch(page, baseURL);
  await page.goto('/tools/password-strength-checker');
  await expect(page).toHaveTitle(/Password Strength Checker/);
  const input = page.getByLabel('Password to check');
  await expect(input).toHaveAttribute('type', 'password');
  await input.fill('password');
  const result = page.locator('section[aria-label="Result"]');
  await expect(result).toContainText('Very weak');
  await expect(result).toContainText('top-10 common password');
  await expect(result).toContainText('Offline, fast hash');
  await page.getByRole('button', { name: 'Show' }).click();
  await expect(input).toHaveAttribute('type', 'text');

  await input.fill('x8$Qm!vL2#pZr9Tw');
  await expect(result).toContainText('Very strong');

  await input.fill('zebrafish2013');
  await expect(result).not.toContainText('own words');
  await page.getByLabel('Check against your own words (optional)').fill('zebrafish');
  await expect(result).toContainText('your own words');
  expect(bad).toEqual([]);
});

test('Password Strength Checker has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/password-strength-checker');
  await page.getByLabel('Password to check').fill('correct-horse-battery-staple-9999999999');
  await expect(page.locator('section[aria-label="Result"]')).toContainText('Time to crack');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
