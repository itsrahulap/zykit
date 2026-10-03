import { expect, test } from '@playwright/test';

test('Kubernetes YAML Checker works locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/kubernetes-yaml-checker');
  await expect(page).toHaveTitle(/Kubernetes YAML Checker/);
  await page.getByRole('button', { name: 'Example' }).click();
  await expect(page.getByRole('region', { name: 'Resource table' })).toContainText('CronJob');
  await expect(page.getByText(/uses the :latest tag/).first()).toBeVisible();
  await expect(page.getByText(/at 02:30|2:30/).first()).toBeVisible();
  await page.getByRole('button', { name: /^Errors/ }).click();
  await expect(page.getByText('Selector does not match')).toHaveCount(0);
  await expect(page.getByText(/no port|is not in this paste/).first()).toBeVisible();

  await page.getByLabel('Kubernetes YAML').fill('apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: ok\ndata:\n  a: b\n');
  await expect(page.getByText('No problems found.')).toBeVisible();

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Kubernetes YAML Checker has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/kubernetes-yaml-checker');
  await page.getByRole('button', { name: 'Example' }).click();
  await expect(page.getByRole('region', { name: 'Resource table' })).toBeVisible();
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
