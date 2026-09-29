import { expect, test } from '@playwright/test';

test('the header opens the blog, which lists the Claude Code plugins series', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Blog' }).click();
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page).toHaveTitle(/^Blog: .+ · Zykit$/);
  await expect(page.getByRole('heading', { level: 2, name: 'Claude Code plugins' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Claude Code plugins explained/ }).first()).toBeVisible();
});

test('a series post shows its sections, series contents and next post', async ({ page }) => {
  await page.goto('/blog');
  await page.getByRole('link', { name: /Claude Code plugins explained/ }).first().click();
  await expect(page).toHaveURL(/\/blog\/claude-code-plugins-explained$/);
  await expect(page).toHaveTitle(/^Claude Code plugins explained: .+ · Zykit$/);
  for (const heading of ['What is a plugin?', 'The five building blocks', 'From GitHub to your session', 'Do you need to say anything special?']) {
    await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible();
  }
  const series = page.getByRole('navigation', { name: 'Series' });
  await expect(series.getByRole('listitem')).toHaveCount(9);

  await page.getByRole('navigation', { name: 'Previous and next posts' }).getByRole('link', { name: /Next/ }).click();
  await expect(page).toHaveURL(/\/blog\/install-and-manage-claude-code-plugins$/);
});

test('a plugin post has install commands for the chat and a shell', async ({ page }) => {
  await page.goto('/blog/context7-claude-code-plugin');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('context7');
  for (const heading of ['How it works', 'Install', 'How to use it', 'Good use cases', 'When not to use it', 'How we use it on Zykit']) {
    await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible();
  }
  const install = page.getByRole('region', { name: 'Install' });
  await expect(install.locator('pre')).toHaveText('/plugin marketplace add anthropics/claude-plugins-official\n/plugin install context7@claude-plugins-official');
  await install.getByRole('button', { name: 'In a shell' }).click();
  await expect(install.locator('pre')).toHaveText('claude plugin marketplace add anthropics/claude-plugins-official\nclaude plugin install context7@claude-plugins-official');
});

test('unknown post URLs show a not-found page', async ({ page }) => {
  await page.goto('/blog/nope');
  await expect(page.getByText('This page doesn’t exist.')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

for (const path of ['/', '/blog', '/blog/claude-code-plugins-explained', '/blog/install-and-manage-claude-code-plugins']) {
  test(`${path} has no horizontal scroll on a small phone`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
