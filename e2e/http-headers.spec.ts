import { expect, test, type Page } from '@playwright/test';

function watch(page: Page, baseURL: string | undefined) {
  const origin = new URL(baseURL!).origin;
  const bad: string[] = [];
  page.on('request', (r) => {
    const url = r.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return;
    if (!url.startsWith(`${origin}/`) || r.method() !== 'GET') bad.push(`${r.method()} ${url}`);
  });
  page.on('console', (m) => m.type() === 'error' && bad.push(`console: ${m.text()}`));
  page.on('pageerror', (e) => bad.push(`pageerror: ${e.message}`));
  return bad;
}


test('explains sample headers with a security grade and caching summary', async ({ page, baseURL }) => {
  const bad = watch(page, baseURL);
  await page.goto('/tools/http-headers');
  await expect(page.getByRole('heading', { name: /understand your headers/i })).toBeVisible();
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByText(/17 response headers, status 200/)).toBeVisible();
  await expect(page.getByLabel(/^Grade /)).toBeVisible();
  await expect(page.getByText("script-src allows 'unsafe-inline': injected inline scripts will run.")).toBeVisible();
  await expect(page.getByText('Server: nginx/1.18.0 (reveals a version)')).toBeVisible();
  await expect(page.getByText('Cacheable by browsers and CDNs for 1 hour.')).toBeVisible();
  await expect(page.getByText('tracking: missing Secure, HttpOnly, SameSite.')).toBeVisible();
  await expect(page.getByText(/HSTS: tells browsers to use HTTPS only/)).toBeVisible();
  expect(bad).toEqual([]);
});

test('handles curl -v output and request headers', async ({ page }) => {
  await page.goto('/tools/http-headers');
  const box = page.getByRole('textbox', { name: /Raw headers/ });
  await box.fill('GET /api HTTP/1.1\nHost: example.com\nAuthorization: Bearer abc');
  await expect(page.getByText(/These look like request headers/)).toBeVisible();
  await box.fill('> GET / HTTP/2\n> Host: x\n>\n< HTTP/2 301\n< location: https://x/\n< cache-control: no-store');
  await expect(page.getByText(/status 301/)).toBeVisible();
  await expect(page.getByText(/Not cacheable: no-store/)).toBeVisible();
});

test('no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/http-headers');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByLabel(/^Grade /)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
