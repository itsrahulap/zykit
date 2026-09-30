import { expect, test, type Page } from '@playwright/test';

/** Fails the test on console errors and on any request that leaves the site's origin. */
function watch(page: Page, baseURL: string | undefined) {
  const origin = new URL(baseURL ?? 'http://localhost:4173').origin;
  const problems: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (!['data:', 'blob:'].includes(url.protocol) && url.origin !== origin) problems.push(`off-origin: ${r.method()} ${r.url()}`);
  });
  return problems;
}

const noPageScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
/** Nothing in <main> sticks out past the viewport, except inside its own scroll box. */
const mainFits = (page: Page) =>
  page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    return [...document.querySelectorAll('main *')].every((el) => {
      if (el.getBoundingClientRect().right <= w + 0.5) return true;
      for (let p = el.parentElement; p; p = p.parentElement) if (/(auto|scroll)/.test(getComputedStyle(p).overflowX)) return true;
      return false;
    });
  });

test('problems home lists every category with progress', async ({ page, baseURL }) => {
  const problems = watch(page, baseURL);
  await page.goto('/learn/problems');
  await expect(page.getByRole('heading', { level: 1, name: /practice problems, by pattern/i })).toBeVisible();
  await expect(page).toHaveTitle(/DSA practice problems/);
  await expect(page.getByRole('progressbar', { name: 'Problems solved' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Arrays & Hashing/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Bit Manipulation/ })).toBeVisible();
  await page.getByRole('link', { name: /Two Pointers/ }).click();
  await expect(page).toHaveURL(/\/learn\/problems\/two-pointers$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Two Pointers' })).toBeVisible();
  expect(problems).toEqual([]);
});

test('category filters by difficulty and solved state', async ({ page, baseURL }) => {
  const problems = watch(page, baseURL);
  await page.goto('/learn/problems/arrays-hashing');
  const list = page.getByRole('list', { name: 'Arrays & Hashing problems' });
  await expect(list.getByRole('listitem').first()).toBeVisible();
  const total = await list.getByRole('listitem').count();
  expect(total).toBeGreaterThan(3);
  await expect(page.getByRole('link', { name: /Learn the concept|Arrays/ }).first()).toBeVisible();

  const difficulty = page.getByRole('group', { name: 'Difficulty' });
  await difficulty.getByRole('button', { name: 'Easy' }).click();
  await expect(difficulty.getByRole('button', { name: 'Easy' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/difficulty=easy/);
  const easy = await list.getByRole('listitem').count();
  expect(easy).toBeGreaterThan(0);
  expect(easy).toBeLessThan(total);
  for (const row of await list.getByRole('listitem').all()) await expect(row).toContainText('Easy');

  await page.getByRole('group', { name: 'Solved state' }).getByRole('button', { name: 'Solved', exact: true }).click();
  await expect(page.getByText('No problems match these filters.')).toBeVisible();
  await page.getByRole('link', { name: 'Clear filters' }).click();
  await expect(list.getByRole('listitem')).toHaveCount(total);
  expect(problems).toEqual([]);
});

test('problem page: hints, solution tabs and solved state that persists', async ({ page, baseURL }) => {
  const problems = watch(page, baseURL);
  await page.goto('/learn/problems/arrays-hashing/contains-duplicate');
  await expect(page.getByRole('heading', { level: 1, name: 'Contains Duplicate' })).toBeVisible();
  await expect(page).toHaveTitle(/Contains Duplicate/);
  await expect(page.getByText('Example 1')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Constraints' })).toBeVisible();

  // Hints, one at a time.
  const hints = page.getByRole('region', { name: 'Hints' });
  await expect(hints.getByRole('listitem')).toHaveCount(0);
  await hints.getByRole('button', { name: 'Show hint 1 of 3' }).click();
  await expect(hints.getByRole('listitem')).toHaveCount(1);
  await hints.getByRole('button', { name: 'Show hint 2 of 3' }).click();
  await expect(hints.getByRole('listitem')).toHaveCount(2);
  await hints.getByRole('button', { name: 'Show hint 3 of 3' }).click();
  await expect(hints.getByRole('listitem')).toHaveCount(3);
  await expect(hints.getByRole('button', { name: /Show hint/ })).toHaveCount(0);

  // Solution tabs.
  const tablist = page.getByRole('tablist', { name: 'Solution approaches' });
  const tabs = tablist.getByRole('tab');
  await expect(tabs).toHaveCount(3);
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toContainText('Brute Force');
  await tabs.nth(2).click();
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toContainText('Hash Set');
  await expect(page.getByRole('tabpanel')).toContainText('Optimal');
  await tabs.nth(2).press('ArrowLeft');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(1)).toBeFocused();

  // Solved toggle persists across reloads and shows on the category page.
  const solved = page.getByRole('button', { name: 'Solved', exact: true });
  await expect(solved).toHaveAttribute('aria-pressed', 'false');
  await solved.click();
  await expect(solved).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Solved', exact: true })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Arrays & Hashing' }).click();
  const row = page.getByRole('list', { name: 'Arrays & Hashing problems' }).getByRole('listitem').filter({ hasText: 'Contains Duplicate' });
  await expect(row.getByText('Solved', { exact: true })).toBeAttached();
  await expect(page.getByText(/^1 of \d+ solved$/)).toBeVisible();
  await page.getByRole('group', { name: 'Solved state' }).getByRole('button', { name: 'Solved', exact: true }).click();
  await expect(page.getByRole('list', { name: 'Arrays & Hashing problems' }).getByRole('listitem')).toHaveCount(1);

  // Previous / next navigation.
  await page.goto('/learn/problems/arrays-hashing/contains-duplicate');
  const more = page.getByRole('navigation', { name: 'More Arrays & Hashing problems' });
  await more.getByRole('link', { name: /Next/ }).click();
  await expect(page).not.toHaveURL(/contains-duplicate$/);
  await expect(page.getByRole('tablist', { name: 'Solution approaches' }).getByRole('tab').first()).toHaveAttribute('aria-selected', 'true');
  expect(problems).toEqual([]);
});

test('case studies list and a full case study', async ({ page, baseURL }) => {
  const problems = watch(page, baseURL);
  await page.goto('/learn/case-studies');
  await expect(page).toHaveTitle(/System design case studies/);
  await page.getByRole('link', { name: /Design URL Shortener/ }).click();
  await expect(page).toHaveURL(/\/learn\/case-studies\/url-shortener$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Design URL Shortener' })).toBeVisible();
  for (const name of [
    'The problem',
    'Requirements',
    'Capacity estimation',
    'API design',
    'High-level design',
    'Deep dives',
    'Bottlenecks & scaling',
    'Trade-offs',
    'Related concepts',
  ])
    await expect(page.getByRole('heading', { level: 2, name, exact: true })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText('POST', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('figure').first()).toBeVisible();
  // Desktop-wide screens get an "On this page" table of contents.
  await page.setViewportSize({ width: 1440, height: 900 });
  const toc = page.getByRole('navigation', { name: 'On this page' });
  await expect(toc).toBeVisible();
  await toc.getByRole('link', { name: 'Trade-offs' }).click();
  await expect(page).toHaveURL(/#trade-offs$/);
  await page.getByRole('navigation', { name: 'More case studies' }).getByRole('link', { name: /Next/ }).click();
  await expect(page).toHaveURL(/\/learn\/case-studies\/instagram$/);
  expect(problems).toEqual([]);
});

test('case study diagram and table stay inside their boxes on a phone', async ({ page, baseURL }) => {
  const problems = watch(page, baseURL);
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/learn/case-studies/url-shortener');
  await expect(page.getByRole('figure').first()).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'On this page' })).toBeHidden();
  expect(await noPageScroll(page)).toBe(true);
  expect(await mainFits(page)).toBe(true);
  await page.goto('/learn/problems/arrays-hashing/contains-duplicate');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await noPageScroll(page)).toBe(true);
  await page.setViewportSize({ width: 320, height: 800 });
  for (const path of ['/learn/problems', '/learn/problems/arrays-hashing', '/learn/problems/arrays-hashing/contains-duplicate', '/learn/case-studies/uber']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await mainFits(page), path).toBe(true);
  }
  expect(problems).toEqual([]);
});

test('unknown problems and case studies show a 404 state', async ({ page }) => {
  await page.goto('/learn/problems/arrays-hashing/not-a-problem');
  await expect(page.getByRole('heading', { name: /This problem doesn.t exist/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to Arrays & Hashing' })).toBeVisible();
  await page.goto('/learn/problems/not-a-category');
  await expect(page.getByRole('heading', { name: /This problem category doesn.t exist/ })).toBeVisible();
  await page.goto('/learn/problems/not-a-category/two-sum');
  await expect(page.getByRole('heading', { name: /This problem doesn.t exist/ })).toBeVisible();
  await page.goto('/learn/case-studies/not-a-case-study');
  await expect(page.getByRole('heading', { name: /This case study doesn.t exist/ })).toBeVisible();
  await expect(page).toHaveTitle(/Not found/);
});
