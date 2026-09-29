import { expect, test } from '@playwright/test';

test('home lists the tools and opens one', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Zykit/);
  await expect(page.getByRole('heading', { name: /useful tools that stay on your device/i })).toBeVisible();

  const card = page.getByRole('link', { name: /clean image/i }).first();
  await expect(card).toBeVisible();
  await card.click();

  await expect(page).toHaveURL(/\/tools\/clean-image$/);
  await expect(page).toHaveTitle(/^Clean Image: .+ · Zykit$/);
  await expect(page.getByRole('heading', { name: /see what your images reveal/i })).toBeVisible();

  // Breadcrumb leads back home
  await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'All tools' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('tool URLs work when opened directly', async ({ page }) => {
  await page.goto('/tools/clean-image');
  await expect(page.getByRole('heading', { name: /see what your images reveal/i })).toBeVisible();
});

test('unknown URLs show a not-found page', async ({ page }) => {
  await page.goto('/tools/does-not-exist');
  await expect(page.getByRole('heading', { name: /doesn.t exist/i })).toBeVisible();
  await page.getByRole('link', { name: 'Browse all tools' }).click();
  await expect(page.getByRole('heading', { name: /useful tools/i })).toBeVisible();
});

test('home page does not download the tool code until it is opened', async ({ page }) => {
  const scripts: string[] = [];
  page.on('request', (r) => r.resourceType() === 'script' && scripts.push(r.url()));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /useful tools/i })).toBeVisible();
  expect(scripts.some((u) => /CleanImagePage/.test(u))).toBe(false);
});
