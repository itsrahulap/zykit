import { expect, test } from '@playwright/test';

test('Dockerfile Generator builds and validates locally', async ({ page }) => {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  const offOrigin: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) || r.method() !== 'GET') offOrigin.push(`${r.method()} ${r.url()}`);
  });
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/tools/dockerfile-generator');
  await expect(page).toHaveTitle(/Dockerfile Generator/);
  const out = page.getByRole('region', { name: 'Output' }).locator('pre');
  await expect(out).toContainText('FROM node:22-alpine AS build');
  await expect(out).toContainText('CMD ["node", "dist/server.js"]');

  await page.getByRole('group', { name: 'Package manager' }).getByRole('button', { name: 'pnpm' }).click();
  await expect(out).toContainText('pnpm install --frozen-lockfile');

  await page.getByRole('combobox', { name: 'Stack' }).click();
  await page.getByRole('option', { name: 'React / Vite SPA' }).click();
  await expect(out).toContainText('try_files $uri $uri/ /index.html;');
  await expect(page.getByRole('region', { name: '.dockerignore', exact: true })).toContainText('node_modules');

  await page.getByLabel('Port').fill('99999');
  await expect(page.getByText('A port from 1 to 65535.')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Output' })).toHaveCount(0);

  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
});

test('Dockerfile Generator has no sideways scrolling on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/tools/dockerfile-generator');
  const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
  expect(sw).toBeLessThanOrEqual(vw);
});
