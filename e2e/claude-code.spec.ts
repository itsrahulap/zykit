import { expect, test } from '@playwright/test';

test('the Claude Code page lists every plugin with install commands', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Built with Claude Code' }).click();
  await expect(page).toHaveURL(/\/claude-code$/);
  await expect(page).toHaveTitle(/^Built with Claude Code: .+ · Zykit$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Built with Claude Code');

  for (const name of ['superpowers', 'frontend-design', 'context7', 'code-review', 'code-simplifier', 'claude-mem', 'context-mode']) {
    await expect(page.getByRole('heading', { level: 3, name })).toBeVisible();
  }

  const commands = page.locator('pre');
  await expect(commands).toContainText('/plugin install superpowers@claude-plugins-official');
  await page.getByRole('button', { name: 'In a shell' }).click();
  await expect(commands).toContainText('claude plugin marketplace add mksglu/context-mode');
});

test('has no horizontal scroll on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/claude-code');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
