import { expect, test } from '@playwright/test';

const PLUGINS = ['superpowers', 'frontend-design', 'context7', 'code-review', 'code-simplifier', 'claude-mem', 'context-mode'];

test('the header opens the Claude Code section, which explains plugins and lists each one', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Claude Code' }).click();
  await expect(page).toHaveURL(/\/claude-code$/);
  await expect(page).toHaveTitle(/^Claude Code plugins: .+ · Zykit$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Built with Claude Code');

  for (const heading of ['What is a plugin?', 'How it works', 'Install', 'How to use them']) {
    await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible();
  }
  for (const name of PLUGINS) {
    await expect(page.getByRole('link', { name: new RegExp(`^${name}`) })).toBeVisible();
  }

  const commands = page.locator('pre');
  await expect(commands).toContainText('/plugin install superpowers@claude-plugins-official');
  await page.getByRole('button', { name: 'In a shell' }).click();
  await expect(commands).toContainText('claude plugin marketplace add mksglu/context-mode');
});

test('a plugin page explains how it works, how to install it and how to use it', async ({ page }) => {
  await page.goto('/claude-code');
  await page.getByRole('link', { name: /^context7/ }).click();
  await expect(page).toHaveURL(/\/claude-code\/context7$/);
  await expect(page).toHaveTitle(/^context7: .+ · Zykit$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('context7');

  for (const heading of ['How it works', 'Install', 'How to use', 'Use cases in this project', 'When not to use it']) {
    await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible();
  }
  await expect(page.locator('pre')).toHaveText(
    '/plugin marketplace add anthropics/claude-plugins-official\n/plugin install context7@claude-plugins-official',
  );

  await page.getByRole('navigation', { name: 'Other plugins' }).getByRole('link', { name: 'code-review' }).click();
  await expect(page).toHaveURL(/\/claude-code\/code-review$/);
  await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Claude Code' }).click();
  await expect(page).toHaveURL(/\/claude-code$/);
});

test('unknown plugin URLs show a not-found page', async ({ page }) => {
  await page.goto('/claude-code/nope');
  await expect(page.getByText('This page doesn’t exist.')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

for (const path of ['/', '/claude-code', '/claude-code/superpowers']) {
  test(`${path} has no horizontal scroll on a phone`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
