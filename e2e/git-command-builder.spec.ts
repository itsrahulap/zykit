import { expect, test } from '@playwright/test';

test('Git Command Builder builds, explains and validates commands locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/git-command-builder');
  await expect(page).toHaveTitle(/Git Command Builder/);
  const out = page.getByRole('region', { name: 'Command' });
  await expect(out.locator('pre')).toHaveText('git status --short --branch');
  await expect(out).toContainText('Read-only');

  await page.getByRole('combobox', { name: 'Task' }).click();
  await page.getByRole('option', { name: 'Commits: Commit changes' }).click();
  await page.getByLabel('Message').fill("Fix user's login");
  await expect(out.locator('pre')).toHaveText(`git commit -m 'Fix user'\\''s login'`);
  await page.getByRole('group', { name: 'Shell' }).getByRole('button', { name: 'PowerShell' }).click();
  await expect(out.locator('pre')).toHaveText("git commit -m 'Fix user''s login'");

  await page.getByRole('combobox', { name: 'Task' }).click();
  await page.getByRole('option', { name: /Reset the branch to a commit/ }).click();
  await expect(out).toContainText('Destructive');
  await expect(out).toContainText('Safer alternatives');
  await page.getByLabel('Reset to').fill('bad name');
  await expect(page.getByText('Use a commit hash')).toBeVisible();
  await expect(out.locator('pre')).toHaveCount(0);

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Git Command Builder has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/git-command-builder');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
