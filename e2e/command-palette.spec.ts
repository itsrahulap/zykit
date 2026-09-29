import { expect, test, type Page } from '@playwright/test';

const palette = (page: Page) => page.getByRole('dialog', { name: 'Search Zykit' });

test.describe('Command palette', () => {
  test('Ctrl+K on the home page finds a tool and Enter opens it', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.keyboard.press('Control+k');
    const dialog = palette(page);
    await expect(dialog).toBeVisible();
    const input = dialog.getByRole('combobox');
    await expect(input).toBeFocused();

    await input.fill('json formatter');
    const tools = dialog.getByRole('group', { name: 'Tools' });
    await expect(tools.getByRole('option').first()).toContainText('JSON Formatter');
    // Tools come first, so the first tool is the active option.
    await expect(dialog.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
    await input.press('Enter');
    await expect(page).toHaveURL(/\/tools\/json-formatter$/);
    await expect(dialog).toBeHidden();
  });

  test('Ctrl+K on a tool page finds a lesson', async ({ page }) => {
    await page.goto('/tools/uuid-generator');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.keyboard.press('Control+k');
    const input = palette(page).getByRole('combobox');
    await input.fill('closures');
    const lesson = palette(page).getByRole('group', { name: 'Learn' }).getByRole('option', { name: /Closures/ }).first();
    await expect(lesson).toContainText('Topic · JavaScript');
    await lesson.click();
    await expect(page).toHaveURL(/\/learn\/javascript\/closures$/);
    await expect(palette(page)).toBeHidden();
  });

  test('Escape closes it on a Learn page and focus returns', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/learn/javascript');
    const trigger = page.getByRole('navigation', { name: 'Learn' }).getByRole('link').first();
    await trigger.focus();
    await page.keyboard.press('Control+k');
    await expect(palette(page)).toBeVisible();
    await expect(palette(page).getByRole('combobox')).toBeFocused();
    // Focus is trapped inside the dialog.
    await page.keyboard.press('Shift+Tab');
    expect(await palette(page).evaluate((d) => d.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(palette(page)).toBeHidden();
    await expect(trigger).toBeFocused();
    // Only one palette, whichever shortcut handler fires.
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog')).toHaveCount(1);
  });

  test('header button opens it; actions toggle the theme; header fits at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const button = page.getByRole('banner').getByRole('button', { name: 'Search' });
    await expect(button).toBeVisible();
    await button.click();
    const input = palette(page).getByRole('combobox');
    await expect(input).toBeFocused();
    await expect(palette(page).getByRole('group', { name: 'Actions' })).toBeVisible();
    await input.fill('dark mode');
    await palette(page).getByRole('group', { name: 'Actions' }).getByRole('option', { name: /Switch to dark mode/ }).click();
    await expect(palette(page)).toBeHidden();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
    await expect(button).toBeFocused();
  });
});
