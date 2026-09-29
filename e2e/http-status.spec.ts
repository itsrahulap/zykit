import { expect, test, type Page } from '@playwright/test';

function trackRequests(page: Page) {
  const requests: { url: string; method: string }[] = [];
  const consoleErrors: string[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  return { requests, consoleErrors };
}

test('searches, filters and deep-links status codes', async ({ page }) => {
  const { requests, consoleErrors } = trackRequests(page);
  await page.goto('/tools/http-status#404');
  await expect(page).toHaveTitle(/HTTP Status Codes/);
  const origin = new URL(page.url()).origin;

  const card404 = page.locator('[id="404"]');
  await expect(card404).toHaveAttribute('data-highlighted', 'true');
  await expect(card404).toBeInViewport();

  const search = page.getByRole('searchbox');
  await search.fill('teapot');
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: "I'm a teapot" })).toBeVisible();

  await search.fill('');
  await page.getByRole('group', { name: 'Class' }).getByRole('button', { name: '5xx' }).click();
  await expect(page.locator('[id="503"]')).toBeVisible();
  await expect(page.locator('[id="200"]')).toHaveCount(0);
  await expect(page.locator('[id="503"]').getByText('Retry-After', { exact: true })).toBeVisible();

  await search.fill('zzzz');
  await expect(page.getByText(/No status code matches/)).toBeVisible();

  await page.evaluate(() => (window.location.hash = '#429'));
  await expect(page.locator('[id="429"]')).toHaveAttribute('data-highlighted', 'true');
  await expect(page.locator('[id="429"]')).toBeInViewport();

  for (const r of requests) {
    expect(r.method).toBe('GET');
    expect(r.url.startsWith(origin) || r.url.startsWith('data:')).toBe(true);
  }
  expect(consoleErrors).toEqual([]);
});

test('has no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/http-status');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
