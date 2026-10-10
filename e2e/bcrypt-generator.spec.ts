import { expect, test } from '@playwright/test';

test('Bcrypt Generator hashes and verifies locally', async ({ page }) => {
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

  await page.goto('/tools/bcrypt-generator');
  await expect(page).toHaveTitle(/Bcrypt Generator/);
  await page.getByLabel('Password', { exact: true }).fill('hunter2');
  await page.getByRole('button', { name: 'Generate hash' }).click();
  const out = page.locator('pre', { hasText: /^\$2b\$10\$/ });
  await expect(out).toBeVisible({ timeout: 30_000 });
  const hash = (await out.innerText()).trim();
  expect(hash).toMatch(/^\$2b\$10\$[./A-Za-z0-9]{53}$/);

  await page.getByRole('group', { name: 'Mode' }).getByRole('button', { name: 'Verify' }).click();
  await page.getByLabel('Existing hash').fill(hash);
  await page.getByRole('button', { name: 'Verify', exact: true }).last().click();
  await expect(page.getByRole('status').filter({ hasText: 'Match' })).toBeVisible({ timeout: 30_000 });
  await page.getByLabel('Password', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: 'Verify', exact: true }).last().click();
  await expect(page.getByText('No match.')).toBeVisible({ timeout: 30_000 });

  await page.getByLabel('Password', { exact: true }).fill('x'.repeat(80));
  await expect(page.getByRole('alert')).toContainText('72 bytes');
  expect(bad).toEqual([]);
  expect(errors).toEqual([]);
});

test('Bcrypt Generator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/bcrypt-generator');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
