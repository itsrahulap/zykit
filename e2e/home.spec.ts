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

test('search and category filters narrow the list and sync to the URL', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('searchbox', { name: 'Search tools' });
  const main = page.getByRole('main');

  // Retry until the page has hydrated and the shortcut is wired up.
  await expect(async () => {
    await page.keyboard.press('/');
    await expect(search).toBeFocused({ timeout: 500 });
  }).toPass();
  await search.fill('json');
  await expect(page).toHaveURL(/\?q=json$/);
  await expect(main.getByRole('link', { name: /json formatter/i })).toBeVisible();
  await expect(main.getByRole('link', { name: /clean image/i })).toHaveCount(0);

  await search.fill('zzzz-no-such-tool');
  await expect(page.getByText(/No tools match/)).toBeVisible();
  await page.getByRole('button', { name: 'Show all tools' }).click();
  await expect(search).toHaveValue('');
  await expect(page).toHaveURL(/\/$/);

  const chips = page.getByRole('group', { name: 'Categories' });
  await chips.getByRole('button', { name: /^Text \d+$/ }).click();
  await expect(page).toHaveURL(/\?category=Text$/);
  await expect(main.getByRole('link', { name: /word counter/i })).toBeVisible();
  await expect(main.getByRole('link', { name: /clean image/i })).toHaveCount(0);
  await chips.getByRole('button', { name: /^All \d+$/ }).click();
  await expect(main.getByRole('link', { name: /clean image/i })).toBeVisible();

  // State survives a reload from the URL.
  await page.goto('/?q=slug&category=Text');
  await expect(search).toHaveValue('slug');
  await expect(chips.getByRole('button', { name: /^Text/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(main.getByRole('link', { name: /slug generator/i })).toBeVisible();
  await expect(main.getByRole('link', { name: /case converter/i })).toHaveCount(0);
});

test('home page has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('favorite and recently used tools show above the directory', async ({ page }) => {
  await page.goto('/tools/json-formatter');
  const star = page.getByRole('button', { name: 'Add to favorites' });
  await expect(star).toHaveAttribute('aria-pressed', 'false');
  await star.click();
  await expect(star).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/tools/uuid-generator');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.goto('/');
  await page.reload();
  const favorites = page.getByRole('region', { name: 'Favorites' });
  await expect(favorites.getByRole('link', { name: 'JSON Formatter' })).toBeVisible();
  const recent = page.getByRole('region', { name: 'Recently used' });
  await expect(recent.getByRole('link')).toHaveText(['UUID Generator', 'JSON Formatter']);

  // Hidden while searching.
  await page.getByRole('searchbox', { name: 'Search tools' }).fill('uuid');
  await expect(favorites).toBeHidden();
  await expect(recent).toBeHidden();
  await page.getByRole('searchbox', { name: 'Search tools' }).fill('');

  // Unstar from the home card.
  const cardStar = page.getByRole('button', { name: 'Add to favorites', pressed: true });
  await expect(cardStar).toHaveCount(1);
  await cardStar.click();
  await expect(favorites).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
});

test('tool pages suggest related tools and Learn lessons', async ({ page }) => {
  await page.goto('/tools/sql-formatter');
  const related = page.getByRole('region', { name: 'Related tools' });
  await expect(related.getByRole('link')).not.toHaveCount(0);
  const learn = page.getByRole('region', { name: 'Learn the concept' });
  await expect(learn.getByRole('link', { name: /Joins/ })).toHaveAttribute('href', '/learn/databases/joins');
  await related.getByRole('link', { name: /JSON to SQL/ }).click();
  await expect(page).toHaveURL(/\/tools\/json-to-sql$/);
});
