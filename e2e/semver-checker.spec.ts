import { expect, test } from '@playwright/test';

test('Semver Checker explains ranges and checks versions', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/semver-checker');
  await expect(page).toHaveTitle(/Semver Checker/);
  await page.getByRole('textbox', { name: 'Range' }).fill('^1.2');
  await expect(page.getByRole('list', { name: 'Range bounds' })).toHaveText('>=1.2.0 <2.0.0-0');

  await page.getByRole('textbox', { name: 'Versions' }).fill('1.1.0\n1.4.0\n2.0.0\n1.5.0-beta.1');
  await expect(page.getByText('1 of 4 versions satisfy ^1.2')).toBeVisible();
  const results = page.getByRole('region', { name: 'Check results' });
  await expect(results).toContainText('2.0.0 is not <2.0.0-0');
  await expect(results).toContainText('is a prerelease');

  await page.getByLabel('Include prereleases').check();
  await expect(page.getByText('2 of 4 versions satisfy ^1.2')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Sorted versions' })).toContainText('2.0.0\n1.5.0-beta.1\n1.4.0\n1.1.0');

  await page.getByLabel('Version', { exact: true }).fill('1.2.3');
  await page.getByLabel('Prerelease id').fill('rc');
  const bumps = page.getByRole('list', { name: 'Bumped versions' });
  await expect(bumps).toContainText('2.0.0');
  await expect(bumps).toContainText('1.2.4-rc.0');

  await page.getByRole('textbox', { name: 'Range' }).fill('>=nope');
  await expect(page.getByText(/^Invalid range:/)).toBeVisible();

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Semver Checker has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/semver-checker');
  await page.getByRole('button', { name: 'Try an example' }).click();
  await expect(page.getByRole('region', { name: 'Check results' })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
