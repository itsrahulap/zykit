import { expect, test, type Page } from '@playwright/test';

// Every test fails on console errors, uncaught exceptions or requests that leave the site.
function watch(page: Page, baseURL: string) {
  const origin = new URL(baseURL).origin;
  const problems: string[] = [];
  page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (!['http:', 'https:'].includes(url.protocol)) return;
    if (url.origin !== origin) problems.push(`off-origin: ${r.url()}`);
  });
  return problems;
}

test.describe('Learn home and shell', () => {
  let problems: string[];
  test.beforeEach(({ page, baseURL }) => {
    problems = watch(page, baseURL!);
  });
  test.afterEach(() => {
    expect(problems).toEqual([]);
  });

  test('lists subjects and opens one', async ({ page }) => {
    await page.goto('/learn');
    await expect(page).toHaveTitle('Learn software engineering · Zykit');
    await expect(page.getByRole('heading', { level: 1, name: /learn once\. understand deeply/i })).toBeVisible();
    await expect(page.getByText(/never start from zero again/i)).toBeVisible();

    const main = page.locator('#main');
    const subjects = main.getByRole('region', { name: 'Subjects' });
    await expect(subjects.getByRole('link')).toHaveCount(9);
    await subjects.getByRole('link', { name: /^JavaScript/ }).click();

    await expect(page).toHaveURL(/\/learn\/javascript$/);
    await expect(page.getByRole('heading', { level: 1, name: 'JavaScript' })).toBeVisible();
    const topics = main.getByRole('region', { name: 'Topics' });
    await expect(topics.getByRole('link', { name: /Closures/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /start learning/i })).toHaveAttribute('href', '/learn/javascript/what-is-javascript');

    // Status filter: nothing is completed yet.
    await page.getByRole('group', { name: 'Filter topics by status' }).getByRole('button', { name: 'Completed' }).click();
    await expect(topics.getByText(/no completed topics/i)).toBeVisible();
  });

  test('desktop sidebar navigates and expands the current subject', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/learn');
    const nav = page.getByRole('navigation', { name: 'Learn' });
    await expect(nav).toBeVisible();
    await expect(page.getByRole('button', { name: 'Browse' })).toBeHidden();

    await nav.getByRole('link', { name: /^TypeScript/ }).click();
    await expect(page).toHaveURL(/\/learn\/typescript$/);
    await expect(nav.getByRole('button', { name: 'Hide TypeScript topics' })).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.getByRole('link', { name: /^TypeScript/ })).toHaveAttribute('aria-current', 'page');

    // Expand another subject by hand and follow a topic link.
    await nav.getByRole('button', { name: 'Show JavaScript topics' }).click();
    await nav.getByRole('link', { name: /Closures/ }).click();
    await expect(page).toHaveURL(/\/learn\/javascript\/closures$/);

    await nav.getByRole('link', { name: 'Progress' }).click();
    await expect(page).toHaveURL(/\/learn\/progress$/);
  });

  test('mobile drawer opens and closes with the keyboard, without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 740 });
    for (const path of ['/learn', '/learn/javascript', '/learn/progress', '/learn/bookmarks']) {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), path).toBe(true);
    }

    await page.goto('/learn');
    const browse = page.getByRole('button', { name: 'Browse' });
    await browse.focus();
    await page.keyboard.press('Enter');
    const drawer = page.getByRole('dialog', { name: 'Browse Learn' });
    await expect(drawer).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close navigation' })).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    // Focus stays inside the drawer.
    await page.keyboard.press('Shift+Tab');
    expect(await drawer.evaluate((d) => d.contains(document.activeElement))).toBe(true);

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(browse).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');

    // Following a link closes it.
    await browse.click();
    await drawer.getByRole('link', { name: /^Databases/ }).click();
    await expect(page).toHaveURL(/\/learn\/databases$/);
    await expect(drawer).toBeHidden();
    await expect(page.getByRole('heading', { level: 1, name: 'Databases' })).toBeVisible();
  });

  test('Ctrl+K search finds a topic and Enter opens it', async ({ page }) => {
    await page.goto('/learn');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Search Zykit' });
    await expect(dialog).toBeVisible();
    const input = dialog.getByRole('combobox');
    await expect(input).toBeFocused();

    // Arrow keys move the active option.
    await input.fill('array');
    await expect(dialog.getByRole('option').nth(1)).toBeVisible();
    await input.press('ArrowDown');
    await expect(dialog.getByRole('option').nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(input).toHaveAttribute('aria-activedescendant', (await dialog.getByRole('option').nth(1).getAttribute('id'))!);
    await input.press('ArrowUp');
    await expect(dialog.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');

    await input.fill('closure');
    const first = dialog.getByRole('group', { name: 'Learn' }).getByRole('option').first();
    await expect(first).toContainText('Closures');
    await expect(first).toContainText('Topic · JavaScript');
    await expect(dialog.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
    await expect(first.locator('mark')).toHaveText('Closure');
    await input.press('Enter');
    await expect(page).toHaveURL(/\/learn\/javascript\/closures$/);
    await expect(dialog).toBeHidden();

    // Escape closes; no results message.
    await page.keyboard.press('Control+k');
    await dialog.getByRole('combobox').fill('zzzzqqq');
    await expect(dialog.getByText(/no results/i)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('progress and bookmarks pages show empty states', async ({ page }) => {
    await page.goto('/learn/progress');
    await expect(page.getByRole('heading', { level: 1, name: 'Your progress' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No progress yet' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');

    await page.goto('/learn/bookmarks');
    await expect(page.getByRole('heading', { name: 'No bookmarks yet' })).toBeVisible();
  });

  test('progress shows saved state and can be reset', async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('zykit-learn-progress', JSON.stringify({ 'javascript/variables': 'completed', 'javascript/closures': 'needs-review' }));
      localStorage.setItem('zykit-learn-bookmarks', JSON.stringify([{ subjectId: 'javascript', topicId: 'closures' }]));
    });
    await page.goto('/learn/progress');
    const review = page.getByRole('region', { name: 'Needs review' });
    await expect(review.getByRole('link', { name: /Closures/ })).toBeVisible();

    await page.goto('/learn/bookmarks');
    await expect(page.getByRole('link', { name: /Closures/ })).toBeVisible();
    await page.getByRole('button', { name: 'Remove bookmark: Closures' }).click();
    await expect(page.getByRole('heading', { name: 'No bookmarks yet' })).toBeVisible();

    await page.goto('/learn/progress');
    await page.getByRole('button', { name: 'Reset progress…' }).click();
    await page.getByRole('button', { name: 'Yes, reset' }).click();
    await expect(page.getByRole('heading', { name: 'No progress yet' })).toBeVisible();
  });

  test('unknown subject shows not found', async ({ page }) => {
    await page.goto('/learn/not-a-subject');
    await expect(page.getByRole('heading', { name: /doesn.t exist/i })).toBeVisible();
  });

  test('home page Learn section links to /learn', async ({ page }) => {
    await page.goto('/');
    const section = page.getByRole('region', { name: /learn once/i });
    await expect(section).toContainText(/\d+\s*lessons/);
    await section.getByRole('link', { name: 'Start learning' }).click();
    await expect(page).toHaveURL(/\/learn$/);
    await expect(page.getByRole('heading', { level: 1, name: /learn once/i })).toBeVisible();
  });
});
